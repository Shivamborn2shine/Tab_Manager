import { useState, useRef, useEffect } from 'react';
import { useTabStore } from '../store/useTabStore';

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
];

export default function AddCollectionModal({ onClose }) {
  const addCollection = useTabStore((s) => s.addCollection);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addCollection(name.trim(), color);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Create Collection</h3>

        <form onSubmit={handleSubmit}>
          <label className="modal-label">Collection color</label>
          <div className="color-grid">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-btn ${color === c ? 'selected' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>

          <label className="modal-label">Collection name</label>
          <input
            ref={inputRef}
            className="modal-input"
            type="text"
            placeholder="e.g., Frontend, APIs, Design Inspiration..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="modal-actions">
            <button type="button" className="modal-btn cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn confirm">
              Create Collection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
