import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVICE_CATEGORIES } from '../../constants/services.js';

const SERVICE_ICONS = {
  laundry: '🧺',
  cooking: '🍳',
  house_cleaning: '🧹',
  utensils: '🍴',
  dishwashing: '🍽️',
  nanny: '👶',
  childcare: '🧒',
  house_help_monthly: '🏠',
  gardening: '🌱',
  pet_care: '🐾',
};

export const LandingPage = () => {
  const navigate = useNavigate();

  const handleServiceSelect = (serviceId) => {
    sessionStorage.setItem('selectedService', serviceId);
    navigate('/login');
  };

  return (
    <section className="page landing-page">
      <div className="hero">
        <h1 className="hero-title">TrustHome</h1>
        <p className="hero-subtitle">Your home, in trusted hands.</p>
        <p className="hero-description">
          TrustHome connects households with verified, reliable domestic workers.
          From daily cooking and cleaning to childcare, gardening, and beyond —
          book the help you need, when you need it.
        </p>
        <div className="hero-features">
          <span className="hero-feature">✅ Verified Workers</span>
          <span className="hero-feature">📅 Flexible Booking</span>
          <span className="hero-feature">💳 Secure Payments</span>
          <span className="hero-feature">⭐ Rated & Reviewed</span>
        </div>
        <p className="hero-cta">👇 Select a service to get started</p>
      </div>
      <div className="hero-grid">
        {SERVICE_CATEGORIES.map((svc) => (
          <button
            key={svc.id}
            className="hero-card service-card"
            onClick={() => handleServiceSelect(svc.id)}
          >
            <span className="service-icon">{SERVICE_ICONS[svc.id] || '🔧'}</span>
            <span className="service-label">{svc.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
};
