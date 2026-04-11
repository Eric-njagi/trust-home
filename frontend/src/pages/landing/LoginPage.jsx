import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../services/apiClient.js';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('worker');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await authApi.login({ email, password, role });
      login(user);
      navigate(role === 'worker' ? '/worker' : '/client');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page auth-page">
      <div className="auth-shell">
        <header className="auth-shell-header">
          <h2 className="auth-shell-title">Welcome back</h2>
          <p className="auth-shell-lead">Sign in with the role you registered as — worker or client.</p>
        </header>
        <form className="card form auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <label>
            I am a
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="worker">Worker</option>
              <option value="client">Client</option>
            </select>
          </label>
          {error && <p className="error-text">{error}</p>}
          <button className="btn primary auth-submit" type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Log In'}
          </button>
          <p className="helper-text">
            Don&apos;t have an account? <Link to="/signup">Sign up</Link>
          </p>
        </form>
      </div>
    </section>
  );
};
