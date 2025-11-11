import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  User,
  UserCredential,
} from 'firebase/auth';
import { auth } from './config';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Sign up with email and password
export async function signUp(email: string, password: string, displayName?: string): Promise<UserCredential> {
  // Validate email format (Gmail or regular email)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  // Validate password (minimum 6 characters)
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update display name if provided
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }

  return userCredential;
}

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

// Sign out
export async function logOut(): Promise<void> {
  return signOut(auth);
}

// Send password reset email
export async function resetPassword(email: string): Promise<void> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  return sendPasswordResetEmail(auth, email);
}

// Convert Firebase User to AuthUser
export function userToAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

// Sign in with Google
export async function signInWithGoogle(): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
  });
  return signInWithPopup(auth, provider);
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

