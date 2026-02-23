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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await authApi.signup({ name, email, password, role });
      // Auto-login after signup for convenience.
      login(user);
      navigate(role === 'worker' ? '/worker' : '/client');
    } catch (err) {
      setError('Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page auth-page">
      <h2>Sign Up</h2>
      <form className="card form" onSubmit={handleSubmit}>
        <label>
          Full name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Sign Up'}
        </button>
        <p className="helper-text">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </section>
  );
};
