// src/pages/Chat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { chatApi, Message, Group, UserSearchResult } from '../utils/chatApi';
import './Chat.css';

interface Conversation {
  id: string;
  name: string;
  type: 'user' | 'group';
  lastMessage?: string;
  lastMessageTime?: string;
  isNew?: boolean;
}

const Chat: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // cache for sender display names in group chats
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});

  // add-member UI (by display_name search)
  const [addingMember, setAddingMember] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState<UserSearchResult[]>([]);
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState('');
  const [memberHighlight, setMemberHighlight] = useState(-1);

  // create-group inline UI
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');

  // members modal
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState<{ id: number; email: string; display_name: string }[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState('');

  // leave-group confirm modal
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);

  // toast
  const [toast, setToast] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const showToast = (type: 'success' | 'info' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 2500);
  };

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    loadConversationsAndGroups();
  }, []);

  // support /chat?to=<email>
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

  const loadConversationsAndGroups = async () => {
    try {
      setLoading(true);

      // build direct conversations
      const allMessages = await chatApi.getMyMessages();
      const myEmail = (user?.email || '').toLowerCase();
      const map = new Map<string, Conversation>();

      for (const m of allMessages) {
        if (m.is_group) continue;
        const other = m.sender_id.toLowerCase() === myEmail ? m.recipient_id : m.sender_id;
        if (!other || (myEmail && other.toLowerCase() === myEmail)) continue;

        const prev = map.get(other);
        if (!prev || new Date(m.timestamp) > new Date(prev.lastMessageTime || 0)) {
          let display = other;
          try {
            const prof = await chatApi.lookupUser(other);
            display = prof?.display_name || other;
          } catch {}
          map.set(other, {
            id: other,
            name: display,
            type: 'user',
            lastMessage: m.content,
            lastMessageTime: m.timestamp,
          });
        }
      }
      setConversations(Array.from(map.values()));

      // load groups
      const myGroups = await chatApi.listMyGroups();
      setGroups(myGroups);
    } catch (e) {
      console.error(e);
      setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const openChatByEmail = async (email: string) => {
    try {
      const target = email.trim();
      if (!target) return;

      const existing = conversations.find(
        (c) => c.type === 'user' && c.id.toLowerCase() === target.toLowerCase()
      );
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
      } catch {}

      let display = target;
      try {
        const u = await chatApi.lookupUser(target);
        display = u?.display_name || target;
      } catch {}

      const newConv: Conversation = { id: target, name: display, type: 'user', isNew: true };
      setConversations((prev) => [...prev, newConv]);
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
      let data: Message[] = [];
      if (conversation.type === 'group') {
        data = await chatApi.getGroupMessages(Number(conversation.id));
      } else {
        data = await chatApi.getMessagesWithUser(conversation.id);
      }
      setMessages(data);
      setSelectedConversation(conversation);

      if (conversation.type === 'group' && data.length) {
        const unique = Array.from(new Set(data.map((m) => m.sender_id))).filter(
          (e) => e && e.toLowerCase() !== (user?.email || '').toLowerCase()
        );
        const missing = unique.filter((e) => !senderNames[e]);
        if (missing.length) {
          const updates: Record<string, string> = {};
          await Promise.all(
            missing.map(async (email) => {
              try {
                const res = await chatApi.lookupUser(email);
                updates[email] = res.display_name || email;
              } catch {
                updates[email] = 'Member';
              }
            })
          );
          setSenderNames((prev) => ({ ...prev, ...updates }));
        }
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    try {
      const sent = await chatApi.sendMessage({
        recipient_id: selectedConversation.id,
        content: newMessage.trim(),
        is_group: selectedConversation.type === 'group',
      });
      setMessages((prev) => [...prev, sent]);
      setNewMessage('');
      if (selectedConversation.type === 'user') {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversation.id
              ? { ...c, lastMessage: sent.content, lastMessageTime: sent.timestamp, isNew: false }
              : c
          )
        );
      }
    } catch (e) {
      console.error(e);
      setError('Failed to send message');
    }
  };

  // ---- Add member (by display_name search) ----
  const handleMemberSearch = async (q: string) => {
    setMemberQuery(q);
    setMemberError('');
    setMemberResults([]);
    setMemberHighlight(-1);
    const term = q.trim();
    if (!term) return;
    try {
      setMemberLoading(true);
      const list = await chatApi.searchUsers(term, 5);
      setMemberResults(list);
      setMemberHighlight(list.length ? 0 : -1);
    } catch (e: any) {
      setMemberError(e?.message || 'Search failed');
    } finally {
      setMemberLoading(false);
    }
  };

  const selectMemberByIndex = async (idx: number) => {
    if (!selectedConversation || selectedConversation.type !== 'group') return;
    if (idx < 0 || idx >= memberResults.length) return;
    const choice = memberResults[idx];
    try {
      const pub = await chatApi.getUserPublicById(choice.id);
      const targetEmail = pub.email;
      if (!targetEmail) throw new Error('No email for user');
      if ((user?.email || '').toLowerCase() === targetEmail.toLowerCase()) {
        setMemberError("You can't add yourself");
        showToast('info', "You can't add yourself");
        return;
      }
      const res = await chatApi.addMemberToGroup(Number(selectedConversation.id), targetEmail);

      if (res?.message === 'Already a member') {
        showToast('info', `${choice.display_name} is already in this group`);
      } else {
        showToast('success', `${choice.display_name} was added to the group`);
      }

      setAddingMember(false);
      setMemberQuery('');
      setMemberResults([]);
      setMemberHighlight(-1);
      setMemberError('');
    } catch (e: any) {
      const msg = e?.message || 'Failed to add member';
      setMemberError(msg);
      showToast('error', msg);
    }
  };

  const onMemberKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMemberHighlight((h) => Math.min(memberResults.length - 1, h < 0 ? 0 : h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMemberHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (memberHighlight >= 0) selectMemberByIndex(memberHighlight);
    } else if (e.key === 'Escape') {
      setAddingMember(false);
      setMemberQuery('');
      setMemberResults([]);
      setMemberHighlight(-1);
      setMemberError('');
    }
  };

  // ---- Create group (inline UI) ----
  const onStartCreateGroup = () => {
    setCreatingGroup(true);
    setGroupName('');
  };
  const onCancelCreateGroup = () => {
    setCreatingGroup(false);
    setGroupName('');
  };
  const onCreateGroup = async () => {
    const name = groupName.trim();
    if (!name) return;
    try {
      const g = await chatApi.createGroup({ name });
      const myGroups = await chatApi.listMyGroups();
      setGroups(myGroups);
      const conv: Conversation = { id: String(g.id), name: g.name, type: 'group' };
      setSelectedConversation(conv);
      setMessages([]);
      setCreatingGroup(false);
      setGroupName('');
      showToast('success', 'Group created');
    } catch (e) {
      setError('Failed to create group');
    }
  };

  // ---- Members modal ----
  const openMembers = async () => {
    if (!selectedConversation || selectedConversation.type !== 'group') return;
    setShowMembers(true);
    setMembers([]);
    setMembersError('');
    setMembersLoading(true);
    try {
      const list = await chatApi.getGroupMembers(Number(selectedConversation.id));
      setMembers(list);
    } catch (e: any) {
      setMembersError(e?.message || 'Failed to load members');
    } finally {
      setMembersLoading(false);
    }
  };
  const closeMembers = () => {
    setShowMembers(false);
    setMembers([]);
    setMembersError('');
  };

  // ---- Leave group (pretty confirm modal) ----
  const leaveCurrentGroup = () => {
    setConfirmLeaveOpen(true);
  };
  const confirmLeave = async () => {
    if (!selectedConversation || selectedConversation.type !== 'group') return;
    const gid = Number(selectedConversation.id);
    try {
      await chatApi.leaveGroup(gid);
      setGroups((prev) => prev.filter((g) => String(g.id) !== selectedConversation.id));
      setSelectedConversation(null);
      setMessages([]);
      setAddingMember(false);
      setMemberQuery('');
      setMemberResults([]);
      setMemberHighlight(-1);
      setMemberError('');
      setConfirmLeaveOpen(false);
      showToast('success', 'You left the group');
    } catch (e: any) {
      showToast('error', e?.message || 'Failed to leave group');
    }
  };
  const cancelLeave = () => setConfirmLeaveOpen(false);

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-header">
          <h2>Messages</h2>
          {!creatingGroup ? (
            <button className="btn-ghost" onClick={onStartCreateGroup} type="button">
              New Group
            </button>
          ) : (
            <div className="new-group-row">
              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="message-input"
              />
              <button className="send-button" onClick={onCreateGroup} type="button">
                Create
              </button>
              <button className="btn-ghost" onClick={onCancelCreateGroup} type="button">
                Cancel
              </button>
            </div>
          )}
        </div>

        {groups.length > 0 && (
          <>
            <div className="conversation-section-title">GROUPS</div>
            <div className="conversations-list">
              {groups.map((g) => {
                const convLike: Conversation = { id: String(g.id), name: g.name, type: 'group' };
                const active =
                  selectedConversation?.type === 'group' &&
                  selectedConversation?.id === String(g.id);
                return (
                  <div
                    key={`group-${g.id}`}
                    className={`conversation-item ${active ? 'active' : ''}`}
                    onClick={() => loadMessages(convLike)}
                  >
                    <div className="conversation-info">
                      <div className="conversation-name">{g.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="conversation-section-title">DIRECT</div>
        <div className="conversations-list">
          {conversations.map((conv) => (
            <div
              key={`dm-${conv.id}`}
              className={`conversation-item ${
                selectedConversation?.type === 'user' && selectedConversation?.id === conv.id
                  ? 'active'
                  : ''
              }`}
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

              {selectedConversation.type === 'group' && (
                <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                  {!addingMember ? (
                    <>
                      <button className="btn-ghost" onClick={openMembers} type="button">
                        View members
                      </button>
                      <button
                        className="btn-ghost"
                        onClick={() => {
                          setAddingMember(true);
                          setMemberQuery('');
                          setMemberResults([]);
                          setMemberHighlight(-1);
                          setMemberError('');
                        }}
                        type="button"
                      >
                        Add member
                      </button>
                      <button className="btn-ghost" onClick={leaveCurrentGroup} type="button">
                        Leave group
                      </button>
                    </>
                  ) : (
                    <div
                      style={{
                        display: 'inline-flex',
                        gap: 8,
                        alignItems: 'center',
                        position: 'relative',
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Search people by name…"
                        value={memberQuery}
                        onChange={(e) => handleMemberSearch(e.target.value)}
                        onKeyDown={onMemberKeyDown}
                        className="message-input"
                        style={{ maxWidth: 260 }}
                        autoFocus
                      />
                      <button
                        className="btn-ghost"
                        onClick={() => {
                          setAddingMember(false);
                          setMemberQuery('');
                          setMemberResults([]);
                          setMemberHighlight(-1);
                          setMemberError('');
                        }}
                        type="button"
                      >
                        Cancel
                      </button>

                      {memberQuery && (memberLoading || memberResults.length || memberError) ? (
                        <div
                          className="search-dropdown"
                          style={{
                            top: 'calc(100% + 6px)',
                            left: 0,
                            width: 280,
                            maxHeight: 240,
                            overflowY: 'auto',
                          }}
                        >
                          {memberLoading && <div className="search-item dim">Searching…</div>}
                          {!memberLoading && memberError && (
                            <div className="search-item dim">{memberError}</div>
                          )}
                          {!memberLoading && !memberError && memberResults.length === 0 && (
                            <div className="search-item dim">No results</div>
                          )}
                          {!memberLoading &&
                            !memberError &&
                            memberResults.map((r, i) => (
                              <div
                                key={r.id}
                                className="search-item"
                                style={{
                                  background:
                                    i === memberHighlight ? 'var(--nav-hover, #f2f3f5)' : undefined,
                                }}
                                onMouseEnter={() => setMemberHighlight(i)}
                                onMouseLeave={() => setMemberHighlight(-1)}
                                onClick={() => selectMemberByIndex(i)}
                              >
                                <div className="search-texts">
                                  <div className="search-name">{r.display_name}</div>
                                  <div className="search-sub">{r.job_title || 'Member'}</div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="messages-container">
              {messages.map((msg, i) => {
                const isOwn = msg.sender_id === user?.email;
                const prev = messages[i - 1];
                const continued = !!prev && prev.sender_id === msg.sender_id;

                const sender =
                  selectedConversation.type === 'group'
                    ? isOwn
                      ? 'You'
                      : senderNames[msg.sender_id] || 'Member'
                    : isOwn
                    ? 'You'
                    : selectedConversation.name;

                return (
                  <div
                    key={msg.id}
                    className={`message ${isOwn ? 'message-own' : 'message-other'} ${
                      continued ? 'continued' : ''
                    }`}
                  >
                    <div className="message-content">
                      {!continued && <span className="message-user">{sender}</span>}
                      {msg.content}
                      <span className="message-meta">{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {selectedConversation.isNew && selectedConversation.type === 'user' && (
              <div className="new-conv-hint">
                Start a new conversation with {selectedConversation.name}
              </div>
            )}

            <div className="message-input-container">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="message-input"
              />
              <button onClick={sendMessage} className="send-button" type="button">
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="chat-placeholder">
            <h3>Select a conversation to start chatting</h3>
            <p>Choose a group or a direct conversation.</p>
          </div>
        )}
      </div>

      {/* Members modal */}
      {showMembers && (
        <div className="modal-backdrop" onClick={closeMembers}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Group members</h4>
              <button className="modal-close" onClick={closeMembers} type="button">
                ×
              </button>
            </div>
            <div className="modal-body">
              {membersLoading && <div className="dim">Loading…</div>}
              {!membersLoading && membersError && <div className="err">{membersError}</div>}
              {!membersLoading && !membersError && members.length === 0 && (
                <div className="dim">No members</div>
              )}
              {!membersLoading &&
                !membersError &&
                members.map((m) => (
                  <div key={m.id} className="member-item">
                    <div className="member-avatar">
                      {(m.display_name || m.email).slice(0, 1).toUpperCase()}
                    </div>
                    <div className="member-texts">
                      <div className="member-name">{m.display_name || 'Member'}</div>
                      <div className="member-sub">{m.email}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Pretty confirm modal for Leave group */}
      {confirmLeaveOpen && selectedConversation && selectedConversation.type === 'group' && (
        <div className="modal-backdrop" onClick={cancelLeave}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Leave group</h4>
              <button className="modal-close" onClick={cancelLeave} type="button">×</button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '6px 2px 14px' }}>
                Are you sure you want to leave <strong>{selectedConversation.name}</strong>?
              </p>
              <div className="modal-actions" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn-ghost" onClick={cancelLeave} type="button">Cancel</button>
                <button className="send-button" onClick={confirmLeave} type="button">Leave</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`} role="status" aria-live="polite">
          {toast.text}
        </div>
      )}

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
