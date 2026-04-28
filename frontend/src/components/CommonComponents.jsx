import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { SERVICE_CATEGORIES } from '../constants/services.js';
import { useAuth } from '../context/AuthContext.jsx';
import { chatApi } from '../services/apiClient.js';
import { getServiceLabel } from '../data/mockData.js';
import { formatKes } from '../utils/formatKes.js';

export const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <Link to="/" className="navbar-brand">
          TrustHome
        </Link>
      </div>
      <nav className="navbar-center">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          Home
        </Link>
        {user?.role === 'worker' && (
          <Link to="/worker" className={location.pathname.startsWith('/worker') ? 'active' : ''}>
            Worker
          </Link>
        )}
        {user?.role === 'client' && (
          <Link to="/client" className={location.pathname.startsWith('/client') ? 'active' : ''}>
            Client
          </Link>
        )}
      </nav>
      <div className="navbar-right">
        {user ? (
          <>
            <span className="navbar-user">{user.name}</span>
            <button className="btn secondary small" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn ghost small">
              Log In
            </Link>
            <Link to="/signup" className="btn primary small">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

const CLIENT_TABS = [
  { id: 'browse', label: 'Browse Workers' },
  { id: 'jobs', label: 'My Jobs' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'payment', label: 'M-Pesa' },
  { id: 'chat', label: 'Chat' },
];

const WORKER_TABS = [
  { id: 'jobs', label: 'My Jobs' },
  { id: 'profile', label: 'Profile' },
  { id: 'availability', label: 'Availability' },
  { id: 'chat', label: 'Chat' },
];

export const TaskBar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const isDashboard =
    location.pathname.startsWith('/worker') || location.pathname.startsWith('/client');

  if (!user || !isDashboard) return null;

  const tabs = user.role === 'worker' ? WORKER_TABS : CLIENT_TABS;
  const activeTab = searchParams.get('tab') || tabs[0].id;

  return (
    <nav className="taskbar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`taskbar-tab${activeTab === tab.id ? ' active' : ''}`}
          onClick={() => setSearchParams({ tab: tab.id })}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
};

export const ServiceCategorySelect = ({ value, onChange, includeAny = true }) => {
  return (
    <label className="field">
      Service type
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {includeAny && <option value="">Any</option>}
        {SERVICE_CATEGORIES.map((svc) => (
          <option key={svc.id} value={svc.id}>
            {svc.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export const RatingStars = ({ value }) => {
  const fullStars = Math.round(value || 0);
  return (
    <span className="rating-stars" aria-label={`Rated ${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <span key={idx} className={idx < fullStars ? 'star full' : 'star'}>
          ★
        </span>
      ))}
      <span className="rating-value">{value?.toFixed ? value.toFixed(1) : value}</span>
    </span>
  );
};

export const ChatWindow = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');

  useEffect(() => {
    async function loadContacts() {
      try {
        const data = await chatApi.listContacts();
        setContacts(data);
        if (data.length > 0) {
          setSelectedContactId((prev) => prev || data[0].id);
        } else {
          setSelectedContactId('');
        }
      } catch {
        setContacts([]);
        setSelectedContactId('');
      }
    }
    loadContacts();
  }, []);

  useEffect(() => {
    async function loadMessages() {
      if (!selectedContactId) {
        setMessages([]);
        return;
      }
      try {
        const data = await chatApi.listMessages({ peerUserId: selectedContactId });
        setMessages(data);
      } catch {
        setMessages([]);
      }
    }
    loadMessages();
  }, [selectedContactId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedContactId) return;
    if (!input.trim() || sending) return;
    setSending(true);
    setChatError('');
    try {
      const newMsg = await chatApi.sendMessage({ toUserId: selectedContactId, text: input.trim() });
      setMessages((prev) => [...prev, newMsg]);
      setInput('');
    } catch (err) {
      setChatError(err.message || 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card chat-window">
      <h3>Chat</h3>
      <label className="field">
        Chat with
        <select
          value={selectedContactId}
          onChange={(e) => setSelectedContactId(e.target.value)}
          disabled={contacts.length === 0}
        >
          {contacts.length === 0 ? (
            <option value="">No contacts yet</option>
          ) : (
            contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.role})
              </option>
            ))
          )}
        </select>
      </label>
      {chatError && (
        <p className="error-text" role="alert">
          {chatError}
        </p>
      )}
      <div className="chat-messages">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`chat-message ${m.from === 'worker' ? 'from-worker' : 'from-client'} ${
              m.fromUserId === user?.id ? 'is-me' : ''
            }`}
          >
            <div className="chat-meta">
              <span className="chat-from">
                {m.fromUserId === user?.id ? 'You' : m.from === 'worker' ? 'Worker' : 'Client'}
              </span>
              <span className="chat-time">{m.timestamp}</span>
            </div>
            <p>{m.text}</p>
          </div>
        ))}
      </div>
      <form className="chat-input" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending || !selectedContactId}
          aria-busy={sending}
          maxLength={4000}
        />
        <button
          type="submit"
          className="btn primary small"
          disabled={sending || !input.trim() || !selectedContactId}
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export const WorkerSummary = ({ worker }) => {
  const services = Array.isArray(worker.services) ? worker.services : [];
  const rate = Number(worker.hourlyRate) || 0;
  return (
    <div className="worker-summary">
      <h4>{worker.name}</h4>
      <p className="muted">{worker.city}</p>
      <p>
        Services:{' '}
        {services.length > 0 ? (
          services.map((svc) => getServiceLabel(svc)).join(', ')
        ) : (
          <span className="muted">Not listed yet</span>
        )}
      </p>
      <p>
        Rate:{' '}
        {rate > 0 ? (
          <>
            <strong>{formatKes(rate)}</strong> / hour
          </>
        ) : (
          <span className="muted">Add your hourly rate</span>
        )}
      </p>
      <p>
        Status:{' '}
        <span className={worker.available ? 'status available' : 'status booked'}>
          {worker.available ? 'Available' : 'Booked'}
        </span>
      </p>
      <RatingStars value={worker.rating} />
    </div>
  );
};
