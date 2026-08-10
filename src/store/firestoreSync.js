import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Legacy path (single-user era)
const LEGACY_DOC_REF = doc(db, 'appData', 'tabManager');

/**
 * Get the per-user document reference.
 */
const getUserDocRef = (uid) => doc(db, 'users', uid, 'data', 'tabManager');

// Debounce timer for saving
let debounceTimer = null;

/**
 * Save state to Firestore (debounced), scoped to a specific user.
 * Only persists workspaces and activeWorkspaceId.
 */
export const saveToFirestore = (uid, state, onStatusChange) => {
  if (!uid) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  if (onStatusChange) onStatusChange('syncing');

  debounceTimer = setTimeout(async () => {
    try {
      await setDoc(getUserDocRef(uid), {
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
        updatedAt: serverTimestamp(),
      });
      if (onStatusChange) onStatusChange('synced');
    } catch (err) {
      console.warn('Firestore save notice:', err.message || err);
      if (onStatusChange) onStatusChange('offline');
    }
  }, 600);
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

/**
 * Real-time listener for Firestore changes, scoped to a specific user.
 * Returns the unsubscribe function.
 */
export const subscribeToFirestore = (uid, onData, onError) => {
  if (!uid) return () => {};
  try {
    const unsubscribe = onSnapshot(
      getUserDocRef(uid),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return; // Ignore local writes to prevent sync loop
        
        if (snap.exists()) {
          const data = snap.data();
          if (data && Array.isArray(data.workspaces)) {
            onData({
              workspaces: data.workspaces,
              activeWorkspaceId: data.activeWorkspaceId || null,
            });
          }
        }
      },
      (err) => {
        console.warn('Firestore subscription notice:', err.message || err);
        if (onError) onError(err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Firestore subscribe error:', err);
    if (onError) onError(err);
    return () => {};
  }
};
