
import { ConversationAnalysis, Reminder, TaskProgress, ChatMessage } from '../types.ts';

class BaseStore<T extends { id: string }> {
  constructor(private key: string) {}

  async fetchAll(): Promise<T[]> {
    const raw = localStorage.getItem(this.key);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch { 
      return []; 
    }
  }

  async persist(data: T): Promise<void> {
    const all = await this.fetchAll();
    localStorage.setItem(this.key, JSON.stringify([data, ...all]));
  }

  async update(id: string, patch: Partial<T>): Promise<void> {
    const all = await this.fetchAll();
    const updated = all.map(item => item.id === id ? { ...item, ...patch } : item);
    localStorage.setItem(this.key, JSON.stringify(updated));
  }

  async remove(id: string): Promise<void> {
    const all = await this.fetchAll();
    localStorage.setItem(this.key, JSON.stringify(all.filter(item => item.id !== id)));
  }

  clear(): void {
    localStorage.removeItem(this.key);
  }
}

const convStore = new BaseStore<ConversationAnalysis>('texta_convs');
const remStore = new BaseStore<Reminder>('texta_rems');

export const Storage = {
  saveConversation: async (conv: ConversationAnalysis) => {
    await convStore.persist(conv);
    const newRems: Reminder[] = conv.actionItems.map((item, i) => ({
      id: `${conv.id}_${i}`,
      conversationId: conv.id,
      text: item.task,
      priority: item.priority,
      progress: 'Not Started',
      createdAt: Date.now()
    }));
    for (const r of newRems) await remStore.persist(r);
  },
  updateConversationChat: (id: string, history: ChatMessage[]) => convStore.update(id, { chatHistory: history }),
  getConversations: () => convStore.fetchAll(),
  getReminders: () => remStore.fetchAll(),
  deleteConversation: async (id: string) => {
    await convStore.remove(id);
    const allRems = await remStore.fetchAll();
    for (const r of allRems) {
      if (r.conversationId === id) await remStore.remove(r.id);
    }
  },
  updateReminder: (id: string, patch: Partial<Reminder>) => remStore.update(id, patch),
  updateReminderProgress: (id: string, progress: TaskProgress) => remStore.update(id, { progress }),
  clearAll: () => {
    convStore.clear();
    remStore.clear();
  }
};
