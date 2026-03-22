import { useState, useRef, useEffect } from 'react';
import { useTabStore } from '../store/useTabStore';

const EMOJIS = [
  '🚀', '💼', '🎯', '📚', '🔬', '🎨', '🛠️', '📊',
  '🌍', '💡', '🔥', '🎮', '🎵', '📸', '✈️', '🏠',
  '💻', '📝', '🔖', '⭐', '🎁', '🌟', '💜', '🧠',
];

export default function AddWorkspaceModal({ onClose }) {
  const addWorkspace = useTabStore((s) => s.addWorkspace);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🚀');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addWorkspace(name.trim(), emoji);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Create Workspace</h3>

        <form onSubmit={handleSubmit}>
          <label className="modal-label">Choose an icon</label>
          <div className="emoji-grid">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className={`emoji-btn ${emoji === e ? 'selected' : ''}`}
                onClick={() => setEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>

          <label className="modal-label">Workspace name</label>
          <input
            ref={inputRef}
            className="modal-input"
            type="text"
            placeholder="e.g., Work Projects, Personal, Research..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="modal-actions">
            <button type="button" className="modal-btn cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn confirm">
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
