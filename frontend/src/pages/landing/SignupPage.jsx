import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../services/apiClient.js';

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

export const SignupPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [role, setRole] = useState('worker');
  const [hourlyRate, setHourlyRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!/^\d{7,8}$/.test(idNumber)) {
      setError('National ID number must be 7 or 8 digits.');
      setLoading(false);
      return;
    }
    if (!/^\d{9,12}$/.test(phoneNumber)) {
      setError('Phone number must be 9 to 12 digits.');
      setLoading(false);
      return;
    }
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
          ? { name, email, password, role, city, phoneNumber, idNumber, hourlyRate: Number(hourlyRate) }
          : { name, email, password, role, city, phoneNumber, idNumber };
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
            City / area
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Nairobi (Kilimani)"
              autoComplete="address-level2"
              required
            />
          </label>
          <label>
            Phone number
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(digitsOnly(e.target.value))}
              placeholder="e.g. 0712345678"
              inputMode="numeric"
              pattern="[0-9]{9,12}"
              minLength={9}
              maxLength={12}
              autoComplete="tel"
              required
            />
          </label>
          <label>
            National ID number
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(digitsOnly(e.target.value))}
              placeholder="Enter 7 or 8 digits"
              inputMode="numeric"
              pattern="[0-9]{7,8}"
              minLength={7}
              maxLength={8}
              autoComplete="off"
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
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(digitsOnly(e.target.value))}
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
