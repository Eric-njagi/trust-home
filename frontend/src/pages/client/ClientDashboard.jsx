import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { workerApi, clientApi } from '../../services/apiClient.js';
import {
  WorkerBrowser,
  InvoiceList,
  PaymentPlaceholder,
  ClientJobHistory,
} from '../../components/ClientComponents.jsx';
import { ChatWindow } from '../../components/CommonComponents.jsx';

export const ClientDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'browse';
  const [workers, setWorkers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [jobs, setJobs] = useState([]);

  const load = useCallback(async () => {
    const [allWorkers, inv, j] = await Promise.all([
      workerApi.listWorkers(),
      clientApi.listInvoices(),
      clientApi.listMyJobs(),
    ]);
    if (user?.city) {
      const c = String(user.city).trim().toLowerCase();
      allWorkers.sort((a, b) => {
        const am = String(a.city || '').trim().toLowerCase() === c ? 0 : 1;
        const bm = String(b.city || '').trim().toLowerCase() === c ? 0 : 1;
        return am - bm;
      });
    }
    setWorkers(allWorkers);
    setInvoices(inv);
    setJobs(j);
  }, [user?.city]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="page dashboard-page">
      <header className="page-header">
        <h2>Welcome, {user?.name || 'Client'}</h2>
        <p>
          Find help near your estate or neighbourhood, settle invoices with M-Pesa, and
          keep messages in one place.
        </p>
      </header>
      <div className="dashboard-content">
        {activeTab === 'browse' && <WorkerBrowser workers={workers} onBooked={load} />}
        {activeTab === 'jobs' && <ClientJobHistory jobs={jobs} />}
        {activeTab === 'invoices' && <InvoiceList invoices={invoices} />}
        {activeTab === 'payment' && <PaymentPlaceholder invoices={invoices} onPaid={load} />}
        {activeTab === 'chat' && <ChatWindow />}
      </div>
    </section>
  );
};
