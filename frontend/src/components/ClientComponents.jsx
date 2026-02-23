import React, { useState } from 'react';
import { ServiceCategorySelect, WorkerSummary } from './CommonComponents.jsx';

export const WorkerBrowser = ({ workers }) => {
  const [serviceFilter, setServiceFilter] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const filteredWorkers = serviceFilter
    ? workers.filter((w) => w.services.includes(serviceFilter))
    : workers;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedWorkerId || !date || !time) return;
    alert(`Mock booking submitted for worker ${selectedWorkerId} on ${date} at ${time}`);
  };

  return (
    <div className="card worker-browser">
      <h3>Browse &amp; book workers</h3>
      <ServiceCategorySelect value={serviceFilter} onChange={setServiceFilter} />
      <div className="worker-list">
        {filteredWorkers.map((w) => (
          <label key={w.id} className="worker-card">
            <input
              type="radio"
              name="worker"
              value={w.id}
              checked={selectedWorkerId === w.id}
              onChange={() => setSelectedWorkerId(w.id)}
            />
            <WorkerSummary worker={w} />
          </label>
        ))}
        {filteredWorkers.length === 0 && <p className="muted">No workers found.</p>}
      </div>
      <form className="form compact" onSubmit={handleSubmit}>
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          Time window
          <input
            type="text"
            placeholder="e.g. 10:00 - 12:00"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
        <button className="btn primary" type="submit" disabled={!selectedWorkerId}>
          Book worker (mock)
        </button>
      </form>
    </div>
  );
};

export const InvoiceList = ({ invoices }) => {
  return (
    <div className="card invoice-list">
      <h3>Your invoices</h3>
      {invoices.length === 0 && <p className="muted">No invoices yet.</p>}
      <ul>
        {invoices.map((inv) => (
          <li key={inv.id} className="invoice-item">
            <div>
              <h4>{inv.service}</h4>
              <p className="muted">
                {inv.workerName} • {inv.date}
              </p>
            </div>
            <div className="invoice-meta">
              <span className="amount">${inv.amount.toFixed(2)}</span>
              <span className={`status badge ${inv.status.toLowerCase()}`}>
                {inv.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const PaymentPlaceholder = () => {
  return (
    <div className="card payment-placeholder">
      <h3>Payment</h3>
      <p className="muted">
        This is a placeholder for future payment gateway integration (Stripe, etc.).
      </p>
      <form className="form compact">
        <label>
          Card number
          <input type="text" placeholder="•••• •••• •••• ••••" />
        </label>
        <div className="row two-cols">
          <label>
            Expiry
            <input type="text" placeholder="MM/YY" />
          </label>
          <label>
            CVC
            <input type="text" placeholder="•••" />
          </label>
        </div>
        <button type="button" className="btn secondary">
          Pay (mock)
        </button>
      </form>
    </div>
  );
};
