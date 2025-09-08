import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.jpg';
import './Header.css';
import { API_BASE } from '../config';
import { chatApi, UserSearchResult } from '../utils/chatApi';

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

  // search state
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [highlight, setHighlight] = useState<number>(-1);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

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
        /* ignore */
      }
    })();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (menuOpen && menuRef.current && !menuRef.current.contains(t) &&
          btnRef.current && !btnRef.current.contains(t)) {
        setMenuOpen(false);
      }
      if (showResults && searchWrapRef.current && !searchWrapRef.current.contains(t)) {
        setShowResults(false);
        setHighlight(-1);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setShowResults(false);
        setHighlight(-1);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen, showResults]);

  // debounce search
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (!isAuthenticated) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      setHighlight(-1);
      return;
    }
    timer = setTimeout(async () => {
      try {
        const list = await chatApi.searchUsers(q, 5);
        setResults(list);
        setShowResults(true);
        setHighlight(list.length ? 0 : -1);
      } catch {
        setResults([]);
        setShowResults(false);
        setHighlight(-1);
      }
    }, 300);
    return () => { if (timer) clearTimeout(timer); };
  }, [query, isAuthenticated]);

  const choose = (item: UserSearchResult) => {
    setShowResults(false);
    setQuery('');
    setResults([]);
    setHighlight(-1);
    navigate(`/users/${item.id}`);
  };

  const onSearchKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!showResults || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight(h => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlight >= 0) choose(results[highlight]);
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setHighlight(-1);
    }
  };

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
        <Link to="/" className="brand">
          <span className="logo-box">
        <img src={logo} alt="WorkBridge Logo" className="logo" />
      </span>
          <span>WorkBridge</span>
        </Link>
      </div>

      {/* nav + search in the middle */}
      <div className="nav-area">
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

        {isAuthenticated && (
          <div className="search-wrapper" ref={searchWrapRef}>
            <input
              type="text"
              placeholder="Search people..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!showResults) setShowResults(true);
              }}
              onKeyDown={onSearchKeyDown}
              className="search-input"
            />
            {showResults && query && (
              <div className="search-dropdown" role="listbox">
                {results.length === 0 ? (
                  <div className="search-item" aria-disabled>
                    No results
                  </div>
                ) : (
                  results.map((u, idx) => {
                    const parts = (u.display_name || '').split(' ');
                    const initials2 = initialsFromName(parts[0], parts[1]);
                    const color = colorFromEmail(u.display_name || 'X');
                    return (
                      <div
                        key={u.id}
                        className={`search-item${idx === highlight ? ' is-active' : ''}`}
                        role="option"
                        aria-selected={idx === highlight}
                        onMouseEnter={() => setHighlight(idx)}
                        onMouseDown={(e) => { e.preventDefault(); choose(u); }}
                      >
                        <span className="search-avatar" style={{ background: color }}>
                          {initials2}
                        </span>
                        <div className="search-texts">
                          <div className="search-primary">{u.display_name}</div>
                          {u.job_title && (
                            <div className="search-secondary">{u.job_title}</div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

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
                {/* Settings item removed */}
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
