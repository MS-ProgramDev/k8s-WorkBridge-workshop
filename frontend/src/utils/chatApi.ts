// utils/chatApi.ts
import { API_BASE } from "../config";

// --- auth headers ---
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// --- types ---
export interface Message {
  id: number;
  sender_id: string;
  recipient_id: string;
  content: string;
  timestamp: string;
  is_group: boolean;
}

export interface MessageCreate {
  recipient_id: string; // email for user / group id as string for group
  content: string;
  is_group: boolean;
}

export interface Group {
  id: number;
  name: string;
  created_at: string;
}

export interface GroupCreate {
  name: string;
}

export interface UserSearchResult {
  id: number;
  display_name: string;
  job_title?: string | null;
}

// NEW: group member type
export interface GroupMember {
  id: number;
  email: string;
  display_name: string;
}

export const chatApi = {
  // ---- direct & group messages ----
  sendMessage: async (messageData: MessageCreate): Promise<Message> => {
    const response = await fetch(`${API_BASE}/chat/messages/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(messageData),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to send message");
    }
    return response.json();
  },

  getMyMessages: async (): Promise<Message[]> => {
    const response = await fetch(`${API_BASE}/chat/messages/`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch messages");
    return response.json();
  },

  getMessagesWithUser: async (userId: string): Promise<Message[]> => {
    const response = await fetch(`${API_BASE}/chat/messages/${userId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to fetch conversation");
    return response.json();
  },

  getUserPublicById: async (
    id: number
  ): Promise<{ id: number; display_name: string; email: string }> => {
    const res = await fetch(`${API_BASE}/users/${id}/public`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch user");
    return res.json();
  },

  // ---- groups ----
  createGroup: async (groupData: GroupCreate): Promise<Group> => {
    const response = await fetch(`${API_BASE}/chat/groups/`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(groupData),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to create group");
    }
    return response.json();
  },

  joinGroup: async (groupId: number): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE}/chat/groups/${groupId}/join`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to join group");
    }
    return response.json();
  },

  getGroupMessages: async (groupId: number): Promise<Message[]> => {
    const response = await fetch(`${API_BASE}/chat/groups/${groupId}/messages`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "Failed to fetch group messages");
    }
    return response.json();
  },

  // NEW: list members of a group
  getGroupMembers: async (groupId: number): Promise<GroupMember[]> => {
    const res = await fetch(`${API_BASE}/chat/groups/${groupId}/members`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to fetch group members");
    }
    return res.json();
  },

  // ---- people search / lookup ----
  checkUserExists: async (email: string): Promise<{ exists: boolean }> => {
    const response = await fetch(`${API_BASE}/auth/users/exists/${email}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error("Failed to verify user existence.");
    }
    return response.json();
  },

  lookupUser: async (email: string): Promise<{ id: number; display_name: string }> => {
    const res = await fetch(
      `${API_BASE}/users/lookup?email=${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );
    if (!res.ok) throw new Error("User not found");
    return res.json();
  },

  searchUsers: async (q: string, limit = 5): Promise<UserSearchResult[]> => {
    const base = API_BASE.replace(/\/$/, "");
    const url = `${base}/users/search?q=${encodeURIComponent(q)}&limit=${limit}`;
    const res = await fetch(url, { method: "GET", headers: getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  // ---- groups list for current user ----
  listMyGroups: async (): Promise<Group[]> => {
    const res = await fetch(`${API_BASE}/chat/groups/mine`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch my groups");
    return res.json();
  },
  leaveGroup: async (groupId: number): Promise<{ message: string }> => {
  const res = await fetch(`${API_BASE}/chat/groups/${groupId}/leave`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to leave group');
  }
  return res.json();
},

  addMemberToGroup: async (
    groupId: number,
    email: string
  ): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/chat/groups/${groupId}/add-member`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to add member");
    }
    return res.json();
  },
};
