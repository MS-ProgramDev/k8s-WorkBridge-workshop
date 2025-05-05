import React from 'react';
import './Dashboard.css';

function Dashboard() {
  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      <section className="card">
        <h2>Welcome back 👋</h2>
        <p>Here's a quick overview of your workspace today.</p>
      </section>

      <section className="card">
        <h3>Your Tasks</h3>
        <ul>
          <li>🔧 Fix bug in profile page</li>
          <li>📢 Post weekly update</li>
          <li>✅ Attend team sync @ 15:00</li>
        </ul>
      </section>

      <section className="card">
        <h3>Latest Notifications</h3>
        <ul>
          <li>🎉 Alice deployed version 1.2.0</li>
          <li>💬 You got mentioned in #dev-chat</li>
        </ul>
      </section>
    </div>
  );
}

export default Dashboard;
