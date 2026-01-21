
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  updateDoc 
} from "firebase/firestore";
import { ref, getDownloadURL, deleteObject, uploadBytes } from "firebase/storage";
import { db, storage, auth } from "./firebase.ts";
import { EncryptionService } from "./encryptionService.ts";
import { ConversationAnalysis, Reminder, TaskProgress, ChatMessage } from "../types.ts";

const ARCHIVE_DURATION_MS = 15 * 24 * 60 * 60 * 1000; // 15 Days

class FirebaseVault {
  private async getUserId(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error("Unauthorized access to Intelligence Node.");
    return user.uid;
  }

  private base64ToBlob(base64: string, mime: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mime });
  }

  async createReminder(text: string, priority: string = 'Medium'): Promise<void> {
    const uid = await this.getUserId();
    const id = `manual_${Math.random().toString(36).substring(7)}`;
    const reminder: Reminder = {
      id,
      conversationId: 'standalone',
      text,
      priority: priority as any,
      progress: 'Not Started',
      createdAt: Date.now()
    };
    const remEnc = await EncryptionService.encrypt(reminder);
    await setDoc(doc(db, "users", uid, "reminders", id), {
      payload: remEnc.ciphertext,
      iv: remEnc.iv,
      timestamp: reminder.createdAt,
      id
    });
  }

  async saveConversation(conv: ConversationAnalysis, audioBase64?: string, mimeType?: string): Promise<void> {
    const uid = await this.getUserId();
    let audioUrl = "";
    if (audioBase64 && mimeType) {
      const storageRef = ref(storage, `records/${uid}/${conv.id}.${mimeType.split('/')[1] || 'webm'}`);
      const audioBlob = this.base64ToBlob(audioBase64, mimeType);
      await uploadBytes(storageRef, audioBlob);
      audioUrl = await getDownloadURL(storageRef);
    }

    const { ciphertext, iv } = await EncryptionService.encrypt({ ...conv, audioUrl });
    await setDoc(doc(db, "users", uid, "conversations", conv.id), {
      payload: ciphertext,
      iv: iv,
      timestamp: conv.timestamp,
      id: conv.id
    });

    for (const [i, item] of conv.actionItems.entries()) {
      const reminder: Reminder = {
        id: `${conv.id}_${i}`,
        conversationId: conv.id,
        text: item.task,
        priority: item.priority,
        progress: 'Not Started',
        createdAt: Date.now()
      };
      const remEnc = await EncryptionService.encrypt(reminder);
      await setDoc(doc(db, "users", uid, "reminders", reminder.id), {
        payload: remEnc.ciphertext,
        iv: remEnc.iv,
        timestamp: reminder.createdAt,
        id: reminder.id
      });
    }
  }

  async fetchConversations(includeArchived: boolean = false): Promise<ConversationAnalysis[]> {
    const uid = await this.getUserId();
    const q = query(collection(db, "users", uid, "conversations"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    const results: ConversationAnalysis[] = [];
    const now = Date.now();

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const decrypted: ConversationAnalysis = await EncryptionService.decrypt(data.payload, data.iv);
      
      // Cleanup logic: If archived and older than 15 days, delete permanently
      if (decrypted.archivedAt && (now - decrypted.archivedAt > ARCHIVE_DURATION_MS)) {
        await this.deletePermanently(decrypted.id);
        continue;
      }

      if (includeArchived) {
        results.push(decrypted);
      } else if (!decrypted.archivedAt) {
        results.push(decrypted);
      }
    }
    return results;
  }

  async fetchReminders(): Promise<Reminder[]> {
    const uid = await this.getUserId();
    const q = query(collection(db, "users", uid, "reminders"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    const results: Reminder[] = [];
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const decrypted = await EncryptionService.decrypt(data.payload, data.iv);
      results.push(decrypted);
    }
    return results;
  }

  async updateConversationChat(id: string, history: ChatMessage[]): Promise<void> {
    const uid = await this.getUserId();
    const docRef = doc(db, "users", uid, "conversations", id);
    const snap = await getDocs(query(collection(db, "users", uid, "conversations"), where("id", "==", id)));
    if (!snap.empty) {
      const currentData = snap.docs[0].data();
      const conv = await EncryptionService.decrypt(currentData.payload, currentData.iv);
      conv.chatHistory = history;
      const { ciphertext, iv } = await EncryptionService.encrypt(conv);
      await updateDoc(docRef, { payload: ciphertext, iv: iv });
    }
  }

  async updateReminderProgress(id: string, progress: TaskProgress): Promise<void> {
    const uid = await this.getUserId();
    const docRef = doc(db, "users", uid, "reminders", id);
    const snap = await getDocs(query(collection(db, "users", uid, "reminders"), where("id", "==", id)));
    if (!snap.empty) {
      const currentData = snap.docs[0].data();
      const rem = await EncryptionService.decrypt(currentData.payload, currentData.iv);
      rem.progress = progress;
      const { ciphertext, iv } = await EncryptionService.encrypt(rem);
      await updateDoc(docRef, { payload: ciphertext, iv: iv });
    }
  }

  /**
   * Archives a conversation instead of deleting it immediately.
   */
  async deleteConversation(id: string): Promise<void> {
    const uid = await this.getUserId();
    const docRef = doc(db, "users", uid, "conversations", id);
    const snap = await getDocs(query(collection(db, "users", uid, "conversations"), where("id", "==", id)));
    if (!snap.empty) {
      const currentData = snap.docs[0].data();
      const conv = await EncryptionService.decrypt(currentData.payload, currentData.iv);
      
      // Mark as archived
      conv.archivedAt = Date.now();
      
      const { ciphertext, iv } = await EncryptionService.encrypt(conv);
      await updateDoc(docRef, { payload: ciphertext, iv: iv });
    }
  }

  async restoreConversation(id: string): Promise<void> {
    const uid = await this.getUserId();
    const docRef = doc(db, "users", uid, "conversations", id);
    const snap = await getDocs(query(collection(db, "users", uid, "conversations"), where("id", "==", id)));
    if (!snap.empty) {
      const currentData = snap.docs[0].data();
      const conv = await EncryptionService.decrypt(currentData.payload, currentData.iv);
      
      // Remove archived status
      delete conv.archivedAt;
      
      const { ciphertext, iv } = await EncryptionService.encrypt(conv);
      await updateDoc(docRef, { payload: ciphertext, iv: iv });
    }
  }

  async deletePermanently(id: string): Promise<void> {
    const uid = await this.getUserId();
    const snap = await getDocs(query(collection(db, "users", uid, "conversations"), where("id", "==", id)));
    if (!snap.empty) {
      const currentData = snap.docs[0].data();
      const conv = await EncryptionService.decrypt(currentData.payload, currentData.iv);
      if (conv.audioUrl) {
        try {
          const urlParts = new URL(conv.audioUrl).pathname.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const storageRef = ref(storage, `records/${uid}/${decodeURIComponent(fileName)}`);
          await deleteObject(storageRef);
        } catch(e) {
          console.warn("Could not delete audio file from storage", e);
        }
      }
    }
    await deleteDoc(doc(db, "users", uid, "conversations", id));
    
    // Also delete associated reminders
    const qReminders = query(collection(db, "users", uid, "reminders"));
    const snapshotRem = await getDocs(qReminders);
    for (const d of snapshotRem.docs) {
      if (d.id.startsWith(id)) await deleteDoc(d.ref);
    }
  }

  async deleteReminder(id: string): Promise<void> {
    const uid = await this.getUserId();
    await deleteDoc(doc(db, "users", uid, "reminders", id));
  }

  async clearAll(): Promise<void> {
    const uid = await this.getUserId();
    const convs = await getDocs(collection(db, "users", uid, "conversations"));
    for (const d of convs.docs) await this.deletePermanently(d.id);
  }

  async updateReminder(id: string, patch: any): Promise<void> {
    const uid = await this.getUserId();
    const docRef = doc(db, "users", uid, "reminders", id);
    const snap = await getDocs(query(collection(db, "users", uid, "reminders"), where("id", "==", id)));
    if (!snap.empty) {
      const currentData = snap.docs[0].data();
      const rem = await EncryptionService.decrypt(currentData.payload, currentData.iv);
      Object.assign(rem, patch);
      const { ciphertext, iv } = await EncryptionService.encrypt(rem);
      await updateDoc(docRef, { payload: ciphertext, iv: iv });
    }
  }
}

const vault = new FirebaseVault();
export const Storage = vault;
