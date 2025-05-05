import React, { useState } from 'react';
import './Login.css'; 

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.access_token) {
          localStorage.setItem('token', data.access_token);
        }
        setSuccess(true);
        setError('');
      } else {
        setError(data.detail || 'Login failed.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
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
        />
        <label className="login-label">Password</label>
        <input
          type="password"
          className="login-input"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button type="submit" className="login-button">Login</button>
      </form>

      {success && <p style={{ color: 'green', marginTop: '15px' }}>✅ Logged in successfully!</p>}
      {error && <p style={{ color: 'red', marginTop: '15px' }}>❌ {error}</p>}
    </div>
  );
}

export default Login;