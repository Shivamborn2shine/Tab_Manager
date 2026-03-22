import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const DOC_REF = doc(db, 'appData', 'tabManager');

// Debounce timer
let debounceTimer = null;

/**
 * Save state to Firestore (debounced).
 * Only persists workspaces and activeWorkspaceId.
 */
export const saveToFirestore = (state) => {
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    try {
      await setDoc(DOC_REF, {
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Firestore save failed:', err);
    }
  }, 500);
};

/**
 * Load state from Firestore.
 * Returns the saved state object or null if nothing exists yet.
 */
export const loadFromFirestore = async () => {
  try {
    const snap = await getDoc(DOC_REF);
    if (snap.exists()) {
      const data = snap.data();
      return {
        workspaces: data.workspaces || [],
        activeWorkspaceId: data.activeWorkspaceId || null,
      };
    }
    return null;
  } catch (err) {
    console.error('Firestore load failed:', err);
    return null;
  }
};
