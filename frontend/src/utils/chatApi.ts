// utils/chatApi.ts
import { API_BASE } from "../config";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Types based on your backend schemas
export interface Message {
  id: number;
  sender_id: string;
  recipient_id: string;
  content: string;
  timestamp: string;
  is_group: boolean;
}

export interface MessageCreate {
  recipient_id: string;
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

// API Functions
export const chatApi = {
  // Send a message (direct or group)
  sendMessage: async (messageData: MessageCreate): Promise<Message> => {
    const response = await fetch(`${API_BASE}/chat/messages/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(messageData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send message');
    }

    return response.json();
  },

  // Get all messages for current user
  getMyMessages: async (): Promise<Message[]> => {
    const response = await fetch(`${API_BASE}/chat/messages/`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }

    return response.json();
  },

  // Get messages between current user and specific user
  getMessagesWithUser: async (userId: string): Promise<Message[]> => {
    const response = await fetch(`${API_BASE}/chat/messages/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch conversation');
    }

    return response.json();
  },

  // Create a new group
  createGroup: async (groupData: GroupCreate): Promise<Group> => {
    const response = await fetch(`${API_BASE}/chat/groups/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(groupData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create group');
    }

    return response.json();
  },

  // Join a group
  joinGroup: async (groupId: number): Promise<{message: string}> => {
    const response = await fetch(`${API_BASE}/chat/groups/${groupId}/join`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to join group');
    }

    return response.json();
  },

  // Get messages for a specific group
  getGroupMessages: async (groupId: number): Promise<Message[]> => {
    const response = await fetch(`${API_BASE}/chat/groups/${groupId}/messages`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch group messages');
    }

    return response.json();
  }
};
