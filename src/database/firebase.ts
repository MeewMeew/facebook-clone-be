import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import 'dotenv/config';

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG!)

const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);