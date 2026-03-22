import { useState } from 'react';
import { useTabStore } from '../store/useTabStore';
import { Copy, Trash2, ArrowRightLeft, X, ChevronDown, ExternalLink } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import { openTabs } from '../utils/openTabs';

export default function SelectionActionBar() {
  const selectedTabIds = useTabStore((s) => s.selectedTabIds);
  const selectionMode = useTabStore((s) => s.selectionMode);
  const clearSelection = useTabStore((s) => s.clearSelection);
  const batchDelete = useTabStore((s) => s.batchDelete);
  const batchMoveTo = useTabStore((s) => s.batchMoveTo);
  const getSelectedTabData = useTabStore((s) => s.getSelectedTabData);
  const addToast = useTabStore((s) => s.addToast);
  const workspace = useTabStore((s) => s.workspaces.find(w => w.id === s.activeWorkspaceId));

  const [moveDropdownOpen, setMoveDropdownOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const count = selectedTabIds.length;

  if (!selectionMode || count === 0) return null;

  const collections = workspace?.collections || [];

  const handleCopyUrls = async () => {
    const tabs = getSelectedTabData();
    const urls = tabs.map((t) => t.url).join('\n');
    try {
      await navigator.clipboard.writeText(urls);
      addToast(`Copied ${tabs.length} URLs to clipboard`);
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  const handleOpenUrls = () => {
    const tabs = getSelectedTabData();
    const urls = tabs.map(t => t.url);
    openTabs(urls);
    addToast(`Opened ${tabs.length} tabs`);
    clearSelection();
  };

  const handleMoveTo = (collectionId) => {
    batchMoveTo(collectionId);
    setMoveDropdownOpen(false);
  };

  return (
    <>
      <div className="selection-action-bar">
        <div className="selection-action-bar-info">
          <span className="selection-count">{count} tab{count !== 1 ? 's' : ''} selected</span>
        </div>
        <div className="selection-action-bar-actions">
          <button className="selection-bar-btn" onClick={handleOpenUrls} title="Open URLs">
            <ExternalLink size={15} />
            <span>Open URLs</span>
          </button>
          
          <button className="selection-bar-btn" onClick={handleCopyUrls} title="Copy URLs">
            <Copy size={15} />
            <span>Copy URLs</span>
          </button>

          <div className="selection-move-wrapper">
            <button
              className="selection-bar-btn"
              onClick={() => setMoveDropdownOpen((v) => !v)}
              title="Move to collection"
            >
              <ArrowRightLeft size={15} />
              <span>Move to…</span>
              <ChevronDown size={12} />
            </button>
            {moveDropdownOpen && (
              <div className="selection-move-dropdown">
                {collections.map((c) => (
                  <button
                    key={c.id}
                    className="selection-move-dropdown-item"
                    onClick={() => handleMoveTo(c.id)}
                  >
                    <div
                      className="selection-move-dot"
                      style={{ backgroundColor: c.color }}
                    />
                    <span>{c.name}</span>
                    <span className="selection-move-count">{c.tabs.length}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="selection-bar-btn danger"
            onClick={() => setConfirmDeleteOpen(true)}
            title="Delete selected"
          >
            <Trash2 size={15} />
            <span>Delete</span>
          </button>

          <div className="selection-bar-divider" />

          <button className="selection-bar-btn muted" onClick={clearSelection} title="Deselect all">
            <X size={15} />
            <span>Cancel</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Delete Selected Tabs?"
        message={`Are you sure you want to delete ${count} selected tab${count !== 1 ? 's' : ''}? This action cannot be undone.`}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          batchDelete();
        }}
      />
    </>
  );
}
