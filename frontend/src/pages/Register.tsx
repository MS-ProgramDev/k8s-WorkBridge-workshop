import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from "../config";

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic client-side validation
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setIsLoading(false);
      return;
    }
    if (firstName.trim().length < 2) {
      setError('First name must be at least 2 characters.');
      setIsLoading(false);
      return;
    }
    if (lastName.trim().length < 2) {
      setError('Last name must be at least 2 characters.');
      setIsLoading(false);
      return;
    }



    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName, }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.access_token) {
          const token = data.access_token;
          localStorage.setItem('token', token);
          login(token, email);
          setSuccess(true);
          setError('');
          navigate('/profile')
        }

      } else {
        const data = await response.json();
        setError(data.detail || 'Registration failed.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="title">WorkBridge – Sign Up</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label className="label">Email</label>
        <input
          type="email"
          className="input"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={isLoading}
        />
        <label className="label">Password</label>
        <input
          type="password"
          className="input"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={isLoading}
        />
        <label className="label">First Name</label>
        <input
          type="text"
          className="input"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          disabled={isLoading}
        />
        <label className="label">Last Name</label> {/* MOVED */}
        <input
          type="text"
          className="input"
          value={lastName}
          onChange={e => setLastName(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="button"
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      {success && (
        <p style={{ color: 'green', marginTop: '15px' }}>
          ✅ Registered successfully! Redirecting to the feed...
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

export default Register;