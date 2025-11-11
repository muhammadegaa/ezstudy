import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableNetwork, disableNetwork } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCUoqq9KbpoaT3M2kAgzMytXgRhW3Hh_Z4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "ezstudy-54a07.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "ezstudy-54a07",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "ezstudy-54a07.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "483916833539",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:483916833539:web:5a7ce57586b49764f63f36"
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Ensure Firestore is online (disable offline persistence for now to avoid blocking writes)
if (typeof window !== 'undefined') {
  // Force online mode - disable offline persistence that blocks writes
  enableNetwork(db).catch((err) => {
    console.warn('Failed to enable network:', err);
  });
}

export default app;

