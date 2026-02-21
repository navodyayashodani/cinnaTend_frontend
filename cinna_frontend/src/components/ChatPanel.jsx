// src/components/ChatPanel.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatAPI, getUser } from '../services/api';

const POLL_ACTIVE = 1500;   // poll open conversation every 1.5s
const POLL_LIST   = 2000;   // poll contact list previews every 2s

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ user, size = 44 }) {
  const [imgErr, setImgErr] = useState(false);
  const initials = ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase()
    || user?.username?.[0]?.toUpperCase() || '?';
  const colors = ['#27ae60', '#d4922a', '#3498db', '#9b59b6', '#e74c3c', '#1abc9c'];
  const color  = colors[(user?.id || 0) % colors.length];

  if (user?.profile_picture && !imgErr) {
    return (
      <img
        src={user.profile_picture}
        alt={initials}
        onError={() => setImgErr(true)}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0, border: '2px solid #e2e8f0',
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color,
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.36, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ─── ChatPanel ────────────────────────────────────────────────────────────────
export default function ChatPanel({ isOpen, onClose, currentUserRole }) {
  const me = getUser();

  const contactRole  = currentUserRole === 'buyer' ? 'manufacturer' : 'buyer';
  const contactLabel = currentUserRole === 'buyer' ? 'Manufacturers' : 'Buyers';

  const [contacts, setContacts]       = useState([]);
  const [selected, setSelected]       = useState(null);
  const [messages, setMessages]       = useState([]);
  const [text, setText]               = useState('');
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(false);
  const [sending, setSending]         = useState(false);

  // contactId → { lastMessage, lastTime, unread }
  const [contactMeta, setContactMeta] = useState({});

  const messagesEndRef = useRef(null);
  const activePollRef  = useRef(null);
  const listPollRef    = useRef(null);
  const inputRef       = useRef(null);
  const contactsRef    = useRef([]);
  const selectedRef    = useRef(null);

  // Keep refs in sync
  useEffect(() => { contactsRef.current = contacts; }, [contacts]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // ── Load contacts when panel opens ────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      clearInterval(listPollRef.current);
      clearInterval(activePollRef.current);
      return;
    }
    chatAPI.getUsers(contactRole)
      .then(users => {
        setContacts(users);
        contactsRef.current = users;
      })
      .catch(err => console.error('Failed to load contacts:', err));
  }, [isOpen, contactRole]);

  // ── Background poll: update contact list previews ─────────────────────────
  const pollContactPreviews = useCallback(async () => {
    const list = contactsRef.current;
    if (!list.length) return;

    const results = await Promise.allSettled(
      list.map(c => chatAPI.getMessages(c.id))
    );

    setContactMeta(prev => {
      const updated = { ...prev };
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          const msgs      = result.value;
          const contactId = list[i].id;
          if (msgs.length > 0) {
            const last   = msgs[msgs.length - 1];
            const isMine = last.sender === me?.id || last.sender?.id === me?.id;
            const unread = msgs.filter(m => {
              const fromThem = m.sender === contactId || m.sender?.id === contactId;
              return fromThem && !m.is_read;
            }).length;

            updated[contactId] = {
              lastMessage: isMine ? `You: ${last.message}` : last.message,
              lastTime: last.created_at,
              unread: selectedRef.current?.id === contactId ? 0 : unread,
            };
          }
        }
      });
      return updated;
    });
  }, [me?.id]);

  // Start/stop background list polling
  useEffect(() => {
    if (!isOpen) {
      clearInterval(listPollRef.current);
      return;
    }
    pollContactPreviews();
    listPollRef.current = setInterval(pollContactPreviews, POLL_LIST);
    return () => clearInterval(listPollRef.current);
  }, [isOpen, pollContactPreviews]);

  // ── Fetch active conversation messages ────────────────────────────────────
  const fetchMessages = useCallback(async (contactId) => {
    if (!contactId) return;
    try {
      const data = await chatAPI.getMessages(contactId);
      setMessages(data);

      // Immediately update this contact's preview in the list
      if (data.length > 0) {
        const last   = data[data.length - 1];
        const isMine = last.sender === me?.id || last.sender?.id === me?.id;
        setContactMeta(prev => ({
          ...prev,
          [contactId]: {
            lastMessage: isMine ? `You: ${last.message}` : last.message,
            lastTime: last.created_at,
            unread: 0,
          },
        }));
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, [me?.id]);

  // Start polling active conversation when contact selected
  useEffect(() => {
    clearInterval(activePollRef.current);
    if (!selected) return;

    setMessages([]);
    setLoading(true);
    chatAPI.markRead(selected.id).catch(() => {});
    fetchMessages(selected.id).finally(() => setLoading(false));

    activePollRef.current = setInterval(() => fetchMessages(selected.id), POLL_ACTIVE);
    return () => clearInterval(activePollRef.current);
  }, [selected, fetchMessages]);

  // ── Auto-scroll to latest message ─────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Focus input on contact select ─────────────────────────────────────────
  useEffect(() => {
    if (selected) setTimeout(() => inputRef.current?.focus(), 100);
  }, [selected]);

  // ── Select a contact ──────────────────────────────────────────────────────
  const handleSelectContact = (contact) => {
    setSelected(contact);
    setContactMeta(prev => ({
      ...prev,
      [contact.id]: { ...(prev[contact.id] || {}), unread: 0 },
    }));
    chatAPI.markRead(contact.id).catch(() => {});
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!text.trim() || !selected || sending) return;
    const trimmed = text.trim();
    setText('');
    setSending(true);

    // Optimistic update — message appears instantly before API responds
    const optimistic = {
      id: Date.now(),
      sender: me?.id,
      sender_name: `${me?.first_name} ${me?.last_name}`,
      receiver: selected.id,
      message: trimmed,
      is_read: false,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setContactMeta(prev => ({
      ...prev,
      [selected.id]: {
        ...(prev[selected.id] || {}),
        lastMessage: `You: ${trimmed}`,
        lastTime: new Date().toISOString(),
        unread: 0,
      },
    }));

    try {
      // Non-blocking: send then fetch without awaiting send first
      chatAPI.sendMessage(selected.id, trimmed).then(() => {
        fetchMessages(selected.id);
      }).catch(err => {
        console.error('Send failed:', err);
        setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Time formatters ───────────────────────────────────────────────────────
  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatPreviewTime = (iso) => {
    if (!iso) return '';
    const d         = new Date(iso);
    const today     = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString())     return formatTime(iso);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d         = new Date(iso);
    const today     = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString())     return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const date = formatDate(msg.created_at);
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  const filteredContacts = contacts.filter(c => {
    const name = `${c.first_name} ${c.last_name} ${c.username}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={s.backdrop} />

      {/* Panel */}
      <div style={s.panel}>

        {/* ── Contact List Column ── */}
        <div style={s.contactCol}>
          <div style={s.contactHeader}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={s.contactHeaderTitle}>💬 Chat</span>
              <button onClick={onClose} style={s.closeBtn}>✕</button>
            </div>
            <p style={s.contactSubtitle}>{contactLabel}</p>
            <div style={s.searchBox}>
              <span style={{ color: '#94a3b8', fontSize: 14 }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${contactLabel.toLowerCase()}...`}
                style={s.searchInput}
              />
            </div>
          </div>

          <div style={s.contactList}>
            {filteredContacts.length === 0 && (
              <div style={s.emptyContacts}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>👤</div>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>
                  No {contactLabel.toLowerCase()} found
                </div>
              </div>
            )}

            {filteredContacts.map(contact => {
              const isActive    = selected?.id === contact.id;
              const fullName    = `${contact.first_name} ${contact.last_name}`.trim() || contact.username;
              const meta        = contactMeta[contact.id];
              const preview     = meta?.lastMessage;
              const previewTime = meta?.lastTime;
              const unread      = meta?.unread || 0;

              return (
                <button
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  style={{
                    ...s.contactItem,
                    background: isActive
                      ? '#e8f5e9'
                      : unread > 0
                        ? '#f0fdf4'
                        : 'transparent',
                  }}
                >
                  <Avatar user={contact} size={46} />

                  <div style={s.contactInfo}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ ...s.contactName, fontWeight: unread > 0 ? 700 : 600 }}>
                        {fullName}
                      </span>
                      {previewTime && (
                        <span style={{
                          fontSize: '0.7rem',
                          color: unread > 0 ? '#27ae60' : '#b0bec5',
                          flexShrink: 0, marginLeft: 6,
                        }}>
                          {formatPreviewTime(previewTime)}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                      <span style={{
                        ...s.contactPreview,
                        color: unread > 0 ? '#374151' : '#94a3b8',
                        fontWeight: unread > 0 ? 600 : 400,
                      }}>
                        {preview
                          ? preview
                          : <span style={{ fontStyle: 'italic', color: '#c0c9d4' }}>No messages yet</span>
                        }
                      </span>
                      {unread > 0 && (
                        <span style={s.unreadBadge}>
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div style={s.colDivider} />

        {/* ── Message Column ── */}
        <div style={s.messageCol}>
          {!selected ? (
            <div style={s.emptyChat}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
              <h3 style={{ color: '#1a2e44', marginBottom: 8, fontWeight: 700 }}>
                Start a conversation
              </h3>
              <p style={{ color: '#94a3b8', fontSize: 14 }}>
                Select a {contactRole} from the list to begin chatting
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div style={s.chatHeader}>
                <Avatar user={selected} size={40} />
                <div style={{ marginLeft: 12 }}>
                  <div style={s.chatHeaderName}>
                    {`${selected.first_name} ${selected.last_name}`.trim() || selected.username}
                  </div>
                  <div style={s.chatHeaderRole}>
                    {contactRole === 'manufacturer' ? '🏭 Manufacturer' : '🛒 Buyer'}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={s.messageArea}>
                {loading && (
                  <div style={s.loadingDots}>
                    <span style={s.dot} />
                    <span style={{ ...s.dot, animationDelay: '0.2s' }} />
                    <span style={{ ...s.dot, animationDelay: '0.4s' }} />
                  </div>
                )}

                {!loading && messages.length === 0 && (
                  <div style={s.noMessages}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>👋</div>
                    <div style={{ color: '#94a3b8', fontSize: 13 }}>
                      Say hello to {selected.first_name || selected.username}!
                    </div>
                  </div>
                )}

                {Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    <div style={s.dateSeparator}>
                      <span style={s.dateBadge}>{date}</span>
                    </div>
                    {msgs.map((msg, i) => {
                      const isMine   = msg.sender === me?.id || msg.sender?.id === me?.id;
                      const showTime = i === msgs.length - 1 || msgs[i + 1]?.sender !== msg.sender;
                      return (
                        <div
                          key={msg.id}
                          style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 2 }}
                        >
                          <div style={{
                            ...s.bubble,
                            ...(isMine ? s.bubbleMine : s.bubbleTheirs),
                            opacity: msg._optimistic ? 0.75 : 1,
                          }}>
                            <div style={s.bubbleText}>{msg.message}</div>
                            {showTime && (
                              <div style={{ ...s.bubbleTime, textAlign: isMine ? 'right' : 'left' }}>
                                {formatTime(msg.created_at)}
                                {isMine && (
                                  <span style={{ marginLeft: 4 }}>
                                    {msg._optimistic ? '🕐' : msg.is_read ? '✓✓' : '✓'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div style={s.inputRow}>
                <textarea
                  ref={inputRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… (Enter to send)"
                  rows={1}
                  style={s.textInput}
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || sending}
                  style={{
                    ...s.sendBtn,
                    opacity: !text.trim() || sending ? 0.5 : 1,
                    cursor:  !text.trim() || sending ? 'not-allowed' : 'pointer',
                  }}
                >
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%            { transform: translateY(-6px); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.35)',
    backdropFilter: 'blur(2px)',
    zIndex: 900,
  },
  panel: {
    position: 'fixed', top: 0, right: 0, bottom: 0,
    width: 'min(820px, 95vw)',
    background: '#fff',
    display: 'flex', flexDirection: 'row',
    boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
    zIndex: 901,
    animation: 'slideIn 0.3s cubic-bezier(0.4,0,0.2,1)',
    borderRadius: '16px 0 0 16px',
    overflow: 'hidden',
  },

  // ── Contact column
  contactCol: {
    width: 300, minWidth: 280,
    display: 'flex', flexDirection: 'column',
    background: '#f8fafc', borderRight: '1px solid #e2e8f0',
  },
  contactHeader: {
    padding: '20px 16px 12px',
    background: '#fff',
    borderBottom: '1px solid #e2e8f0',
    flexShrink: 0,
  },
  contactHeaderTitle: { fontWeight: 800, fontSize: '1.1rem', color: '#1a2e44' },
  contactSubtitle:    { margin: '2px 0 10px', color: '#64748b', fontSize: '0.8rem' },
  closeBtn: {
    background: 'none', border: 'none', fontSize: 18,
    color: '#94a3b8', cursor: 'pointer', padding: '2px 6px',
    borderRadius: 6, lineHeight: 1,
  },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#f1f5f9', borderRadius: 10, padding: '8px 12px',
  },
  searchInput: {
    flex: 1, border: 'none', background: 'none',
    outline: 'none', fontSize: '0.875rem', color: '#1a2e44',
  },
  contactList:   { flex: 1, overflowY: 'auto', padding: '8px 0' },
  contactItem: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', border: 'none',
    cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
  },
  contactInfo:    { flex: 1, minWidth: 0 },
  contactName:    { fontSize: '0.9rem', color: '#1a2e44', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  contactPreview: { fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  emptyContacts:  {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    height: '100%', padding: 24,
  },
  unreadBadge: {
    background: '#27ae60', color: '#fff',
    borderRadius: 999, fontSize: '0.68rem', fontWeight: 700,
    padding: '2px 6px', minWidth: 18, textAlign: 'center',
    flexShrink: 0, marginLeft: 6,
  },

  colDivider: { width: 1, background: '#e2e8f0', flexShrink: 0 },

  // ── Message column
  messageCol: {
    flex: 1, display: 'flex', flexDirection: 'column',
    background: '#f0f2f5', minWidth: 0,
  },
  emptyChat: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: 32, textAlign: 'center',
  },
  chatHeader: {
    display: 'flex', alignItems: 'center',
    padding: '14px 20px', background: '#fff',
    borderBottom: '1px solid #e2e8f0', flexShrink: 0,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  chatHeaderName: { fontWeight: 700, fontSize: '0.95rem', color: '#1a2e44' },
  chatHeaderRole: { fontSize: '0.75rem', color: '#64748b', marginTop: 1 },
  messageArea: {
    flex: 1, overflowY: 'auto', padding: '16px 20px',
    display: 'flex', flexDirection: 'column',
  },
  dateSeparator: { display: 'flex', justifyContent: 'center', margin: '12px 0' },
  dateBadge: {
    background: 'rgba(0,0,0,0.12)', color: '#555',
    borderRadius: 999, padding: '3px 12px',
    fontSize: '0.72rem', fontWeight: 500,
  },
  bubble: {
    maxWidth: '68%', padding: '8px 12px',
    borderRadius: 16, marginBottom: 2, wordBreak: 'break-word',
  },
  bubbleMine:   { background: '#dcf8c6', borderBottomRightRadius: 4 },
  bubbleTheirs: { background: '#fff', borderBottomLeftRadius: 4, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' },
  bubbleText:   { fontSize: '0.88rem', color: '#1a2e44', lineHeight: 1.45 },
  bubbleTime:   { fontSize: '0.68rem', color: '#94a3b8', marginTop: 4 },
  noMessages: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
  },
  loadingDots: { display: 'flex', gap: 6, justifyContent: 'center', padding: 24 },
  dot: {
    width: 8, height: 8, borderRadius: '50%',
    background: '#27ae60', display: 'inline-block',
    animation: 'bounce 1.2s infinite ease-in-out',
  },
  inputRow: {
    display: 'flex', alignItems: 'flex-end', gap: 10,
    padding: '12px 16px', background: '#fff',
    borderTop: '1px solid #e2e8f0', flexShrink: 0,
  },
  textInput: {
    flex: 1, border: '1px solid #e2e8f0', borderRadius: 24,
    padding: '10px 16px', fontSize: '0.9rem', outline: 'none',
    resize: 'none', fontFamily: 'inherit', color: '#1a2e44',
    background: '#f8fafc', lineHeight: 1.4, maxHeight: 100,
    transition: 'border-color 0.2s',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: '50%',
    background: '#27ae60', border: 'none',
    color: '#fff', fontSize: 18, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'background 0.2s, transform 0.1s',
  },
};