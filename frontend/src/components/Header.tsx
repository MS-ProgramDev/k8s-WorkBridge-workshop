import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.jpg';
import './Header.css';
import { API_BASE } from '../config';

type Me = {
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  display_name?: string | null;
};

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

function firstLatinLetter(s?: string | null): string {
  if (!s) return '';
  const c = s.trim().charAt(0);
  return /[a-z]/i.test(c) ? c.toUpperCase() : '';
}
function initialsFromName(f?: string | null, l?: string | null) {
  const F = firstLatinLetter(f);
  const L = firstLatinLetter(l);
  if (F && L) return (F + L).slice(0, 2);
  if (F) return F;
  if (L) return L;
  return '';
}
const PALETTE = [
  '#2563EB', '#7C3AED', '#DB2777', '#059669',
  '#EA580C', '#0EA5E9', '#16A34A', '#E11D48',
];
function colorFromEmail(email?: string) {
  if (!email) return PALETTE[0];
  let h = 0;
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

const Header: React.FC = () => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const [me, setMe] = useState<Me | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!isAuthenticated) {
      setMe(null);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders(), cache: 'no-store' });
        if (!res.ok) return;
        const data: Me = await res.json();
        if (!mounted) return;
        setMe(data);
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuOpen) return;
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t) &&
          btnRef.current && !btnRef.current.contains(t)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName =
    me?.display_name ||
    `${me?.first_name ?? ''} ${me?.last_name ?? ''}`.trim() ||
    user?.email ||
    'User';

  const avatarColor = colorFromEmail(user?.email);
  const initials =
    initialsFromName(me?.first_name, me?.last_name) ||
    (user?.email ? user.email.charAt(0).toUpperCase() : 'A');

  return (
    <header className="header">
      <div className="header__left">
        <Link to="/" className="logo-link" aria-label="Home">
          <img src={logo} alt="WorkBridge Logo" className="logo" />
          <span className="brand">WorkBridge</span>
        </Link>
      </div>

      <nav className="nav" aria-label="Global">
        <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' is-active' : '')}>
          <span className="nav-ico" aria-hidden>🏠</span>
          <span className="nav-text">Home</span>
        </NavLink>

        {isAuthenticated && (
          <>
            <NavLink to="/feed" className={({ isActive }) => 'nav-link' + (isActive ? ' is-active' : '')}>
              <span className="nav-ico" aria-hidden>📰</span>
              <span className="nav-text">Feed</span>
            </NavLink>
            <NavLink to="/chat" className={({ isActive }) => 'nav-link' + (isActive ? ' is-active' : '')}>
              <span className="nav-ico" aria-hidden>💬</span>
              <span className="nav-text">Chat</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="header__right">
        {loading ? (
          <span className="loading">Loading…</span>
        ) : isAuthenticated ? (
          <div className="user-area">
            <button
              ref={btnRef}
              className="avatar-btn"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title={displayName}
              type="button"
            >
              {me?.avatar_url ? (
                <img src={me.avatar_url} alt="" className="avatar-img" />
              ) : (
                <span className="avatar-fallback" style={{ background: avatarColor }} aria-hidden>
                  {initials}
                </span>
              )}
            </button>

            {menuOpen && (
              <div ref={menuRef} className="dropdown" role="menu" aria-label="User menu">
                <Link to="/profile" role="menuitem" tabIndex={0} className="drop-item">
                  <span className="drop-ico" aria-hidden>👤</span>
                  <span>Profile</span>
                </Link>
                <Link to="/settings" role="menuitem" tabIndex={0} className="drop-item">
                  <span className="drop-ico" aria-hidden>⚙️</span>
                  <span>Settings</span>
                </Link>
                <div className="drop-sep" role="separator" />
                <button
                  role="menuitem"
                  tabIndex={0}
                  className="drop-item danger"
                  onClick={handleLogout}
                  type="button"
                >
                  <span className="drop-ico" aria-hidden>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="guest-actions">
            <NavLink to="/login" className={({ isActive }) => 'nav-link' + (isActive ? ' is-active' : '')}>
              Login
            </NavLink>
            <NavLink to="/register" className={({ isActive }) => 'nav-link' + (isActive ? ' is-active' : '')}>
              Register
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
