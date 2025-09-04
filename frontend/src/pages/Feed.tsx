import React, { useEffect, useState } from 'react';
import { postApi, Post } from '../utils/postApi';
import './Feed.css';

function formatDate(s?: string) {
  if (!s) return '';
  const d1 = new Date(s);
  if (!isNaN(d1.getTime())) return d1.toLocaleString();
  const d2 = new Date(s.replace(' ', 'T'));
  return !isNaN(d2.getTime()) ? d2.toLocaleString() : '';
}

const PAGE_SIZE = 20;

function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [error, setError] = useState('');
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadPage = async (initial = false) => {
    try {
      setLoading(true);
      const data = await postApi.getPosts(initial ? 0 : skip, PAGE_SIZE);
      if (initial) {
        setPosts(data);
        setSkip(data.length);
      } else {
        setPosts((prev) => [...prev, ...data]);
        setSkip((prev) => prev + data.length);
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    try {
      const created = await postApi.createPost({ content: newPostContent.trim() });
      // מוסיפים לראש הרשימה
      setPosts((prev) => [created, ...prev]);
      setNewPostContent('');
      // כי הוספנו רשומה חדשה בתחילת הפיד
      setSkip((prev) => prev + 1);
    } catch {
      setError('Failed to create post');
    }
  };

  return (
    <div className="feed-container">
      <h1>Team Feed</h1>

      <div className="post-form-container">
        <form onSubmit={handleCreatePost} className="post-form">
          <textarea
            className="post-textarea"
            placeholder="What's on your mind?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />
          <button type="submit" className="post-button" disabled={loading}>
            {loading ? 'Loading...' : 'Post'}
          </button>
        </form>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {posts.map((post) => (
        <div className="post" key={post.id}>
        <div className="post-header">
          <strong>{post.author_display_name || post.user_email}</strong>
          {(post.author_display_name || post.user_email) && formatDate(post.created_at) && ' • '}
          <span className="timestamp">{formatDate(post.created_at)}</span>
          </div>
          <p>{post.content}</p>
        </div>
      ))}

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="post-button" onClick={() => loadPage(false)} disabled={loading}>
            {loading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}

export default Feed;
