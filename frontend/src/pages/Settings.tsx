import React, { useState } from 'react';
import './Settings.css';

function Settings() {
  const [username, setUsername] = useState('maor_user');
  const [email, setEmail] = useState('user@example.com');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // בעתיד נשלח את הנתונים ל־Backend
    alert('Settings saved!');
  };

  return (
    <div className="settings-container">
      <h1>Settings</h1>
      <form onSubmit={handleSave} className="settings-form">
        <label>Username</label>
        <input type="text" value={username} onChange={e => setUsername(e.target.value)} />

        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} />

        <label>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={e => setNotificationsEnabled(e.target.checked)}
          />
          Enable notifications
        </label>

        <button type="submit">Save Settings</button>
      </form>
    </div>
  );
}

export default Settings;
