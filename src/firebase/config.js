import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDIMujfOnjacLlpLU8xG4qQ2zY5BTRjUZ8",
  authDomain: "tournament-8583c.firebaseapp.com",
  projectId: "tournament-8583c",
  messagingSenderId: "452936388188",
  appId: "1:452936388188:web:83518c20965aa6955b2099",
  measurementId: "G-GMNJ34MMHP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
