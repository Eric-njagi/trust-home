import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { NavBar, TaskBar } from './components/CommonComponents.jsx';
import {
  LandingPage,
  LoginPage,
  SignupPage,
  WorkerDashboard,
  ClientDashboard,
  NotFoundPage,
} from './pages/index.js';

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'worker' ? '/worker' : '/client'} replace />;
  }

  return children;
}

const App = () => {
  return (
    <div className="app-root">
      <NavBar />
      <TaskBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/worker"
            element={
              <ProtectedRoute role="worker">
                <WorkerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client"
            element={
              <ProtectedRoute role="client">
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
