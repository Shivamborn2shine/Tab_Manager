import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Legacy path (single-user era)
const LEGACY_DOC_REF = doc(db, 'appData', 'tabManager');

/**
 * Get the per-user document reference.
 */
const getUserDocRef = (uid) => doc(db, 'users', uid, 'data', 'tabManager');

/**
 * Save state to Firestore manually.
 * Only persists workspaces and activeWorkspaceId.
 */
export const saveToFirestore = async (uid, state) => {
  if (!uid) throw new Error('No user ID provided');
  await setDoc(getUserDocRef(uid), {
    workspaces: state.workspaces,
    activeWorkspaceId: state.activeWorkspaceId,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Load state once from Firestore, scoped to a specific user.
 * Returns the saved state object or an object indicating error/empty.
 */
export const loadFromFirestore = async (uid) => {
  if (!uid) return { error: true, message: 'No user ID provided' };
  try {
    const snap = await getDoc(getUserDocRef(uid));
    if (snap.exists()) {
      const data = snap.data();
      return {
        workspaces: data.workspaces || [],
        activeWorkspaceId: data.activeWorkspaceId || null,
      };
    }
    return { empty: true };
  } catch (err) {
    console.warn('Firestore load notice:', err.message || err);
    return { error: true, message: err.message };
  }
};
