import 'dotenv/config'
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG!)

const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);