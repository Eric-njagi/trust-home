import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { workerApi } from '../../services/apiClient.js';
import { WorkerAvailabilityToggle, WorkerJobList, WorkerProfilePanel } from '../../components/WorkerComponents.jsx';
import { ChatWindow } from '../../components/CommonComponents.jsx';

export const WorkerDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [availability, setAvailability] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      // For now, map user.id to first worker.
      const workerId = 'w1';
      const data = await workerApi.getWorkerJobs(workerId);
      setJobs(data);
    }
    loadJobs();
  }, []);

  const handleToggleAvailability = () => {
    setAvailability((prev) => !prev);
  };

  return (
    <section className="page dashboard-page">
      <header className="page-header">
        <h2>Welcome, {user?.name || 'Worker'}</h2>
        <p>Manage your profile, availability, and incoming jobs.</p>
      </header>
      <div className="dashboard-grid">
        <div className="dashboard-column">
          <WorkerProfilePanel />
          <WorkerAvailabilityToggle
            available={availability}
            onToggle={handleToggleAvailability}
          />
          <WorkerJobList jobs={jobs} />
        </div>
        <div className="dashboard-column">
          <ChatWindow initialMessagesRole="worker" />
        </div>
      </div>
    </section>
  );
};
