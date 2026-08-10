import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { LogOut, ChevronDown } from 'lucide-react';

export default function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const initials = (user.displayName || user.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="user-menu-container" ref={menuRef}>
      <button className="user-menu-trigger" onClick={() => setOpen((v) => !v)}>
        {user.photoURL ? (
          <img className="user-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
        ) : (
          <div className="user-avatar-initials">{initials}</div>
        )}
        <div className="user-menu-info">
          <div className="user-menu-name">{user.displayName}</div>
          <div className="user-menu-email">{user.email}</div>
        </div>
        <ChevronDown size={14} className={`user-menu-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="user-menu-dropdown">
          <div className="user-menu-dropdown-header">
            {user.photoURL ? (
              <img className="user-avatar-lg" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
            ) : (
              <div className="user-avatar-initials-lg">{initials}</div>
            )}
            <div>
              <div className="user-menu-dropdown-name">{user.displayName}</div>
              <div className="user-menu-dropdown-email">{user.email}</div>
            </div>
          </div>
          <div className="user-menu-dropdown-divider"></div>
          <button
            className="user-menu-dropdown-item signout"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
