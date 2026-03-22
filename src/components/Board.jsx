import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useTabStore } from '../store/useTabStore';
import Column from './Column';
import TabCard from './TabCard';
import SelectionActionBar from './SelectionActionBar';
import { Plus, LayoutGrid } from 'lucide-react';

export default function Board() {
  const moveTab = useTabStore((s) => s.moveTab);
  const addCollection = useTabStore((s) => s.addCollection);
  const selectionMode = useTabStore((s) => s.selectionMode);
  const workspace = useTabStore((s) => s.workspaces.find(w => w.id === s.activeWorkspaceId));
  const [activeTab, setActiveTab] = useState(null);
  const [activeCollectionId, setActiveCollectionId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Find which collection contains a tab
  const findCollectionByTabId = useCallback(
    (tabId) => {
      if (!workspace) return null;
      for (const col of workspace.collections) {
        if (col.tabs.some((t) => t.id === tabId)) {
          return col;
        }
      }
      return null;
    },
    [workspace]
  );

  const handleDragStart = (event) => {
    if (selectionMode) return;
    const { active } = event;
    const collection = findCollectionByTabId(active.id);
    if (collection) {
      const tab = collection.tabs.find((t) => t.id === active.id);
      setActiveTab(tab);
      setActiveCollectionId(collection.id);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTab(null);

    if (!over || !activeCollectionId) return;

    const overId = over.id;

    // Determine target collection
    let toCollectionId = null;
    let toIndex = 0;

    // Check if dropped over a column (collection)
    const overCollection = workspace.collections.find((c) => c.id === overId);
    if (overCollection) {
      toCollectionId = overCollection.id;
      toIndex = overCollection.tabs.length;
    } else {
      // Dropped over a tab — find which collection that tab belongs to
      const col = findCollectionByTabId(overId);
      if (col) {
        toCollectionId = col.id;
        toIndex = col.tabs.findIndex((t) => t.id === overId);
        if (toIndex < 0) toIndex = col.tabs.length;
      }
    }

    if (toCollectionId && active.id !== overId) {
      moveTab(activeCollectionId, toCollectionId, active.id, toIndex);
    }
    setActiveCollectionId(null);
  };

  const handleDragCancel = () => {
    setActiveTab(null);
    setActiveCollectionId(null);
  };

  if (!workspace) return null;

  if (workspace.collections.length === 0) {
    return (
      <div className="board">
        <div className="board-empty">
          <div className="board-empty-content">
            <div className="board-empty-icon">
              <LayoutGrid size={36} />
            </div>
            <h3 className="board-empty-title">No collections yet</h3>
            <p className="board-empty-description">
              Collections are groups of tabs. Create your first collection to start organizing your
              tabs across projects, topics, or workflows.
            </p>
            <button
              className="board-empty-btn"
              onClick={() => addCollection('My First Collection')}
            >
              <Plus size={18} />
              Create Collection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="board">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {workspace.collections.map((collection) => (
          <Column key={collection.id} collection={collection} />
        ))}

        <DragOverlay>
          {activeTab ? (
            <TabCard tab={activeTab} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      <button
        className="add-column-btn"
        onClick={() => addCollection('New Collection')}
      >
        <Plus size={20} />
        Add Collection
      </button>

      <SelectionActionBar />
    </div>
  );
}

