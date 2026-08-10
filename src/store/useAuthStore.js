import { create } from 'zustand';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export const useAuthStore = create((set, get) => ({
  user: null,
  authLoading: true,
  authError: null,

  /**
   * Initialize the auth listener. Call once in App.jsx.
   * Returns the unsubscribe function.
   */
  initAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        set({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            photoURL: firebaseUser.photoURL,
          },
          authLoading: false,
          authError: null,
        });
      } else {
        set({
          user: null,
          authLoading: false,
          authError: null,
        });
      }
    });
    return unsubscribe;
  },

  /**
   * Sign in with Google popup.
   */
  signInWithGoogle: async () => {
    set({ authError: null, authLoading: true });
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle setting the user
    } catch (err) {
      console.error('Google sign-in failed:', err);
      let message = `Google sign-in failed: ${err.message || 'Please try again.'}`;
      if (err.code === 'auth/popup-closed-by-user') {
        message = 'Sign-in popup was closed. Please try again.';
      } else if (err.code === 'auth/popup-blocked') {
        message = 'Sign-in popup was blocked by your browser. Please allow popups.';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = 'Google sign-in is disabled in your Firebase console under Authentication > Sign-in method.';
      } else if (err.code) {
        message = `Google sign-in error (${err.code}): ${err.message}`;
      }
      set({ authError: message, authLoading: false });
    }
  },

  /**
   * Sign in with email and password.
   */
  signInWithEmail: async (email, password) => {
    set({ authError: null, authLoading: true });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error('Email sign-in failed:', err);
      let message = 'Sign-in failed. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        message = 'No account found with this email, or wrong password.';
      } else if (err.code === 'auth/wrong-password') {
        message = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please wait a moment.';
      }
      set({ authError: message, authLoading: false });
    }
  },

  /**
   * Create a new account with email and password.
   */
  signUpWithEmail: async (email, password, displayName) => {
    set({ authError: null, authLoading: true });
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
      // onAuthStateChanged will handle setting the user
    } catch (err) {
      console.error('Email sign-up failed:', err);
      let message = 'Sign-up failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists. Try signing in.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      }
      set({ authError: message, authLoading: false });
    }
  },

  /**
   * Sign out the current user.
   */
  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will set user to null
    } catch (err) {
      console.error('Sign-out failed:', err);
    }
  },

  clearError: () => set({ authError: null }),
}));
