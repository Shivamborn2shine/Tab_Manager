import { useState, useEffect, useCallback } from 'react';
import { useTabStore } from './store/useTabStore';
import Sidebar from './components/Sidebar';
import Board from './components/Board';
import TopBar from './components/TopBar';
import CommandPalette from './components/CommandPalette';
import AddWorkspaceModal from './components/AddWorkspaceModal';
import AddCollectionModal from './components/AddCollectionModal';
import ImportTabsModal from './components/ImportTabsModal';
import Toast from './components/Toast';

export default function App() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [addWorkspaceOpen, setAddWorkspaceOpen] = useState(false);
  const [addCollectionOpen, setAddCollectionOpen] = useState(false);
  const [importTabsOpen, setImportTabsOpen] = useState(false);
  const [incomingTabs, setIncomingTabs] = useState(null);

  const toasts = useTabStore((s) => s.toasts);
  const getActiveWorkspace = useTabStore((s) => s.getActiveWorkspace);
  const importTabs = useTabStore((s) => s.importTabs);
  const addToast = useTabStore((s) => s.addToast);
  const firebaseReady = useTabStore((s) => s.firebaseReady);
  const initFromFirestore = useTabStore((s) => s.initFromFirestore);

  // Load data from Firestore on mount
  useEffect(() => {
    initFromFirestore();
  }, []);

  // Detect incoming tabs from Chrome extension via URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#import=')) {
      try {
        const encoded = hash.slice('#import='.length);
        const tabsData = JSON.parse(decodeURIComponent(encoded));

        if (Array.isArray(tabsData) && tabsData.length > 0) {
          // Always open import modal so user can pick a collection
          setIncomingTabs(tabsData);
          setImportTabsOpen(true);
          addToast(`${tabsData.length} tabs ready to import — pick a collection!`);
        }
      } catch (err) {
        console.error('Failed to parse incoming tabs:', err);
        addToast('Failed to import tabs — invalid data', 'error');
      }

      // Clean the URL hash
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((v) => !v);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setAddWorkspaceOpen(false);
        setAddCollectionOpen(false);
        setImportTabsOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Global drag and drop for external URLs
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    // Only show global overlay if dragging an external item (like a URL string)
    // rather than dragging an internal tab card
    if (e.dataTransfer.types.includes('text/uri-list') || e.dataTransfer.types.includes('text/plain')) {
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDraggingOver(false);

      const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
      if (!url) return;

      const trimmedUrl = url.trim();
      if (!trimmedUrl.startsWith('http')) return;

      const workspace = getActiveWorkspace();
      if (workspace && workspace.collections.length > 0) {
        importTabs(workspace.collections[0].id, [{ url: trimmedUrl, title: '' }]);
        addToast('Tab saved from drag-and-drop');
      } else {
        addToast('Create a collection first', 'error');
      }
    },
    [getActiveWorkspace, importTabs, addToast]
  );

  if (!firebaseReady) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner"></div>
        <p>Loading your tabs from the cloud…</p>
      </div>
    );
  }

  return (
    <div
      className="app-layout"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Sidebar
        onAddWorkspace={() => setAddWorkspaceOpen(true)}
      />
      <div className="main-content">
        <TopBar
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onAddCollection={() => setAddCollectionOpen(true)}
          onImportTabs={() => setImportTabsOpen(true)}
        />
        <Board />
      </div>

      {commandPaletteOpen && (
        <CommandPalette onClose={() => setCommandPaletteOpen(false)} />
      )}

      {addWorkspaceOpen && (
        <AddWorkspaceModal onClose={() => setAddWorkspaceOpen(false)} />
      )}

      {addCollectionOpen && (
        <AddCollectionModal onClose={() => setAddCollectionOpen(false)} />
      )}

      {importTabsOpen && (
        <ImportTabsModal
          onClose={() => {
            setImportTabsOpen(false);
            setIncomingTabs(null);
          }}
          prefillTabs={incomingTabs}
        />
      )}

      <div className="toast-container">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} />
        ))}
      </div>

      {isDraggingOver && (
        <div className="global-drop-overlay">
          <div className="global-drop-overlay-content">
            <svg className="global-drop-overlay-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <div className="global-drop-overlay-text">Drop URL to save</div>
          </div>
        </div>
      )}
    </div>
  );
}
