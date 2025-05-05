import React from 'react';
import './Feed.css';

type Post = {
  id: number;
  author: string;
  timestamp: string;
  content: string;
};

const samplePosts: Post[] = [
  {
    id: 1,
    author: 'Alice',
    timestamp: '2 hours ago',
    content: '🎉 Just finished the new chat feature!',
  },
  {
    id: 2,
    author: 'Bob',
    timestamp: '5 hours ago',
    content: 'Reminder: Weekly meeting at 10:00 tomorrow.',
  },
  {
    id: 3,
    author: 'Charlie',
    timestamp: '1 day ago',
    content: 'Deployed new update to staging 🚀',
  },
];

function Feed() {
  return (
    <div className="feed-container">
      <h1>Team Feed</h1>
      {samplePosts.map(post => (
        <div className="post" key={post.id}>
          <div className="post-header">
            <strong>{post.author}</strong> • <span className="timestamp">{post.timestamp}</span>
          </div>
          <p>{post.content}</p>
        </div>
      ))}
    </div>
  );
}

export default Feed;
