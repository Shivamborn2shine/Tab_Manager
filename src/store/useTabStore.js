import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveToFirestore, loadFromFirestore, subscribeToFirestore } from './firestoreSync';

const COLLECTION_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
];

const createId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

export const SAMPLE_WORKSPACES = [
  {
    id: 'ws-main',
    name: 'My Workspace',
    emoji: '🚀',
    collections: [
      {
        id: 'col-important',
        name: 'Important',
        color: '#6366f1',
        tabs: [
          {
            id: 'tab-1',
            title: 'GitHub - Where code is built',
            url: 'https://github.com',
            favicon: 'https://www.google.com/s2/favicons?domain=github.com&sz=32',
            addedAt: Date.now() - 3600000,
            pinned: true,
            tag: 'Code',
          },
          {
            id: 'tab-2',
            title: 'Gmail - Email Inbox',
            url: 'https://mail.google.com',
            favicon: 'https://www.google.com/s2/favicons?domain=mail.google.com&sz=32',
            addedAt: Date.now() - 7200000,
            pinned: false,
            tag: 'Work',
          },
          {
            id: 'tab-3',
            title: 'ChatGPT - AI Assistant',
            url: 'https://chatgpt.com',
            favicon: 'https://www.google.com/s2/favicons?domain=chatgpt.com&sz=32',
            addedAt: Date.now() - 10800000,
            pinned: false,
            tag: 'AI',
          },
        ],
      },
      {
        id: 'col-reading',
        name: 'Reading List',
        color: '#10b981',
        tabs: [
          {
            id: 'tab-4',
            title: 'Hacker News - Tech & Startup News',
            url: 'https://news.ycombinator.com',
            favicon: 'https://www.google.com/s2/favicons?domain=news.ycombinator.com&sz=32',
            addedAt: Date.now() - 14400000,
            pinned: false,
            tag: 'News',
          },
          {
            id: 'tab-5',
            title: 'DEV Community - Developer Articles',
            url: 'https://dev.to',
            favicon: 'https://www.google.com/s2/favicons?domain=dev.to&sz=32',
            addedAt: Date.now() - 18000000,
            pinned: false,
            tag: 'Articles',
          },
        ],
      },
      {
        id: 'col-dev',
        name: 'Development',
        color: '#f59e0b',
        tabs: [
          {
            id: 'tab-7',
            title: 'React – The library for web and native UIs',
            url: 'https://react.dev',
            favicon: 'https://www.google.com/s2/favicons?domain=react.dev&sz=32',
            addedAt: Date.now() - 25200000,
            pinned: true,
            tag: 'Docs',
          },
          {
            id: 'tab-8',
            title: 'Vite – Next Generation Frontend Tooling',
            url: 'https://vite.dev',
            favicon: 'https://www.google.com/s2/favicons?domain=vite.dev&sz=32',
            addedAt: Date.now() - 28800000,
            pinned: false,
            tag: 'Tools',
          },
          {
            id: 'tab-9',
            title: 'Cloud Firestore Documentation - Firebase',
            url: 'https://firebase.google.com/docs/firestore',
            favicon: 'https://www.google.com/s2/favicons?domain=firebase.google.com&sz=32',
            addedAt: Date.now() - 32400000,
            pinned: false,
            tag: 'Firebase',
          },
        ],
      },
    ],
    todos: [
      { id: 'todo-1', text: 'Review pull requests on GitHub', completed: false },
      { id: 'todo-2', text: 'Update Firebase sync schema', completed: true },
      { id: 'todo-3', text: 'Organize tab collections', completed: false },
    ],
  },
];

// Track the current user's UID for the Firestore sync subscription
let currentUid = null;
let firestoreUnsubscribe = null;

export const useTabStore = create(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,

      // Firebase status: 'loading' | 'synced' | 'syncing' | 'offline'
      firebaseReady: false,
      syncStatus: 'loading',

      setSyncStatus: (status) => set({ syncStatus: status }),

      /**
       * Initialize data for a given user.
       * Attempts migration from legacy path, then loads user data,
       * then subscribes to real-time updates.
       */
      initFromFirestore: async (uid) => {
        if (!uid) {
          set({ firebaseReady: true, syncStatus: 'offline' });
          return;
        }

        currentUid = uid;

        // Clean up previous subscription if any
        if (firestoreUnsubscribe) {
          firestoreUnsubscribe();
          firestoreUnsubscribe = null;
        }

        // Load user's own data from Firestore
        const cloudData = await loadFromFirestore(uid);

        if (cloudData && !cloudData.error && !cloudData.empty && Array.isArray(cloudData.workspaces) && cloudData.workspaces.length > 0) {
          const activeId = cloudData.activeWorkspaceId && cloudData.workspaces.some(w => w.id === cloudData.activeWorkspaceId)
            ? cloudData.activeWorkspaceId
            : cloudData.workspaces[0].id;

          set({
            workspaces: cloudData.workspaces,
            activeWorkspaceId: activeId,
            firebaseReady: true,
            syncStatus: 'synced',
          });
        } else {
          // New user — seed with sample workspaces
          set({
            workspaces: SAMPLE_WORKSPACES,
            activeWorkspaceId: SAMPLE_WORKSPACES[0].id,
            firebaseReady: true,
            syncStatus: 'syncing',
          });
          // Push sample data to cloud for this new user
          if (!cloudData || !cloudData.error) {
            saveToFirestore(
              uid,
              { workspaces: SAMPLE_WORKSPACES, activeWorkspaceId: SAMPLE_WORKSPACES[0].id },
              (status) => set({ syncStatus: status })
            );
          } else {
            set({ syncStatus: 'offline' });
          }
        }

        // Step 3: Subscribe to real-time changes
        firestoreUnsubscribe = subscribeToFirestore(
          uid,
          (remoteData) => {
            if (remoteData.workspaces && remoteData.workspaces.length > 0) {
              set({
                workspaces: remoteData.workspaces,
                activeWorkspaceId: remoteData.activeWorkspaceId || remoteData.workspaces[0].id,
                syncStatus: 'synced',
              });
            }
          },
          () => set({ syncStatus: 'offline' })
        );
      },

      /**
       * Reset store state when user signs out.
       */
      clearUserData: () => {
        if (firestoreUnsubscribe) {
          firestoreUnsubscribe();
          firestoreUnsubscribe = null;
        }
        currentUid = null;
        set({
          workspaces: [],
          activeWorkspaceId: null,
          firebaseReady: false,
          syncStatus: 'loading',
          selectionMode: false,
          selectedTabIds: [],
          toasts: [],
        });
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

      // Multi-select state
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
                const filtered = c.tabs.filter((t) => !ids.has(t.id));
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
        return state.workspaces.find((w) => w.id === state.activeWorkspaceId) || state.workspaces[0];
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
            existingUrls.add(normalized);
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
                t.url.toLowerCase().includes(q) ||
                (t.tag && t.tag.toLowerCase().includes(q))
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

// Subscribe to state changes and sync to Firestore (user-scoped)
let prevWorkspaces = useTabStore.getState().workspaces;
let prevActiveId = useTabStore.getState().activeWorkspaceId;

useTabStore.subscribe((state) => {
  if (!currentUid) return; // Don't sync if no user is logged in
  if (state.workspaces !== prevWorkspaces || state.activeWorkspaceId !== prevActiveId) {
    prevWorkspaces = state.workspaces;
    prevActiveId = state.activeWorkspaceId;
    saveToFirestore(
      currentUid,
      {
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
      },
      (status) => useTabStore.getState().setSyncStatus(status)
    );
  }
});
