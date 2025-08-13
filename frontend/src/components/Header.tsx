import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.jpg';
import './Header.css';

const Header = () => {
  const { isAuthenticated, user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <header className="header">
        <Link to="/">
          <img src={logo} alt="WorkBridge Logo" className="logo" />
        </Link>
        <nav className="nav">
          <span>Loading...</span>
        </nav>
      </header>
    );
  }

  return (
    <header className="header">
      <Link to="/">
        <img src={logo} alt="WorkBridge Logo" className="logo" />
      </Link>
      
      <nav className="nav">
        <Link to="/" className="nav-link">Home</Link>
        
        {isAuthenticated ? (
          // Authenticated user navigation
          <>
            <Link to="/feed" className="nav-link">Feed</Link>
            <Link to="/chat" className="nav-link">Chat</Link>
            <Link to="/profile" className="nav-link">Profile</Link>
            <Link to="/settings" className="nav-link">Settings</Link>
            <span className="nav-link" style={{ color: '#666' }}>
              Welcome, {user?.email}
            </span>
            <button 
              onClick={handleLogout}
              className="nav-link logout-button"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#007bff',
                fontWeight: 'bold'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          // Non-authenticated user navigation
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;