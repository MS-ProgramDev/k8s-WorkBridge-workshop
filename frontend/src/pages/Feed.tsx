import React, { useEffect, useMemo, useState } from 'react';
import { postApi, Post } from '../utils/postApi';
import './Feed.css';

function formatDate(s?: string) {
  if (!s) return '';
  const iso = s.includes('T') ? s : s.replace(' ', 'T'); // מבטיח ISO
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}


function getEmailFromToken(): string | null {
  const t = localStorage.getItem('token');
  if (!t) return null;
  try {
    const payload = JSON.parse(atob(t.split('.')[1]));
    return payload.sub || payload.email || null;
  } catch {
    return null;
  }
}

const PAGE_SIZE = 20;

function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [error, setError] = useState('');
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const meEmail = useMemo(() => getEmailFromToken(), []);

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
      setPosts((prev) => [created, ...prev]);
      setNewPostContent('');
      setSkip((prev) => prev + 1);
    } catch {
      setError('Failed to create post');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await postApi.deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError('Failed to delete post');
    }
  };

  const handleToggleLike = async (postId: number, liked: boolean | undefined) => {
    try {
      if (liked) {
        await postApi.unlikePost(postId);
      } else {
        await postApi.likePost(postId);
      }
      setPosts(prev =>
        prev.map(p => {
          if (p.id !== postId) return p;
          const wasLiked = !!p.liked_by_me;
          const nextLiked = !wasLiked;
          const baseCount = typeof p.likes_count === 'number' ? p.likes_count : 0;
          return {
            ...p,
            liked_by_me: nextLiked,
            likes_count: baseCount + (nextLiked ? 1 : -1),
          };
        })
      );
    } catch {
      setError('Failed to toggle like');
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
            <div className="post-meta">
              <strong>{post.author_display_name || post.user_email}</strong>
              {(post.author_display_name || post.user_email) && formatDate(post.created_at) && <span>•</span>}
              <span className="timestamp">{formatDate(post.created_at)}</span>
            </div>

            <div className="post-actions">
              <button
                onClick={() => handleToggleLike(post.id, post.liked_by_me)}
                className={`icon-btn ${post.liked_by_me ? 'liked' : ''}`}
                aria-label={post.liked_by_me ? 'Unlike' : 'Like'}
                title={post.liked_by_me ? 'Unlike' : 'Like'}
              >
                {post.liked_by_me ? '♥' : '♡'}
              </button>
              <span className="like-count">
                {typeof post.likes_count === 'number' ? post.likes_count : 0}
              </span>

              {meEmail === post.user_email && (
                <button
                  onClick={() => handleDelete(post.id)}
                  className="icon-btn delete"
                  aria-label="Delete post"
                  title="Delete post"
                >
                  🗑
                </button>
              )}
            </div>
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
