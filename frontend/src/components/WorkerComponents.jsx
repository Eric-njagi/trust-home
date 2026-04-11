import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { SERVICE_CATEGORIES } from '../constants/services.js';
import { getServiceLabel } from '../data/mockData.js';
import { workerApi } from '../services/apiClient.js';
import { WorkerSummary } from './CommonComponents.jsx';

export const WorkerAvailabilityToggle = ({ available, onToggle }) => {
  return (
    <div className="card availability-toggle">
      <h3>Your availability</h3>
      <p>
        You are currently:{' '}
        <span className={available ? 'status available' : 'status booked'}>
          {available ? 'Available' : 'Booked'}
        </span>
      </p>
      <p className="muted availability-hint">
        When you are booked, you stay visible to clients but they see you as unavailable for new work.
      </p>
      <button className="btn primary" type="button" onClick={() => onToggle()}>
        Toggle to {available ? 'Booked' : 'Available'}
      </button>
    </div>
  );
};

export const WorkerJobList = ({ jobs, onJobsChange }) => {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const handleStatus = async (jobId, status) => {
    setBusyId(jobId);
    setError('');
    try {
      await workerApi.updateJobStatus(jobId, status);
      await onJobsChange?.();
    } catch (err) {
      setError(err.message || 'Could not update job');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="card job-list">
      <h3>Your jobs</h3>
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      {jobs.length === 0 && <p className="muted">No jobs yet.</p>}
      <ul>
        {jobs.map((job) => (
          <li key={job.id} className="job-item">
            <div className="job-main">
              <h4>{job.clientName}</h4>
              <p>{getServiceLabel(job.service)}</p>
              <p className="muted">
                {job.date} • {job.time}
              </p>
            </div>
            <div className="job-actions">
              <span className={`status badge ${job.status}`}>{job.status}</span>
              {job.status === 'pending' && (
                <div className="job-buttons">
                  <button
                    type="button"
                    className="btn small primary"
                    disabled={busyId === job.id}
                    onClick={() => handleStatus(job.id, 'accepted')}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="btn small secondary"
                    disabled={busyId === job.id}
                    onClick={() => handleStatus(job.id, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

function ProfileSkeleton() {
  return (
    <div className="card profile-panel profile-panel-loading" aria-busy="true">
      <div className="profile-skeleton-header" />
      <div className="profile-skeleton-line wide" />
      <div className="profile-skeleton-line" />
      <div className="profile-skeleton-line medium" />
      <div className="profile-skeleton-chips">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="profile-skeleton-chip" />
        ))}
      </div>
    </div>
  );
}

function CompletenessBar({ checks }) {
  const done = checks.filter((c) => c.done).length;
  const total = checks.length;
  const pct = Math.round((done / total) * 100);
  return (
    <div className="profile-completeness">
      <div className="profile-completeness-head">
        <span className="profile-completeness-title">Profile strength</span>
        <span className="profile-completeness-pct">{pct}%</span>
      </div>
      <div className="profile-completeness-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="profile-completeness-fill" style={{ width: `${pct}%` }} />
      </div>
      <ul className="profile-completeness-list">
        {checks.map((c) => (
          <li key={c.id} className={c.done ? 'done' : ''}>
            <span className="profile-check-icon" aria-hidden="true">
              {c.done ? '✓' : '○'}
            </span>
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const WorkerProfilePanel = ({ profile, onProfileSaved, onRetry }) => {
  const { user, login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [selectedServices, setSelectedServices] = useState(() => new Set());
  const [rating, setRating] = useState(0);
  const [available, setAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState('neutral');

  useEffect(() => {
    if (!profile || typeof profile !== 'object') return;
    setName(profile.name || '');
    setEmail(profile.email || user?.email || '');
    setCity(profile.city || '');
    setHourlyRate(profile.hourlyRate != null ? String(profile.hourlyRate) : '');
    setSelectedServices(new Set(profile.services || []));
    setRating(Number(profile.rating) || 0);
    setAvailable(!!profile.available);
  }, [profile, user?.email]);

  const checks = useMemo(() => {
    const hasName = name.trim().length > 0;
    const hasCity = city.trim().length > 0;
    const hasRate = hourlyRate !== '' && Number(hourlyRate) > 0;
    const hasServices = selectedServices.size > 0;
    return [
      { id: 'name', done: hasName, label: 'Display name' },
      { id: 'city', done: hasCity, label: 'City or area' },
      { id: 'rate', done: hasRate, label: 'Hourly rate' },
      { id: 'svc', done: hasServices, label: 'At least one service' },
    ];
  }, [name, city, hourlyRate, selectedServices]);

  const previewWorker = useMemo(
    () => ({
      id: 'preview',
      name: name.trim() || 'Your name',
      rating,
      services: Array.from(selectedServices),
      hourlyRate: Number(hourlyRate) || 0,
      city: city.trim() || 'Your area',
      available,
    }),
    [name, city, hourlyRate, selectedServices, rating, available],
  );

  const toggleService = (id) => {
    setSelectedServices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setMessageTone('neutral');
    try {
      const rate = hourlyRate === '' ? 0 : Number(hourlyRate);
      const data = await workerApi.updateMyProfile({
        name: name.trim(),
        city: city.trim(),
        hourlyRate: Number.isFinite(rate) ? rate : 0,
        services: Array.from(selectedServices),
      });
      onProfileSaved?.(data);
      if (user) {
        login({
          ...user,
          name: data.name,
          email: data.email || user.email,
        });
      }
      setMessage('Profile saved. Clients see these details when they browse.');
      setMessageTone('success');
    } catch (err) {
      setMessage(err.message || 'Save failed.');
      setMessageTone('error');
    } finally {
      setSaving(false);
    }
  };

  if (profile === undefined) {
    return <ProfileSkeleton />;
  }

  if (profile === null) {
    return (
      <div className="card profile-panel profile-panel-error">
        <h3>Your profile</h3>
        <p className="error-text">We could not load your profile. Check your connection and try again.</p>
        <button type="button" className="btn primary" onClick={() => onRetry?.()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="profile-editor card profile-panel">
      <div className="profile-editor-head">
        <div>
          <h3 className="profile-editor-title">Your public profile</h3>
          <p className="muted profile-editor-subtitle">
            This is what clients see in search. Keep it accurate so bookings match what you offer.
          </p>
        </div>
      </div>

      <div className="profile-editor-grid">
        <form className="profile-form form" onSubmit={handleSave} noValidate>
          <CompletenessBar checks={checks} />

          <section className="profile-section" aria-labelledby="profile-section-account">
            <h4 id="profile-section-account" className="profile-section-title">
              Account
            </h4>
            <p className="input-hint">Sign-in email (read-only). To change it, contact support.</p>
            <label className="profile-field">
              <span className="profile-field-label">Email</span>
              <input type="email" className="input-readonly" value={email} readOnly tabIndex={-1} aria-readonly="true" />
            </label>
          </section>

          <section className="profile-section" aria-labelledby="profile-section-identity">
            <h4 id="profile-section-identity" className="profile-section-title">
              How clients know you
            </h4>
            <label className="profile-field">
              <span className="profile-field-label">Display name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane D."
                autoComplete="name"
                required
                maxLength={120}
              />
            </label>
            <label className="profile-field">
              <span className="profile-field-label">City or area</span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Westlands, Nairobi"
                autoComplete="address-level2"
                maxLength={128}
              />
              <span className="input-hint">Neighborhood or city is enough; avoid posting your full street address.</span>
            </label>
          </section>

          <section className="profile-section" aria-labelledby="profile-section-rate">
            <h4 id="profile-section-rate" className="profile-section-title">
              Rate
            </h4>
            <label className="profile-field profile-field-rate">
              <span className="profile-field-label">Hourly rate (KSh)</span>
              <div className="input-with-prefix">
                <span className="input-prefix" aria-hidden="true">
                  KSh
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="0"
                  aria-describedby="rate-hint"
                />
              </div>
              <span id="rate-hint" className="input-hint">
                Used to estimate invoices when you accept a job (three-hour default). Clients pay
                in Kenyan Shillings via M-Pesa.
              </span>
            </label>
          </section>

          <section className="profile-section" aria-labelledby="profile-section-services">
            <h4 id="profile-section-services" className="profile-section-title">
              Services you offer
            </h4>
            <p className="input-hint">Tap to toggle. Clients can only book services you select here.</p>
            <div className="service-chip-grid" role="group" aria-label="Services offered">
              {SERVICE_CATEGORIES.map((svc) => {
                const on = selectedServices.has(svc.id);
                return (
                  <button
                    key={svc.id}
                    type="button"
                    className={`service-chip${on ? ' service-chip--on' : ''}`}
                    aria-pressed={on}
                    onClick={() => toggleService(svc.id)}
                  >
                    <span className="service-chip-check" aria-hidden="true">
                      {on ? '✓' : ''}
                    </span>
                    {svc.label}
                  </button>
                );
              })}
            </div>
          </section>

          {message && (
            <p
              className={
                messageTone === 'success' ? 'success-text' : messageTone === 'error' ? 'error-text' : 'helper-text'
              }
              role={messageTone === 'error' ? 'alert' : 'status'}
            >
              {message}
            </p>
          )}

          <div className="profile-form-actions">
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>

        <aside className="profile-preview-aside" aria-labelledby="profile-preview-heading">
          <h4 id="profile-preview-heading" className="profile-preview-heading">
            Client preview
          </h4>
          <p className="muted profile-preview-caption">Updates as you edit — save to publish.</p>
          <div className="profile-preview-card">
            <WorkerSummary worker={previewWorker} />
          </div>
        </aside>
      </div>
    </div>
  );
};
