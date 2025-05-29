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
  const { login, isAuthenticated } = useAuth();

  // Debug: log when auth state changes
  console.log('🔍 Login Component: Current auth state:', isAuthenticated);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('🔍 Login: Starting login process for email:', email);

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔍 Login: Making API call to /auth/login');
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('🔍 Login: API response status:', response.status);
      console.log('🔍 Login: API response data:', data);

      if (response.ok) {
        if (data.access_token) {
          console.log('🔍 Login: Token received, calling login() from context');
          login(data.access_token, email);
          console.log('🔍 Login: Context login() called successfully');
        }
        setSuccess(true);
        setError('');
        
        console.log('🔍 Login: Setting success state and preparing to navigate');
        
        // Navigate to dashboard after successful login
        setTimeout(() => {
          console.log('🔍 Login: Navigating to dashboard...');
          navigate('/dashboard');
        }, 1000);
        
      } else {
        console.log('🔍 Login: Login failed with error:', data.detail);
        setError(data.detail || 'Login failed.');
      }
    } catch (err) {
      console.error('🔍 Login: Network error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">WorkBridge – Login</h1>
      
      {/* Debug info */}
      <div style={{ 
        background: '#f0f0f0', 
        padding: '10px', 
        marginBottom: '20px', 
        fontSize: '12px',
        borderRadius: '5px'
      }}>
        <strong>Debug Info:</strong><br/>
        Is Authenticated: {isAuthenticated ? 'YES' : 'NO'}<br/>
        Token in localStorage: {localStorage.getItem('token') ? 'YES' : 'NO'}
      </div>
      
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