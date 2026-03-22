import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTabStore } from '../store/useTabStore';
import { ExternalLink, Pin, Trash2, Globe, Copy, Check, Tag } from 'lucide-react';

export default function TabCard({ tab, collectionId, isOverlay = false }) {
  const removeTab = useTabStore((s) => s.removeTab);
  const togglePin = useTabStore((s) => s.togglePin);
  const updateTabTag = useTabStore((s) => s.updateTabTag);
  const addToast = useTabStore((s) => s.addToast);
  const selectionMode = useTabStore((s) => s.selectionMode);
  const selectedTabIds = useTabStore((s) => s.selectedTabIds);
  const toggleSelection = useTabStore((s) => s.toggleSelection);
  const [imgError, setImgError] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [isEditingTag, setIsEditingTag] = useState(false);
  const [tagInput, setTagInput] = useState(tab.tag || '');
  const tagInputRef = useRef(null);

  const isSelected = selectedTabIds.includes(tab.id);

  useEffect(() => {
    if (isEditingTag && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [isEditingTag]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id, disabled: isOverlay || selectionMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  let domain = '';
  try {
    domain = new URL(tab.url).hostname.replace('www.', '');
  } catch {
    domain = tab.url;
  }

  const handleOpen = (e) => {
    e.stopPropagation();
    window.open(tab.url, '_blank', 'noopener');
  };

  const handlePin = (e) => {
    e.stopPropagation();
    if (collectionId) togglePin(collectionId, tab.id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (collectionId) removeTab(collectionId, tab.id);
  };

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(tab.url);
      setJustCopied(true);
      addToast('URL copied!');
      setTimeout(() => setJustCopied(false), 1500);
    } catch {
      addToast('Failed to copy URL', 'error');
    }
  };

  const saveTag = () => {
    setIsEditingTag(false);
    if (tagInput.trim() !== (tab.tag || '')) {
      updateTabTag(collectionId, tab.id, tagInput.trim());
      addToast('Tag updated');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      e.preventDefault();
      saveTag();
    }
    if (e.key === 'Escape') {
      e.stopPropagation();
      e.preventDefault();
      setIsEditingTag(false);
      setTagInput(tab.tag || '');
    }
  };

  const handleCardClick = () => {
    if (selectionMode) {
      toggleSelection(tab.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`tab-card ${isDragging ? 'dragging' : ''} ${
        isOverlay ? 'drag-overlay' : ''
      } ${tab.pinned ? 'pinned' : ''} ${isSelected ? 'selected' : ''} ${
        selectionMode ? 'selection-mode' : ''
      }`}
      {...(selectionMode ? {} : attributes)}
      {...(selectionMode ? {} : listeners)}
      onClick={handleCardClick}
    >
      {tab.pinned && (
        <div className="tab-card-pin-indicator">
          <Pin size={8} />
        </div>
      )}

      {selectionMode && (
        <div className={`tab-card-checkbox ${isSelected ? 'checked' : ''}`}>
          {isSelected && <Check size={10} strokeWidth={3} />}
        </div>
      )}

      {!imgError ? (
        <img
          className="tab-card-favicon"
          src={tab.favicon}
          alt=""
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <div className="tab-card-favicon-placeholder">
          <Globe size={12} />
        </div>
      )}

      <div className="tab-card-info" onClick={selectionMode ? undefined : handleOpen} style={{ cursor: selectionMode ? 'default' : 'pointer' }}>
        <div className="tab-card-title">{tab.title}</div>
        <div className="tab-card-url">{domain}</div>
        
        {isEditingTag ? (
          <input
            type="text"
            ref={tagInputRef}
            className="tab-card-tag-input"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onBlur={saveTag}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            placeholder="Add a phrase or tag..."
            style={{ width: '100%', marginTop: '4px', fontSize: '11px', padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border)' }}
          />
        ) : (
          tab.tag && <div className="tab-card-tag" style={{ marginTop: '2px', fontSize: '11px', color: 'var(--text-muted)', display: 'inline-block', background: 'var(--surface-active)', padding: '2px 6px', borderRadius: '10px' }}>{tab.tag}</div>
        )}
      </div>

      {!isOverlay && !selectionMode && (
        <div className="tab-card-actions">
          <button
            className="tab-card-action tag"
            onClick={(e) => {
              e.stopPropagation();
              setTagInput(tab.tag || '');
              setIsEditingTag(true);
            }}
            title={tab.tag ? 'Edit tag' : 'Add tag'}
          >
            <Tag size={14} />
          </button>
          <button
            className="tab-card-action copy"
            onClick={handleCopy}
            title="Copy URL"
          >
            {justCopied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button
            className={`tab-card-action open`}
            onClick={handleOpen}
            title="Open in new tab"
          >
            <ExternalLink size={14} />
          </button>
          <button
            className={`tab-card-action pin ${tab.pinned ? '' : ''}`}
            onClick={handlePin}
            title={tab.pinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={14} />
          </button>
          <button
            className="tab-card-action delete"
            onClick={handleDelete}
            title="Remove tab"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
