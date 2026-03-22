import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTabStore } from '../store/useTabStore';
import { openTabs } from '../utils/openTabs';
import TabCard from './TabCard';
import { Trash2, Edit3, ExternalLink, CheckSquare, Square } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

export default function Column({ collection }) {
  const addTab = useTabStore((s) => s.addTab);
  const deleteCollection = useTabStore((s) => s.deleteCollection);
  const renameCollection = useTabStore((s) => s.renameCollection);
  const addToast = useTabStore((s) => s.addToast);
  const selectionMode = useTabStore((s) => s.selectionMode);
  const selectedTabIds = useTabStore((s) => s.selectedTabIds);
  const selectAllInCollection = useTabStore((s) => s.selectAllInCollection);
  const toggleSelection = useTabStore((s) => s.toggleSelection);
  const [urlInput, setUrlInput] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(collection.name);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const allSelected = collection.tabs.length > 0 && collection.tabs.every((t) => selectedTabIds.includes(t.id));

  const { setNodeRef, isOver } = useDroppable({ id: collection.id });

  const handleAddTab = (e) => {
    e.preventDefault();
    const url = urlInput.trim();
    if (!url) return;
    // Add https:// if no protocol
    const fullUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;
    addTab(collection.id, fullUrl);
    setUrlInput('');
  };

  const handleRename = () => {
    if (renameValue.trim()) {
      renameCollection(collection.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleOpenAll = () => {
    if (collection.tabs.length === 0) return;
    const urls = collection.tabs.map(t => t.url);
    openTabs(urls);
    addToast(`Opened ${collection.tabs.length} tabs`);
  };

  const tabIds = collection.tabs.map((t) => t.id);

  return (
    <>
      <div className={`column ${isOver ? 'drag-over' : ''}`} ref={setNodeRef}>
        <div className="column-header">
          <div className="column-header-left">
            <div
              className="column-color-dot"
              style={{ backgroundColor: collection.color }}
            />
            {isRenaming ? (
              <input
                className="column-add-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                autoFocus
                style={{ width: '140px', padding: '2px 8px' }}
              />
            ) : (
              <span className="column-title">{collection.name}</span>
            )}
            <span className="column-count">{collection.tabs.length}</span>
          </div>
          <div className="column-header-actions">
            {selectionMode && collection.tabs.length > 0 && (
              <button
                className="column-action-btn select-all"
                onClick={() => {
                  if (allSelected) {
                    collection.tabs.forEach((t) => {
                      if (selectedTabIds.includes(t.id)) toggleSelection(t.id);
                    });
                  } else {
                    selectAllInCollection(collection.id);
                  }
                }}
                title={allSelected ? 'Deselect all' : 'Select all'}
              >
                {allSelected ? <CheckSquare size={14} /> : <Square size={14} />}
              </button>
            )}
            {!selectionMode && collection.tabs.length > 0 && (
              <button
                className="column-action-btn open-all"
                onClick={handleOpenAll}
                title="Open all tabs"
              >
                <ExternalLink size={14} />
              </button>
            )}
            <button
              className="column-action-btn"
              onClick={() => {
                setRenameValue(collection.name);
                setIsRenaming(true);
              }}
              title="Rename"
            >
              <Edit3 size={14} />
            </button>
            <button
              className="column-action-btn delete"
              onClick={() => setIsConfirmOpen(true)}
              title="Delete collection"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className={`column-body ${collection.tabs.length === 0 ? 'is-empty' : ''}`}>
          {collection.tabs.length === 0 ? (
            <p className="column-empty-text">
              Drop tabs here or paste a URL below
            </p>
          ) : (
            <SortableContext items={tabIds} strategy={verticalListSortingStrategy}>
              {collection.tabs.map((tab) => (
                <TabCard
                  key={tab.id}
                  tab={tab}
                  collectionId={collection.id}
                />
              ))}
            </SortableContext>
          )}
        </div>

        <form className="column-footer" onSubmit={handleAddTab}>
          <input
            className="column-add-input"
            type="text"
            placeholder="Paste URL to add tab..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
        </form>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Delete Collection?"
        message={`Are you sure you want to delete "${collection.name}"? All ${collection.tabs.length} tabs inside it will be permanently lost.`}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          deleteCollection(collection.id);
        }}
      />
    </>
  );
}
