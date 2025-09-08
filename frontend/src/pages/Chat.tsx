import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chatApi, Message } from '../utils/chatApi';
import './Chat.css';

interface Conversation {
  id: string;              // email
  name: string;            // display_name
  type: 'user';
  lastMessage?: string;
  lastMessageTime?: string;
  isNew?: boolean;         // true if no history yet
}

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversations();
  }, []);

  // Handle /chat?to=<email>
  useEffect(() => {
    const to = (searchParams.get('to') || '').trim();
    if (!to) return;

    if (user?.email && to.toLowerCase() === user.email.toLowerCase()) {
      navigate('/chat', { replace: true });
      return;
    }

    openChatByEmail(to);
    navigate('/chat', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const allMessages = await chatApi.getMyMessages();

      const conversationMap = new Map<string, Conversation>();
      for (const message of allMessages) {
        if (!message.is_group) {
          const myEmail = user?.email || '';
          const otherUser =
            message.sender_id.toLowerCase() === myEmail.toLowerCase()
              ? message.recipient_id
              : message.sender_id;

          if (myEmail && otherUser.toLowerCase() === myEmail.toLowerCase()) continue;

          if (!conversationMap.has(otherUser)) {
            let display = otherUser;
            try {
              const profile = await chatApi.lookupUser(otherUser);
              display = profile?.display_name || otherUser;
            } catch {
              /* ignore lookup failure */
            }
            conversationMap.set(otherUser, {
              id: otherUser,
              name: display,
              type: 'user',
              lastMessage: message.content,
              lastMessageTime: message.timestamp,
            });
          } else {
            const prev = conversationMap.get(otherUser)!;
            if (!prev.lastMessageTime || new Date(message.timestamp) > new Date(prev.lastMessageTime)) {
              conversationMap.set(otherUser, {
                ...prev,
                lastMessage: message.content,
                lastMessageTime: message.timestamp,
              });
            }
          }
        }
      }
      setConversations(Array.from(conversationMap.values()));
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const openChatByEmail = async (email: string) => {
    try {
      const target = email.trim();
      if (!target) return;

      const existing = conversations.find(c => c.id.toLowerCase() === target.toLowerCase());
      if (existing) {
        await loadMessages(existing);
        return;
      }

      try {
        const { exists } = await chatApi.checkUserExists(target);
        if (!exists) {
          setError('Target user does not exist.');
          return;
        }
      } catch {
        /* allow compose even if exists-check failed temporarily */
      }

      let display = target;
      try {
        const u = await chatApi.lookupUser(target);
        display = u?.display_name || target;
      } catch {
        /* ignore lookup failure */
      }

      const newConv: Conversation = { id: target, name: display, type: 'user', isNew: true };
      setConversations(prev => [...prev, newConv]);
      setSelectedConversation(newConv);
      setMessages([]);
    } catch (e) {
      console.error(e);
      setError('Failed to open chat.');
    }
  };

  const loadMessages = async (conversation: Conversation) => {
    try {
      setLoading(true);
      const data = await chatApi.getMessagesWithUser(conversation.id);
      setMessages(data);
      setSelectedConversation(conversation);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
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
        is_group: false,
      };
      const sent = await chatApi.sendMessage(messageData);
      setMessages(prev => [...prev, sent]);
      setNewMessage('');

      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedConversation.id
            ? { ...conv, lastMessage: sent.content, lastMessageTime: sent.timestamp, isNew: false }
            : conv
        )
      );
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const formatTime = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-header">
          <h2>Messages</h2>
        </div>

        <div className="conversations-list">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
              onClick={() => loadMessages(conv)}
            >
              <div className="conversation-info">
                <div className="conversation-name">{conv.name}</div>
                {conv.lastMessage && (
                  <div className="conversation-preview">
                    {conv.lastMessage.substring(0, 50)}
                    {conv.lastMessage.length > 50 ? '…' : ''}
                  </div>
                )}
              </div>
              {conv.lastMessageTime && (
                <div className="conversation-time">{formatTime(conv.lastMessageTime)}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="chat-main">
        {selectedConversation ? (
          <>
            <div className="chat-main-header">
              <h3>{selectedConversation.name}</h3>
            </div>

            <div className="messages-container">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`message ${msg.sender_id === user?.email ? 'message-own' : 'message-other'}`}
                >
                  <div className="message-info">
                    <span className="message-sender">
                      {msg.sender_id === user?.email ? 'You' : selectedConversation.name}
                    </span>
                    <span className="message-time">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className="message-content">{msg.content}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {selectedConversation.isNew && (
              <div className="new-conv-hint">
                Start a new conversation with {selectedConversation.name}
              </div>
            )}

            <div className="message-input-container">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
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
            <p>Choose from your existing conversations.</p>
          </div>
        )}
      </div>

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
