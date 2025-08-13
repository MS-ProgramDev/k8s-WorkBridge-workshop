import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatApi, Message, Group } from '../utils/chatApi';
import './Chat.css';

interface Conversation {
  id: string;
  name: string;
  type: 'user' | 'group';
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
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinGroupId, setJoinGroupId] = useState('');

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
      
      // Extract unique conversations from messages
      const conversationMap = new Map<string, Conversation>();
      
      allMessages.forEach(message => {
        if (!message.is_group) {
          // Direct message conversation
          const otherUser = message.sender_id === user?.email ? message.recipient_id : message.sender_id;
          if (!conversationMap.has(otherUser)) {
            conversationMap.set(otherUser, {
              id: otherUser,
              name: otherUser,
              type: 'user',
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
      let messagesData: Message[];

      if (conversation.type === 'user') {
        messagesData = await chatApi.getMessagesWithUser(conversation.id);
      } else {
        messagesData = await chatApi.getGroupMessages(parseInt(conversation.id));
      }

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
        is_group: selectedConversation.type === 'group'
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
    if (!newChatEmail.trim()) return;

    try {
      // Check if conversation already exists
      const existingConv = conversations.find(conv => conv.id === newChatEmail);
      if (existingConv) {
        setSelectedConversation(existingConv);
        loadMessages(existingConv);
      } else {
        // Create new conversation entry
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
      setError('Failed to start new chat');
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const group = await chatApi.createGroup({ name: newGroupName });
      const newConv: Conversation = {
        id: group.id.toString(),
        name: group.name,
        type: 'group'
      };
      
      setConversations(prev => [...prev, newConv]);
      setNewGroupName('');
      setShowNewGroup(false);
    } catch (err) {
      setError('Failed to create group');
      console.error('Error creating group:', err);
    }
  };

  const joinGroup = async () => {
    if (!joinGroupId.trim()) return;

    try {
      await chatApi.joinGroup(parseInt(joinGroupId));
      
      // Add group to conversations (you might want to fetch group details)
      const newConv: Conversation = {
        id: joinGroupId,
        name: `Group ${joinGroupId}`,
        type: 'group'
      };
      
      setConversations(prev => [...prev, newConv]);
      setJoinGroupId('');
    } catch (err) {
      setError('Failed to join group');
      console.error('Error joining group:', err);
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
            <button onClick={() => setShowNewChat(true)} className="btn-new-chat">
              New Chat
            </button>
            <button onClick={() => setShowNewGroup(true)} className="btn-new-group">
              New Group
            </button>
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

        {/* New Group Form */}
        {showNewGroup && (
          <div className="new-chat-form">
            <input
              type="text"
              placeholder="Group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createGroup()}
            />
            <div className="form-actions">
              <button onClick={createGroup}>Create Group</button>
              <button onClick={() => setShowNewGroup(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Join Group Form */}
        <div className="join-group-form">
          <input
            type="number"
            placeholder="Group ID to join"
            value={joinGroupId}
            onChange={(e) => setJoinGroupId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && joinGroup()}
          />
          <button onClick={joinGroup}>Join</button>
        </div>

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
                  {conversation.type === 'group' ? '則 ' : '側 '}
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
                {selectedConversation.type === 'group' ? '則 ' : '側 '}
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
            <p>Choose from your existing conversations or start a new one</p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')}>ﾃ</button>
        </div>
      )}
    </div>
  );
};

export default Chat;