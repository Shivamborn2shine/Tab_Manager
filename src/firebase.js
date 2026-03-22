import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAEcr5_xGZWLT0Bmiy_erg5vLkqTw50jFs",
  authDomain: "tab-manager-d411f.firebaseapp.com",
  projectId: "tab-manager-d411f",
  storageBucket: "tab-manager-d411f.firebasestorage.app",
  messagingSenderId: "245137814111",
  appId: "1:245137814111:web:40efebe12433c50b26a1ea",
  measurementId: "G-87TBLTY33Z"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
