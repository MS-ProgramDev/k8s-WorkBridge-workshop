import React, { useState } from 'react';
import './Register.css'; 

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic client-side validation
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();

        // Optional: Save token if the backend returns it
        if (data.access_token) {
          localStorage.setItem('token', data.access_token);
        }

        setSuccess(true);
        setError('');
      } else {
        const data = await response.json();
        setError(data.detail || 'Registration failed.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="container">
      <h1 className="title">WorkBridge – Sign Up</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label className="label">Email</label>
        <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} />
        <label className="label">Password</label>
        <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" className="button">Register</button>
      </form>

      {success && <p style={{ color: 'green', marginTop: '15px' }}>✅ Registered successfully!</p>}
      {error && <p style={{ color: 'red', marginTop: '15px' }}>❌ {error}</p>}
    </div>
  );
}

export default Register;