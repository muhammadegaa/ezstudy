import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';

// Types
export interface Tutor {
  id: string;
  userId: string; // Firebase Auth UID
  name: string;
  email: string;
  subjects: string[];
  languages: string[];
  rating: number;
  studentsCount: number;
  pricePerHour: number;
  bio: string;
  available: boolean;
  avatar?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Session {
  id: string;
  studentId: string; // Firebase Auth UID
  studentName: string;
  studentEmail: string;
  tutorId: string; // Firebase Auth UID
  tutorName: string;
  tutorEmail: string;
  subject: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  scheduledTime?: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  peerId?: string; // For WebRTC connection
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Tutors Collection
const TUTORS_COLLECTION = 'tutors';
const SESSIONS_COLLECTION = 'sessions';

// Create or update tutor profile
export async function createOrUpdateTutor(tutorId: string, tutorData: Omit<Tutor, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const tutorRef = doc(db, TUTORS_COLLECTION, tutorId);
  const existingDoc = await getDoc(tutorRef);

  if (existingDoc.exists()) {
    // Update existing tutor
    await updateDoc(tutorRef, {
      ...tutorData,
      updatedAt: serverTimestamp(),
    });
  } else {
    // Create new tutor
    await setDoc(tutorRef, {
      ...tutorData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

// Get tutor by ID
export async function getTutor(tutorId: string): Promise<Tutor | null> {
  const tutorRef = doc(db, TUTORS_COLLECTION, tutorId);
  const tutorSnap = await getDoc(tutorRef);

  if (!tutorSnap.exists()) {
    return null;
  }

  return {
    id: tutorSnap.id,
    ...tutorSnap.data(),
  } as Tutor;
}

// Get tutor by userId (Firebase Auth UID)
export async function getTutorByUserId(userId: string): Promise<Tutor | null> {
  const q = query(
    collection(db, TUTORS_COLLECTION),
    where('userId', '==', userId),
    limit(1)
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as Tutor;
}

// Get all tutors (with optional filters)
export async function getTutors(filters?: {
  available?: boolean;
  subjects?: string[];
  languages?: string[];
  limitCount?: number;
}): Promise<Tutor[]> {
  const constraints: QueryConstraint[] = [];

  if (filters?.available !== undefined) {
    constraints.push(where('available', '==', filters.available));
  }

  if (filters?.limitCount) {
    constraints.push(limit(filters.limitCount));
  }

  constraints.push(orderBy('rating', 'desc'));

  const q = query(collection(db, TUTORS_COLLECTION), ...constraints);
  const querySnapshot = await getDocs(q);

  let tutors = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Tutor[];

  // Client-side filtering for subjects and languages (Firestore doesn't support array-contains-any easily)
  if (filters?.subjects && filters.subjects.length > 0) {
    tutors = tutors.filter((tutor) =>
      filters.subjects!.some((subject) => tutor.subjects.includes(subject))
    );
  }

  if (filters?.languages && filters.languages.length > 0) {
    tutors = tutors.filter((tutor) =>
      filters.languages!.some((lang) => tutor.languages.includes(lang))
    );
  }

  return tutors;
}

// Create a session
export async function createSession(sessionData: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const sessionsRef = collection(db, SESSIONS_COLLECTION);
    const newSessionRef = doc(sessionsRef);

    await setDoc(newSessionRef, {
      ...sessionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newSessionRef.id;
  } catch (error: any) {
    // Log to Sentry
    const { captureException } = await import('@/lib/sentry');
    captureException(error instanceof Error ? error : new Error(String(error)), {
      operation: 'createSession',
      sessionData: { ...sessionData, studentId: sessionData.studentId ? '[REDACTED]' : '', tutorId: sessionData.tutorId ? '[REDACTED]' : '' },
    });

    // Provide more helpful error messages
    if (error.code === 'unavailable' || error.message?.includes('offline')) {
      throw new Error('Unable to create session. Please check your internet connection and try again.');
    }
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please make sure you are signed in and have the correct permissions.');
    }
    throw error;
  }
}

// Get session by ID
export async function getSession(sessionId: string): Promise<Session | null> {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
  const sessionSnap = await getDoc(sessionRef);

  if (!sessionSnap.exists()) {
    return null;
  }

  return {
    id: sessionSnap.id,
    ...sessionSnap.data(),
  } as Session;
}

// Get sessions for a user (student or tutor)
export async function getUserSessions(userId: string, role: 'student' | 'tutor'): Promise<Session[]> {
  const field = role === 'student' ? 'studentId' : 'tutorId';
  const q = query(
    collection(db, SESSIONS_COLLECTION),
    where(field, '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Session[];
}

// Update session
export async function updateSession(sessionId: string, updates: Partial<Session>): Promise<void> {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
  await updateDoc(sessionRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

// Delete session
export async function deleteSession(sessionId: string): Promise<void> {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
  await deleteDoc(sessionRef);
}

