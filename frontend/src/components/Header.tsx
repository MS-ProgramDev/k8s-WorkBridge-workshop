import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.jpg';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <img src={logo} alt="WorkBridge Logo" className="logo" />
      <nav className="nav">
        <Link to="/">Home</Link>
        <Link to="/feed">Feed</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
        <Link to="/settings">Settings</Link>
      </nav>
    </header>
  );
};

export default Header;
