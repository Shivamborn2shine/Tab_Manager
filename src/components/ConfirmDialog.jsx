import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ color: 'var(--accent-rose)', flexShrink: 0 }}>
            <AlertTriangle size={24} />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>
        <div className="modal-footer" style={{ marginTop: '24px' }}>
          <button className="modal-btn secondary" onClick={onCancel}>
            Cancel
          </button>
          <button 
            className="modal-btn" 
            style={{ background: 'var(--accent-rose)', color: 'white' }} 
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
