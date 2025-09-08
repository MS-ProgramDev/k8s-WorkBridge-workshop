import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Register from './pages/Register';
import Login from './pages/Login';
import Header from './components/Header';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Feed from './pages/Feed';
import Chat from './pages/Chat';
import UserPublicProfile from './pages/UserPublicProfile';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/users/:id" element={<UserPublicProfile />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;