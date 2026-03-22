import { useState, useRef, useEffect } from 'react';
import { useTabStore } from '../store/useTabStore';

export default function ImportTabsModal({ onClose, prefillTabs = null }) {
  const getActiveWorkspace = useTabStore((s) => s.getActiveWorkspace);
  const importTabs = useTabStore((s) => s.importTabs);
  const [text, setText] = useState('');
  const [targetCollection, setTargetCollection] = useState('');
  const textareaRef = useRef(null);
  const workspace = getActiveWorkspace();

  useEffect(() => {
    textareaRef.current?.focus();
    if (workspace?.collections.length > 0) {
      setTargetCollection(workspace.collections[0].id);
    }
    // Pre-fill with incoming tabs from Chrome extension
    if (prefillTabs && Array.isArray(prefillTabs)) {
      setText(JSON.stringify(prefillTabs, null, 2));
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || !targetCollection) return;

    // Try JSON first
    let tabs = [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        tabs = parsed.map((t) => ({
          url: t.url || t,
          title: t.title || '',
        }));
      }
    } catch {
      // Fallback: one URL per line
      tabs = text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((url) => ({
          url: url.match(/^https?:\/\//) ? url : `https://${url}`,
          title: '',
        }));
    }

    if (tabs.length > 0) {
      importTabs(targetCollection, tabs);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Import Tabs</h3>

        <form onSubmit={handleSubmit}>
          <label className="modal-label">Target collection</label>
          <select
            className="modal-input"
            value={targetCollection}
            onChange={(e) => setTargetCollection(e.target.value)}
            style={{ marginBottom: 'var(--space-lg)', cursor: 'pointer' }}
          >
            {workspace?.collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="modal-label">Paste URLs or JSON</label>
          <textarea
            ref={textareaRef}
            className="import-textarea"
            placeholder={'Paste one URL per line:\nhttps://github.com\nhttps://react.dev\n\nOr paste JSON from the Chrome extension:\n[{"url": "...", "title": "..."}]'}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <p className="import-help">
            Supports one URL per line or JSON array format from the Tab Manager Chrome extension.
          </p>

          <div className="modal-actions">
            <button type="button" className="modal-btn cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn confirm">
              Import Tabs
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
