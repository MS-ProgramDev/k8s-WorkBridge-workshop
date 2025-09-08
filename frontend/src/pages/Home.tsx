import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

function Home() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="home-container">
        <h1>Loading...</h1>
      </div>
    );
  }

  const displayName =
    (user as any)?.display_name ||
    `${(user as any)?.first_name ?? ''} ${(user as any)?.last_name ?? ''}`.trim() ||
    user?.email ||
    'User';

  return (
    <div className="home-container">
      <h1>Welcome to WorkBridge</h1>

      {isAuthenticated ? (
        <>
          <p>Welcome back, {displayName}!</p>
          <p>Your team's communication, all in one place.</p>

          <div className="buttons">
            <Link to="/feed" className="home-button">View Feed</Link>
            <Link to="/chat" className="home-button">Open Chat</Link>
            <Link to="/profile" className="home-button">My Profile</Link>
          </div>
        </>
      ) : (
        <>
          <p>Your team's communication, all in one place.</p>

          <div className="buttons">
            <Link to="/login" className="home-button">Login</Link>
            <Link to="/register" className="home-button">Register</Link>
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
