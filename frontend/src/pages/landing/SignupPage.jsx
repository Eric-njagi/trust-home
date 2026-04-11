import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../services/apiClient.js';

export const SignupPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('worker');
  const [hourlyRate, setHourlyRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (role === 'worker') {
      const rate = Number(hourlyRate);
      if (!Number.isFinite(rate) || rate <= 0) {
        setError('Enter your hourly rate in KSh (must be greater than 0).');
        setLoading(false);
        return;
      }
    }
    try {
      const payload =
        role === 'worker'
          ? { name, email, password, role, hourlyRate: Number(hourlyRate) }
          : { name, email, password, role };
      const user = await authApi.signup(payload);
      login(user);
      navigate(role === 'worker' ? '/worker' : '/client');
    } catch (err) {
      setError(err.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page auth-page">
      <div className="auth-shell">
        <header className="auth-shell-header">
          <h2 className="auth-shell-title">Create your TrustHome account</h2>
          <p className="auth-shell-lead">
            Workers set their <strong>KSh per hour</strong> rate here so clients see fair pricing from day one.
          </p>
        </header>
        <form className="card form auth-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </label>
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
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>
          <label>
            I am a
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setError('');
              }}
            >
              <option value="worker">Worker (offer services)</option>
              <option value="client">Client (book help)</option>
            </select>
          </label>
          {role === 'worker' && (
            <label>
              Hourly rate (KSh)
              <div className="input-with-prefix auth-rate-input">
                <span className="input-prefix" aria-hidden="true">
                  KSh
                </span>
                <input
                  type="number"
                  min="1"
                  step="50"
                  inputMode="numeric"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="e.g. 450"
                  required
                  aria-describedby="signup-rate-hint"
                />
              </div>
              <span id="signup-rate-hint" className="input-hint">
                What you charge per hour for your services. You can change this later in your profile.
              </span>
            </label>
          )}
          {error && <p className="error-text">{error}</p>}
          <button className="btn primary auth-submit" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
          <p className="helper-text">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </section>
  );
};
