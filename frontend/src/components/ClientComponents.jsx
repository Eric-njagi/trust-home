import React, { useEffect, useState } from 'react';
import { getServiceLabel } from '../data/mockData.js';
import { clientApi } from '../services/apiClient.js';
import { ServiceCategorySelect, WorkerSummary } from './CommonComponents.jsx';

export const WorkerBrowser = ({ workers, onBooked }) => {
  const [serviceFilter, setServiceFilter] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [bookingServiceId, setBookingServiceId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  const filteredWorkers = serviceFilter
    ? workers.filter((w) => w.services.includes(serviceFilter))
    : workers;

  useEffect(() => {
    const w = workers.find((x) => x.id === selectedWorkerId);
    if (!w) {
      setBookingServiceId('');
      return;
    }
    if (serviceFilter && w.services.includes(serviceFilter)) {
      setBookingServiceId(serviceFilter);
    } else {
      setBookingServiceId(w.services[0] || '');
    }
  }, [selectedWorkerId, serviceFilter, workers]);

  const selectedWorker = workers.find((w) => w.id === selectedWorkerId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWorkerId || !date || !time || !bookingServiceId) return;
    if (!selectedWorker?.services?.length) {
      setError('This worker has not listed any services yet.');
      return;
    }
    setBooking(true);
    setError('');
    try {
      await clientApi.createBooking({
        workerId: selectedWorkerId,
        serviceId: bookingServiceId,
        jobDate: date,
        timeWindow: time,
      });
      await onBooked?.();
      setDate('');
      setTime('');
      alert('Booking submitted. The worker will see it under My Jobs.');
    } catch (err) {
      setError(err.message || 'Booking failed.');
    } finally {
      setBooking(false);
    }
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
        {selectedWorkerId && (
          <label className="field">
            Service for this booking
            <select
              value={bookingServiceId}
              onChange={(e) => setBookingServiceId(e.target.value)}
              required
            >
              {(workers.find((w) => w.id === selectedWorkerId)?.services || []).map((sid) => (
                <option key={sid} value={sid}>
                  {getServiceLabel(sid)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label>
          Time window
          <input
            type="text"
            placeholder="e.g. 10:00 - 12:00"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button
          className="btn primary"
          type="submit"
          disabled={!selectedWorkerId || booking || !selectedWorker?.services?.length}
        >
          {booking ? 'Booking…' : 'Book worker'}
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

export const PaymentPlaceholder = ({ invoices, onPaid }) => {
  const unpaid = invoices.filter((i) => i.status === 'Unpaid');
  const [payingId, setPayingId] = useState(null);

  const payOne = async (id) => {
    setPayingId(id);
    try {
      await clientApi.payInvoice(id);
      await onPaid?.();
    } catch (err) {
      alert(err.message || 'Payment failed.');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="card payment-placeholder">
      <h3>Payment</h3>
      <p className="muted">
        Demo billing: mark an invoice as paid (no real card charges).
      </p>
      {unpaid.length === 0 && <p className="muted">No unpaid invoices.</p>}
      <ul className="invoice-list compact">
        {unpaid.map((inv) => (
          <li key={inv.id} className="invoice-item">
            <div>
              <strong>{inv.service}</strong>
              <span className="muted"> ${inv.amount.toFixed(2)}</span>
            </div>
            <button
              type="button"
              className="btn secondary small"
              disabled={payingId === inv.id}
              onClick={() => payOne(inv.id)}
            >
              {payingId === inv.id ? 'Processing…' : 'Mark paid'}
            </button>
          </li>
        ))}
      </ul>
      <form className="form compact" onSubmit={(e) => e.preventDefault()}>
        <label>
          Card number
          <input type="text" placeholder="•••• •••• •••• ••••" disabled />
        </label>
        <div className="row two-cols">
          <label>
            Expiry
            <input type="text" placeholder="MM/YY" disabled />
          </label>
          <label>
            CVC
            <input type="text" placeholder="•••" disabled />
          </label>
        </div>
      </form>
    </div>
  );
};
