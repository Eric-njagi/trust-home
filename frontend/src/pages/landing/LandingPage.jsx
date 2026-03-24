import React from 'react';
import { Link } from 'react-router-dom';

export const LandingPage = () => {
  return (
    <section className="page landing-page">
      <div className="hero">
        <h1>TrustHome</h1>
        <p>On-demand domestic services connecting households with trusted workers.</p>
        <div className="hero-actions">
          <Link to="/signup" className="btn primary">
            Get Started
          </Link>
          <Link to="/login" className="btn secondary">
            Log In
          </Link>
        </div>
      </div>
      <div className="hero-grid">
        <div className="hero-card">Laundry</div>
        <div className="hero-card">Cooking</div>
        <div className="hero-card">House Cleaning</div>
        <div className="hero-card">Utensils</div>
        <div className="hero-card">Dishwashing</div>
        <div className="hero-card">Nanny</div>
        <div className="hero-card">Childcare</div>
        <div className="hero-card">House Help (Monthly Tier)</div>
      </div>
    </section>
  );
};
