// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);