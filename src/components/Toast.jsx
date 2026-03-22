import { CheckCircle, AlertCircle } from 'lucide-react';

export default function Toast({ message, type = 'success' }) {
  return (
    <div className={`toast ${type}`}>
      {type === 'success' ? (
        <CheckCircle size={16} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
      ) : (
        <AlertCircle size={16} style={{ color: 'var(--accent-rose)', flexShrink: 0 }} />
      )}
      {message}
    </div>
  );
}
