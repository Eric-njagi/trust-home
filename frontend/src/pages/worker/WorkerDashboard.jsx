import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { workerApi } from '../../services/apiClient.js';
import { WorkerAvailabilityToggle, WorkerJobList, WorkerProfilePanel } from '../../components/WorkerComponents.jsx';
import { AccountSettingsPanel, ChatWindow, LegalDocumentsPanel } from '../../components/CommonComponents.jsx';

function profileIncomplete(p) {
  if (!p || typeof p !== 'object') return false;
  const hasServices = Array.isArray(p.services) && p.services.length > 0;
  const hasCity = String(p.city || '').trim().length > 0;
  const hasRate = Number(p.hourlyRate) > 0;
  return !hasServices || !hasCity || !hasRate;
}

export const WorkerDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'jobs';
  const [jobs, setJobs] = useState([]);
  const [availability, setAvailability] = useState(true);
  /** `undefined` = loading, `null` = failed, object = loaded */
  const [workerProfile, setWorkerProfile] = useState(undefined);

  const loadJobs = useCallback(async () => {
    const data = await workerApi.getMyJobs();
    setJobs(data);
  }, []);

  const reloadProfile = useCallback(async () => {
    setWorkerProfile(undefined);
    try {
      const p = await workerApi.getMyProfile();
      setWorkerProfile(p);
      setAvailability(!!p.available);
    } catch {
      setWorkerProfile(null);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'jobs') {
      loadJobs();
    }
  }, [activeTab, loadJobs]);

  useEffect(() => {
    reloadProfile();
  }, [reloadProfile]);

  const handleToggleAvailability = async () => {
    const next = !availability;
    setAvailability(next);
    try {
      const updated = await workerApi.updateMyProfile({ available: next });
      setWorkerProfile(updated);
    } catch {
      setAvailability(!next);
    }
  };

  const handleProfileSaved = useCallback((p) => {
    setWorkerProfile(p);
    setAvailability(!!p.available);
  }, []);

  const showSetupBanner = useMemo(() => {
    return (
      workerProfile &&
      typeof workerProfile === 'object' &&
      profileIncomplete(workerProfile) &&
      activeTab !== 'profile'
    );
  }, [workerProfile, activeTab]);

  return (
    <section className="page dashboard-page">
      <header className="page-header">
        <h2>Welcome, {user?.name || 'Worker'}</h2>
        <p>Manage your profile, availability, and incoming jobs.</p>
      </header>

      {showSetupBanner && (
        <div className="profile-setup-banner" role="status">
          <div className="profile-setup-banner-text">
            <strong>Finish your public profile</strong>
            <span className="muted">
              Clients need your services, area, and hourly rate before they can book you confidently.
            </span>
          </div>
          <Link to="/worker?tab=profile" className="btn primary small profile-setup-banner-cta">
            Complete profile
          </Link>
        </div>
      )}

      <div className="dashboard-content">
        {activeTab === 'jobs' && <WorkerJobList jobs={jobs} onJobsChange={loadJobs} />}
        {activeTab === 'documents' && <LegalDocumentsPanel />}
        {activeTab === 'profile' && (
          <WorkerProfilePanel
            profile={workerProfile}
            onProfileSaved={handleProfileSaved}
            onRetry={reloadProfile}
          />
        )}
        {activeTab === 'availability' && (
          <WorkerAvailabilityToggle
            available={availability}
            onToggle={handleToggleAvailability}
          />
        )}
        {activeTab === 'account' && <AccountSettingsPanel />}
        {activeTab === 'chat' && <ChatWindow />}
      </div>
    </section>
  );
};
