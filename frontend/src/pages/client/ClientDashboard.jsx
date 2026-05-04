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
import { AccountSettingsPanel, ChatWindow, LegalDocumentsPanel } from '../../components/CommonComponents.jsx';

export const ClientDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'browse';
  const [workers, setWorkers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [jobs, setJobs] = useState([]);

  const loadWorkers = useCallback(async () => {
    const allWorkers = await workerApi.listWorkers();
    if (user?.city) {
      const c = String(user.city).trim().toLowerCase();
      allWorkers.sort((a, b) => {
        const am = String(a.city || '').trim().toLowerCase() === c ? 0 : 1;
        const bm = String(b.city || '').trim().toLowerCase() === c ? 0 : 1;
        return am - bm;
      });
    }
    setWorkers(allWorkers);
  }, [user?.city]);

  const loadInvoices = useCallback(async () => {
    const inv = await clientApi.listInvoices();
    setInvoices(inv);
  }, []);

  const loadJobs = useCallback(async () => {
    const j = await clientApi.listMyJobs();
    setJobs(j);
  }, []);

  useEffect(() => {
    if (activeTab === 'browse') {
      loadWorkers();
    } else if (activeTab === 'jobs') {
      loadJobs();
    } else if (activeTab === 'invoices' || activeTab === 'payment') {
      loadInvoices();
    }
  }, [activeTab, loadWorkers, loadInvoices, loadJobs]);

  const refreshAfterBooking = useCallback(async () => {
    await Promise.all([loadWorkers(), loadJobs()]);
  }, [loadWorkers, loadJobs]);

  const refreshAfterPayment = useCallback(async () => {
    await loadInvoices();
  }, [loadInvoices]);

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
        {activeTab === 'browse' && <WorkerBrowser workers={workers} onBooked={refreshAfterBooking} />}
        {activeTab === 'jobs' && <ClientJobHistory jobs={jobs} onJobsChange={loadJobs} />}
        {activeTab === 'documents' && <LegalDocumentsPanel />}
        {activeTab === 'invoices' && <InvoiceList invoices={invoices} />}
        {activeTab === 'payment' && <PaymentPlaceholder invoices={invoices} onPaid={refreshAfterPayment} />}
        {activeTab === 'account' && <AccountSettingsPanel />}
        {activeTab === 'chat' && <ChatWindow />}
      </div>
    </section>
  );
};
