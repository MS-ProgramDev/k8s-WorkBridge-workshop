import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css'; 

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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
        
        // Navigate to dashboard after successful registration
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500); // Slightly longer delay for registration
        
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
          ✅ Registered successfully! Redirecting to dashboard...
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