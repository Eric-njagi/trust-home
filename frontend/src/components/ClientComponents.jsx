import React, { useEffect, useState } from 'react';
import { getServiceLabel } from '../data/mockData.js';
import { clientApi } from '../services/apiClient.js';
import { formatKes } from '../utils/formatKes.js';
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
            placeholder="e.g. 10:00 – 14:00 (EAT)"
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
              <span className="amount">{formatKes(inv.amount)}</span>
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

function nationalDigitsForMpesa(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('254')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 9);
}

export const PaymentPlaceholder = ({ invoices, onPaid }) => {
  const unpaid = invoices.filter((i) => i.status === 'Unpaid');
  const [mpesaLocal, setMpesaLocal] = useState('');
  const [payingId, setPayingId] = useState(null);
  const [notice, setNotice] = useState('');

  const mpesaInternational = () => {
    const d = nationalDigitsForMpesa(mpesaLocal);
    if (d.length !== 9 || !'17'.includes(d[0])) return '';
    return `254${d}`;
  };

  const payOne = async (id) => {
    const phone = mpesaInternational();
    if (!phone) {
      alert('Enter a valid M-Pesa number after +254 (e.g. 712 345 678 or 112 345 678).');
      return;
    }
    setPayingId(id);
    setNotice('');
    try {
      await clientApi.payInvoice(id, { mpesaPhone: phone });
      await onPaid?.();
      setNotice(
        'Payment recorded. With Safaricom Daraja connected, an STK Push would appear on your phone to enter your M-Pesa PIN.',
      );
    } catch (err) {
      alert(err.message || 'Payment failed.');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="card payment-placeholder">
      <h3>M-Pesa</h3>
      <p className="muted">
        Pay each invoice from your M-Pesa line. Amounts are shown in Kenyan Shillings (KSh).
      </p>
      {unpaid.length === 0 && <p className="muted">No unpaid invoices.</p>}
      {unpaid.length > 0 && (
        <form className="form compact" onSubmit={(e) => e.preventDefault()}>
          <label className="field">
            M-Pesa phone number
            <div className="input-with-prefix mpesa-phone-input">
              <span className="input-prefix" aria-hidden="true">
                +254
              </span>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="712 345 678"
                value={mpesaLocal}
                onChange={(e) => setMpesaLocal(nationalDigitsForMpesa(e.target.value))}
                aria-describedby="mpesa-phone-hint"
              />
            </div>
            <span id="mpesa-phone-hint" className="input-hint">
              Use the handset that receives your M-Pesa messages. You can paste 07… or 011…;
              we store only what is needed to request payment.
            </span>
          </label>
        </form>
      )}
      {notice && (
        <p className="success-text" role="status">
          {notice}
        </p>
      )}
      <ul className="invoice-list compact">
        {unpaid.map((inv) => (
          <li key={inv.id} className="invoice-item">
            <div>
              <strong>{inv.service}</strong>
              <span className="muted"> {formatKes(inv.amount)}</span>
            </div>
            <button
              type="button"
              className="btn mpesa small"
              disabled={payingId === inv.id}
              onClick={() => payOne(inv.id)}
            >
              {payingId === inv.id ? 'Confirming…' : 'Pay with M-Pesa'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
