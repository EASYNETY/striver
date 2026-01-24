import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
    apiKey: "AIzaSyDPetcaLxIQEqVfB2Slc9Xf6UnbHeKSkTE",
    authDomain: "striver-app-48562.firebaseapp.com",
    projectId: "striver-app-48562",
    storageBucket: "striver-app-48562.firebasestorage.app",
    messagingSenderId: "565139145984",
    appId: "1:565139145984:web:8656cc3e37c64a382fdfe5" // Dummy web ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app, 'us-central1');

export default app;
