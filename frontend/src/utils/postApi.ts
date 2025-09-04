// utils/postApi.ts
import { API_BASE } from "../config";

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export interface Post {
  id: number;
  content: string;
  user_email: string;
  created_at: string;
  author_display_name?: string;
  likes_count?: number;   
  liked_by_me?: boolean;
}

export interface PostCreate {
  content: string;
}

export const postApi = {
  getPosts: async (skip = 0, limit = 20): Promise<Post[]> => {
  const res = await fetch(`${API_BASE}/posts/?skip=${skip}&limit=${limit}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
},

deletePost: async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete post');
  }
},

likePost: async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/posts/${id}/like`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to like post');
  }
},

unlikePost: async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/posts/${id}/like`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to unlike post');
  }
},

  createPost: async (postData: PostCreate): Promise<Post> => {
    const res = await fetch(`${API_BASE}/posts/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(postData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create post');
    }
    return res.json();
  }
};
