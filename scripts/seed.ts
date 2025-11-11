// scripts/seed.ts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { getMockTutors } from '../lib/mockData.js';

// Manually configure Firebase for the script
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

const TUTORS_COLLECTION = 'tutors';

async function seedTutors() {
  const batch = writeBatch(db);
  const tutorsCollection = collection(db, TUTORS_COLLECTION);
  const mockTutors = getMockTutors();

  console.log('Starting to seed tutors...');

  mockTutors.forEach((tutor) => {
    const docRef = doc(tutorsCollection);
    batch.set(docRef, {
      ...tutor,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });

  try {
    await batch.commit();
    console.log(`Successfully seeded ${mockTutors.length} tutors.`);
  } catch (error) {
    console.error('Error seeding tutors:', error);
  }
}

seedTutors();
