import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveToFirestore, loadFromFirestore } from './firestoreSync';

const COLLECTION_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
];

const createId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

const DEFAULT_WORKSPACE = {
  id: createId(),
  name: 'My Workspace',
  emoji: '🚀',
  collections: [
    {
      id: createId(),
      name: 'Important',
      color: '#6366f1',
      tabs: [],
    },
    {
      id: createId(),
      name: 'Reading List',
      color: '#10b981',
      tabs: [],
    },
    {
      id: createId(),
      name: 'Development',
      color: '#f59e0b',
      tabs: [],
    },
  ],
  todos: [],
};

export const useTabStore = create(
  persist(
    (set, get) => ({
      workspaces: [DEFAULT_WORKSPACE],
      activeWorkspaceId: DEFAULT_WORKSPACE.id,

      // Firebase loading state
      firebaseReady: false,

      initFromFirestore: async () => {
        const data = await loadFromFirestore();
        if (data && data.workspaces && data.workspaces.length > 0) {
          set({
            workspaces: data.workspaces,
            activeWorkspaceId: data.activeWorkspaceId || data.workspaces[0].id,
            firebaseReady: true,
          });
        } else {
          // No cloud data yet — push current local state to Firestore
          const state = get();
          saveToFirestore({
            workspaces: state.workspaces,
            activeWorkspaceId: state.activeWorkspaceId,
          });
          set({ firebaseReady: true });
        }
      },
      
      // Toast notifications
      toasts: [],
      addToast: (message, type = 'success') => {
        const id = createId();
        set((state) => ({
          toasts: [...state.toasts, { id, message, type }],
        }));
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }));
        }, 3000);
      },

      // Multi-select state (not persisted — resets on reload)
      selectionMode: false,
      selectedTabIds: [],

      toggleSelectionMode: () =>
        set((state) => ({
          selectionMode: !state.selectionMode,
          selectedTabIds: state.selectionMode ? [] : state.selectedTabIds,
        })),

      toggleSelection: (tabId) =>
        set((state) => ({
          selectedTabIds: state.selectedTabIds.includes(tabId)
            ? state.selectedTabIds.filter((id) => id !== tabId)
            : [...state.selectedTabIds, tabId],
        })),

      selectAllInCollection: (collectionId) => {
        const workspace = get().getActiveWorkspace();
        if (!workspace) return;
        const col = workspace.collections.find((c) => c.id === collectionId);
        if (!col) return;
        const colTabIds = col.tabs.map((t) => t.id);
        set((state) => {
          const merged = new Set([...state.selectedTabIds, ...colTabIds]);
          return { selectedTabIds: [...merged] };
        });
      },

      clearSelection: () => set({ selectedTabIds: [], selectionMode: false }),

      getSelectedTabData: () => {
        const state = get();
        const workspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId);
        if (!workspace) return [];
        const tabs = [];
        for (const c of workspace.collections) {
          for (const t of c.tabs) {
            if (state.selectedTabIds.includes(t.id)) {
              tabs.push({ ...t, collectionId: c.id, collectionName: c.name });
            }
          }
        }
        return tabs;
      },

      batchDelete: () => {
        const state = get();
        const ids = new Set(state.selectedTabIds);
        if (ids.size === 0) return;
        set((s) => ({
          workspaces: s.workspaces.map((w) =>
            w.id === s.activeWorkspaceId
              ? {
                  ...w,
                  collections: w.collections.map((c) => ({
                    ...c,
                    tabs: c.tabs.filter((t) => !ids.has(t.id)),
                  })),
                }
              : w
          ),
          selectedTabIds: [],
          selectionMode: false,
        }));
        get().addToast(`Deleted ${ids.size} tabs`);
      },

      batchMoveTo: (targetCollectionId) => {
        const state = get();
        const ids = new Set(state.selectedTabIds);
        if (ids.size === 0) return;
        const workspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId);
        if (!workspace) return;
        // Gather selected tab objects
        const movedTabs = [];
        for (const c of workspace.collections) {
          for (const t of c.tabs) {
            if (ids.has(t.id)) movedTabs.push(t);
          }
        }
        set((s) => ({
          workspaces: s.workspaces.map((w) => {
            if (w.id !== s.activeWorkspaceId) return w;
            return {
              ...w,
              collections: w.collections.map((c) => {
                // Remove selected from every collection
                const filtered = c.tabs.filter((t) => !ids.has(t.id));
                // Append to target
                if (c.id === targetCollectionId) {
                  return { ...c, tabs: [...filtered, ...movedTabs] };
                }
                return { ...c, tabs: filtered };
              }),
            };
          }),
          selectedTabIds: [],
          selectionMode: false,
        }));
        const targetName = workspace.collections.find((c) => c.id === targetCollectionId)?.name || 'collection';
        get().addToast(`Moved ${ids.size} tabs to "${targetName}"`);
      },

      // Workspace CRUD
      getActiveWorkspace: () => {
        const state = get();
        return state.workspaces.find((w) => w.id === state.activeWorkspaceId);
      },

      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      addWorkspace: (name, emoji) => {
        const workspace = {
          id: createId(),
          name,
          emoji,
          collections: [],
        };
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
          activeWorkspaceId: workspace.id,
        }));
        get().addToast(`Workspace "${name}" created`);
      },

      deleteWorkspace: (id) => {
        const state = get();
        if (state.workspaces.length <= 1) {
          get().addToast('Cannot delete last workspace', 'error');
          return;
        }
        const remaining = state.workspaces.filter((w) => w.id !== id);
        set({
          workspaces: remaining,
          activeWorkspaceId:
            state.activeWorkspaceId === id ? remaining[0].id : state.activeWorkspaceId,
        });
        get().addToast('Workspace deleted');
      },

      renameWorkspace: (id, name) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === id ? { ...w, name } : w
          ),
        })),

      // Collection CRUD
      addCollection: (name, color) => {
        const collection = {
          id: createId(),
          name,
          color: color || COLLECTION_COLORS[Math.floor(Math.random() * COLLECTION_COLORS.length)],
          tabs: [],
        };
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? { ...w, collections: [...w.collections, collection] }
              : w
          ),
        }));
        get().addToast(`Collection "${name}" created`);
      },

      deleteCollection: (collectionId) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? { ...w, collections: w.collections.filter((c) => c.id !== collectionId) }
              : w
          ),
        })),

      renameCollection: (collectionId, name) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? {
                  ...w,
                  collections: w.collections.map((c) =>
                    c.id === collectionId ? { ...c, name } : c
                  ),
                }
              : w
          ),
        })),

      // Tab CRUD
      addTab: (collectionId, url, title) => {
        const state = get();
        const workspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId);
        if (!workspace) return;

        // Duplicate Check across the entire workspace
        const normalizedUrl = url.trim().replace(/\/$/, '');
        let isDuplicate = false;
        for (const c of workspace.collections) {
          if (c.tabs.some((t) => t.url.trim().replace(/\/$/, '') === normalizedUrl)) {
            isDuplicate = true;
            break;
          }
        }

        if (isDuplicate) {
          get().addToast('Tab already exists in this workspace', 'error');
          return;
        }

        let hostname = '';
        try {
          hostname = new URL(url).hostname;
        } catch {
          hostname = url;
        }
        
        const tab = {
          id: createId(),
          title: title || hostname || url,
          url,
          favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
          addedAt: Date.now(),
          pinned: false,
        };
        
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? {
                  ...w,
                  collections: w.collections.map((c) =>
                    c.id === collectionId ? { ...c, tabs: [...c.tabs, tab] } : c
                  ),
                }
              : w
          ),
        }));
      },

      removeTab: (collectionId, tabId) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? {
                  ...w,
                  collections: w.collections.map((c) =>
                    c.id === collectionId
                      ? { ...c, tabs: c.tabs.filter((t) => t.id !== tabId) }
                      : c
                  ),
                }
              : w
          ),
        })),

      togglePin: (collectionId, tabId) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? {
                  ...w,
                  collections: w.collections.map((c) =>
                    c.id === collectionId
                      ? {
                          ...c,
                          tabs: c.tabs.map((t) =>
                            t.id === tabId ? { ...t, pinned: !t.pinned } : t
                          ),
                        }
                      : c
                  ),
                }
              : w
          ),
        })),

      updateTabTag: (collectionId, tabId, tag) =>
        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? {
                  ...w,
                  collections: w.collections.map((c) =>
                    c.id === collectionId
                      ? {
                          ...c,
                          tabs: c.tabs.map((t) =>
                            t.id === tabId ? { ...t, tag } : t
                          ),
                        }
                      : c
                  ),
                }
              : w
          ),
        })),

      // To-Do Actions
      addTodo: (text) => set((state) => ({
        workspaces: state.workspaces.map((w) =>
          w.id === state.activeWorkspaceId
            ? { ...w, todos: [...(w.todos || []), { id: createId(), text, completed: false }] }
            : w
        ),
      })),

      toggleTodo: (todoId) => set((state) => ({
        workspaces: state.workspaces.map((w) =>
          w.id === state.activeWorkspaceId
            ? {
                ...w,
                todos: (w.todos || []).map((t) =>
                  t.id === todoId ? { ...t, completed: !t.completed } : t
                ),
              }
            : w
        ),
      })),

      deleteTodo: (todoId) => set((state) => ({
        workspaces: state.workspaces.map((w) =>
          w.id === state.activeWorkspaceId
            ? {
                ...w,
                todos: (w.todos || []).filter((t) => t.id !== todoId),
              }
            : w
        ),
      })),

      // Drag & Drop — move tab between collections
      moveTab: (fromCollectionId, toCollectionId, tabId, toIndex) => {
        set((state) => {
          const workspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId);
          if (!workspace) return state;

          const fromCollection = workspace.collections.find((c) => c.id === fromCollectionId);
          if (!fromCollection) return state;

          const tab = fromCollection.tabs.find((t) => t.id === tabId);
          if (!tab) return state;

          return {
            workspaces: state.workspaces.map((w) => {
              if (w.id !== state.activeWorkspaceId) return w;
              return {
                ...w,
                collections: w.collections.map((c) => {
                  if (c.id === fromCollectionId && c.id === toCollectionId) {
                    // Reorder within same collection
                    const filteredTabs = c.tabs.filter((t) => t.id !== tabId);
                    const insertIndex = Math.min(toIndex, filteredTabs.length);
                    filteredTabs.splice(insertIndex, 0, tab);
                    return { ...c, tabs: filteredTabs };
                  }
                  if (c.id === fromCollectionId) {
                    return { ...c, tabs: c.tabs.filter((t) => t.id !== tabId) };
                  }
                  if (c.id === toCollectionId) {
                    const newTabs = [...c.tabs];
                    const insertIndex = Math.min(toIndex, newTabs.length);
                    newTabs.splice(insertIndex, 0, tab);
                    return { ...c, tabs: newTabs };
                  }
                  return c;
                }),
              };
            }),
          };
        });
      },

      // Bulk import tabs
      importTabs: (collectionId, tabsData) => {
        const state = get();
        const workspace = state.workspaces.find((w) => w.id === state.activeWorkspaceId);
        if (!workspace) return;

        // Collect all existing normalized URLs in workspace
        const existingUrls = new Set();
        workspace.collections.forEach(c => {
          c.tabs.forEach(t => existingUrls.add(t.url.trim().replace(/\/$/, '')));
        });

        const uniqueTabs = [];
        let duplicateCount = 0;

        for (const t of tabsData) {
          const normalized = t.url.trim().replace(/\/$/, '');
          if (existingUrls.has(normalized)) {
            duplicateCount++;
          } else {
            uniqueTabs.push(t);
            existingUrls.add(normalized); // Prevent duplicates within the import batch itself
          }
        }

        if (uniqueTabs.length === 0) {
          get().addToast(`All ${tabsData.length} tabs were duplicates (skipped)`, 'error');
          return;
        }

        const tabs = uniqueTabs.map((t) => {
          let hostname = '';
          try {
            hostname = new URL(t.url).hostname;
          } catch {
            hostname = t.url;
          }
          return {
            id: createId(),
            title: t.title || hostname || t.url,
            url: t.url,
            favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`,
            addedAt: Date.now(),
            pinned: false,
          };
        });

        set((state) => ({
          workspaces: state.workspaces.map((w) =>
            w.id === state.activeWorkspaceId
              ? {
                  ...w,
                  collections: w.collections.map((c) =>
                    c.id === collectionId
                      ? { ...c, tabs: [...c.tabs, ...tabs] }
                      : c
                  ),
                }
              : w
          ),
        }));

        const msg = duplicateCount > 0 
          ? `Imported ${tabs.length} tabs (${duplicateCount} duplicates skipped)` 
          : `Imported ${tabs.length} tabs`;
        get().addToast(msg);
      },

      // Search
      searchTabs: (query) => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        const results = [];
        const state = get();
        for (const w of state.workspaces) {
          for (const c of w.collections) {
            for (const t of c.tabs) {
              if (
                t.title.toLowerCase().includes(q) ||
                t.url.toLowerCase().includes(q)
              ) {
                results.push({
                  ...t,
                  workspaceName: w.name,
                  workspaceEmoji: w.emoji,
                  collectionName: c.name,
                  collectionColor: c.color,
                });
              }
            }
          }
        }
        return results;
      },

      // Stats
      getTotalTabs: () => {
        const state = get();
        return state.workspaces.reduce(
          (sum, w) => sum + w.collections.reduce((s, c) => s + c.tabs.length, 0),
          0
        );
      },

      getTotalCollections: () => {
        const state = get();
        return state.workspaces.reduce((sum, w) => sum + w.collections.length, 0);
      },
    }),
    {
      name: 'tab-manager-2.0-storage',
      partialize: (state) => ({
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
      }),
    }
  )
);

// Subscribe to state changes and sync to Firestore
let prevWorkspaces = useTabStore.getState().workspaces;
let prevActiveId = useTabStore.getState().activeWorkspaceId;

useTabStore.subscribe((state) => {
  // Only sync when persisted data actually changes
  if (state.workspaces !== prevWorkspaces || state.activeWorkspaceId !== prevActiveId) {
    prevWorkspaces = state.workspaces;
    prevActiveId = state.activeWorkspaceId;
    saveToFirestore({
      workspaces: state.workspaces,
      activeWorkspaceId: state.activeWorkspaceId,
    });
  }
});
