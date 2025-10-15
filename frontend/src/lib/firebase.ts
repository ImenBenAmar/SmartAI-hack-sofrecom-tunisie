import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAlE2TXx0PzYU_F5keZ9oHqPVCgM1a3cNg",
  authDomain: "hackathon-sofrecom-83109.firebaseapp.com",
  databaseURL: "https://hackathon-sofrecom-83109-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "hackathon-sofrecom-83109",
  storageBucket: "hackathon-sofrecom-83109.firebasestorage.app",
  messagingSenderId: "420130179721",
  appId: "1:420130179721:web:10b5c774f60179d7ab1458",
  measurementId: "G-TK1GPKDF90"
};

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const database = getDatabase(app);

export { app, database };
