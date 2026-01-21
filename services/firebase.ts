
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBpaLUHZDNW4-07tzW7rS3RAHDAboxvqg4",
  authDomain: "texta-fc5f0.firebaseapp.com",
  projectId: "texta-fc5f0",
  storageBucket: "texta-fc5f0.firebasestorage.app",
  messagingSenderId: "599427521578",
  appId: "1:599427521578:web:c4223e016bf0fd928bb753",
  measurementId: "G-KYR5W542YF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
