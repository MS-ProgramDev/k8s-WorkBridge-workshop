import React from 'react';
import './Profile.css';

function Profile() {
  const user = {
    name: 'Maor Saporta',
    email: 'user@example.com',
    role: 'Developer',
    status: 'Online',
    tasks: ['Fix login bug', 'Write unit tests', 'Deploy to staging'],
  };

  return (
    <div className="profile-container">
      <h1>User Profile</h1>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Role:</strong> {user.role}</p>
      <p><strong>Status:</strong> <span className="status">{user.status}</span></p>

      <h3>Current Tasks</h3>
      <ul>
        {user.tasks.map((task, index) => (
          <li key={index}>• {task}</li>
        ))}
      </ul>
    </div>
  );
}

export default Profile;
