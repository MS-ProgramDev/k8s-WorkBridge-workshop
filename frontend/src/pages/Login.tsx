import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    try {
        const response = await fetch('http://localhost:30008/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.access_token) {
          login(data.access_token, email);
        }
        setSuccess(true);
        setError('');
        
        // Navigate to dashboard after successful login
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
        
      } else {
        setError(data.detail || 'Login failed.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">WorkBridge – Login</h1>
      
      <form className="login-form" onSubmit={handleLogin}>
        <label className="login-label">Email</label>
        <input
          type="email"
          className="login-input"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={isLoading}
        />
        <label className="login-label">Password</label>
        <input
          type="password"
          className="login-input"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="login-button"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {success && (
        <p style={{ color: 'green', marginTop: '15px' }}>
          ✅ Logged in successfully! Redirecting to dashboard...
        </p>
      )}
      {error && (
        <p style={{ color: 'red', marginTop: '15px' }}>
          ❌ {error}
        </p>
      )}
    </div>
  );
}

export default Login;