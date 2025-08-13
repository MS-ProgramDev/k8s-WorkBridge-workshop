import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatApi, Message } from '../utils/chatApi';
import './Chat.css';

interface Conversation {
  id: string;
  name: string;
  type: 'user'; // Type is now always 'user'
  lastMessage?: string;
  lastMessageTime?: string;
}

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // For creating new conversations
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatEmail, setNewChatEmail] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const allMessages = await chatApi.getMyMessages();

      // Extract unique user conversations from messages
      const conversationMap = new Map<string, Conversation>();

      allMessages.forEach(message => {
        // We only process direct messages, ignoring groups
        if (!message.is_group) {
          const otherUser = message.sender_id === user?.email ? message.recipient_id : message.sender_id;
          if (!conversationMap.has(otherUser)) {
            conversationMap.set(otherUser, {
              id: otherUser,
              name: otherUser,
              type: 'user', // Always a user conversation
              lastMessage: message.content,
              lastMessageTime: message.timestamp
            });
          }
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (err) {
      setError('Failed to load conversations');
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversation: Conversation) => {
    try {
      setLoading(true);
      // Now we only need to get messages for a user
      const messagesData = await chatApi.getMessagesWithUser(conversation.id);

      setMessages(messagesData);
      setSelectedConversation(conversation);
    } catch (err) {
      setError('Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const messageData = {
        recipient_id: selectedConversation.id,
        content: newMessage.trim(),
        is_group: false // This is now always false
      };

      const sentMessage = await chatApi.sendMessage(messageData);
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');

      // Update conversation last message
      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedConversation.id
            ? { ...conv, lastMessage: sentMessage.content, lastMessageTime: sentMessage.timestamp }
            : conv
        )
      );
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
    }
  };

  const startNewChat = async () => {
    // Basic validation to ensure the input is not empty or the user's own email
    if (!newChatEmail.trim() || newChatEmail.trim().toLowerCase() === user?.email.toLowerCase()) {
      setError("Please enter another user's email address.");
      return;
    }

    setLoading(true);
    setError(''); // Clear previous errors

    try {
      // Call the backend to verify the user exists
      const { exists } = await chatApi.checkUserExists(newChatEmail);

      if (!exists) {
        setError('This user does not exist. Please check the email address.');
        setLoading(false);
        return; // Stop the function if the user is not found
      }

      // If the user exists, proceed with creating the chat
      const existingConv = conversations.find(conv => conv.id === newChatEmail);
      if (existingConv) {
        setSelectedConversation(existingConv);
        loadMessages(existingConv);
      } else {
        const newConv: Conversation = {
          id: newChatEmail,
          name: newChatEmail,
          type: 'user'
        };
        setConversations(prev => [...prev, newConv]);
        setSelectedConversation(newConv);
        setMessages([]);
      }

      setNewChatEmail('');
      setShowNewChat(false);

    } catch (err) {
      setError('An error occurred while trying to start the chat.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-header">
          <h2>Messages</h2>
          <div className="chat-actions">
            <button onClick={() => setShowNewChat(!showNewChat)} className="btn-new-chat">
              New Chat
            </button>
            {/* "New Group" button removed */}
          </div>
        </div>

        {/* New Chat Form */}
        {showNewChat && (
          <div className="new-chat-form">
            <input
              type="email"
              placeholder="Enter email address"
              value={newChatEmail}
              onChange={(e) => setNewChatEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && startNewChat()}
            />
            <div className="form-actions">
              <button onClick={startNewChat}>Start Chat</button>
              <button onClick={() => setShowNewChat(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* "Join Group" form removed */}

        {/* Conversations List */}
        <div className="conversations-list">
          {conversations.map(conversation => (
            <div
              key={conversation.id}
              className={`conversation-item ${selectedConversation?.id === conversation.id ? 'active' : ''}`}
              onClick={() => loadMessages(conversation)}
            >
              <div className="conversation-info">
                <div className="conversation-name">
                  {conversation.name}
                </div>
                {conversation.lastMessage && (
                  <div className="conversation-preview">
                    {conversation.lastMessage.substring(0, 50)}
                    {conversation.lastMessage.length > 50 ? '...' : ''}
                  </div>
                )}
              </div>
              {conversation.lastMessageTime && (
                <div className="conversation-time">
                  {formatTime(conversation.lastMessageTime)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="chat-main-header">
              <h3>
                {selectedConversation.name}
              </h3>
            </div>

            {/* Messages */}
            <div className="messages-container">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`message ${message.sender_id === user?.email ? 'message-own' : 'message-other'}`}
                >
                  <div className="message-info">
                    <span className="message-sender">{message.sender_id}</span>
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                  </div>
                  <div className="message-content">{message.content}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="message-input-container">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="message-input"
              />
              <button onClick={sendMessage} className="send-button">
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="chat-placeholder">
            <h3>Select a conversation to start chatting</h3>
            <p>Choose from your existing conversations or start a new one.</p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')}>x</button>
        </div>
      )}
    </div>
  );
};

export default Chat;