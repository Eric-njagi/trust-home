import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { workerApi, clientApi } from '../../services/apiClient.js';
import { WorkerBrowser, InvoiceList, PaymentPlaceholder } from '../../components/ClientComponents.jsx';
import { ChatWindow } from '../../components/CommonComponents.jsx';

export const ClientDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'browse';
  const [workers, setWorkers] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    async function load() {
      const [w, inv] = await Promise.all([
        workerApi.listWorkers(),
        clientApi.listInvoices(),
      ]);
      setWorkers(w);
      setInvoices(inv);
    }
    load();
  }, []);

  return (
    <section className="page dashboard-page">
      <header className="page-header">
        <h2>Welcome, {user?.name || 'Client'}</h2>
        <p>Browse and book workers, manage your invoices, and stay in touch.</p>
      </header>
      <div className="dashboard-content">
        {activeTab === 'browse' && <WorkerBrowser workers={workers} />}
        {activeTab === 'invoices' && <InvoiceList invoices={invoices} />}
        {activeTab === 'payment' && <PaymentPlaceholder />}
        {activeTab === 'chat' && <ChatWindow initialMessagesRole="client" />}
      </div>
    </section>
  );
};
