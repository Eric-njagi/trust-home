import React from 'react';
import { WorkerSummary } from './CommonComponents.jsx';
import { getServiceLabel } from '../data/mockData.js';

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
      <button className="btn primary" onClick={onToggle}>
        Toggle to {available ? 'Booked' : 'Available'}
      </button>
    </div>
  );
};

export const WorkerJobList = ({ jobs }) => {
  return (
    <div className="card job-list">
      <h3>Your jobs</h3>
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
                  <button className="btn small primary">Accept</button>
                  <button className="btn small secondary">Reject</button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const WorkerProfilePanel = () => {
  return (
    <div className="card profile-panel">
      <h3>Your profile</h3>
      <p className="muted">
        In a later step this will sync with your backend profile. For now, use this
        as a reference layout.
      </p>
      <form className="form compact">
        <label>
          Display name
          <input type="text" placeholder="e.g. Jane D." />
        </label>
        <label>
          City / Area
          <input type="text" placeholder="e.g. Springfield" />
        </label>
        <label>
          Hourly rate (USD)
          <input type="number" min="0" step="1" placeholder="e.g. 20" />
        </label>
        <label>
          Services offered
          <textarea
            rows="3"
            placeholder="Laundry, house cleaning, childcare…"
          />
        </label>
        <button type="button" className="btn secondary">
          Save (mock)
        </button>
      </form>
    </div>
  );
};
