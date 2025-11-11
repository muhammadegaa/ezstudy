import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './config';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  role: 'student' | 'tutor';
  createdAt: any; // Timestamp
  updatedAt: any; // Timestamp
}

const USERS_COLLECTION = 'users';

// Create or update user profile
export async function createOrUpdateUserProfile(
  userId: string,
  data: {
    email: string;
    displayName: string;
    role: 'student' | 'tutor';
  }
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userId);
  const existingDoc = await getDoc(userRef);

  if (existingDoc.exists()) {
    // Update existing profile
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } else {
    // Create new profile
    await setDoc(userRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

// Get user profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    return {
      userId: userSnap.id,
      ...userSnap.data(),
    } as UserProfile;
  } catch (error: any) {
    // If offline error, return null instead of throwing (profile is optional)
    if (error.code === 'unavailable' || error.message?.includes('offline')) {
      console.warn('User profile unavailable (offline):', error);
      return null;
    }
    throw error;
  }
}

