import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SERVICE_CATEGORIES, SERVICE_GROUPS } from '../../constants/services.js';
import {
  LANDING_BACKGROUND_BY_SECTION,
  LANDING_SCROLL_SECTION_ORDER,
} from '../../constants/landingBackgrounds.js';
import { useLandingScrollBackground } from '../../hooks/useLandingScrollBackground.js';

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
  vehicle_cleaning: '🚗',
  carpet_upholstery_cleaning: '🛋️',
  moving_packing: '📦',
  interior_decor: '🖼️',
  fumigation_pest_control: '🐜',
  window_glass_cleaning: '🪟',
  ironing_wardrobe: '👔',
  shopping_household_errands: '🛒',
  water_tank_cleaning: '💧',
  compound_outdoor_cleaning: '🏡',
  solar_panel_cleaning: '☀️',
  shared_estate_cleaning: '🏢',
};

const HERO_POINTS = [
  'Vetted workers',
  'Same-day & planned visits',
  'Pay with M-Pesa',
  'Ratings you can rely on',
];

const categoryById = Object.fromEntries(SERVICE_CATEGORIES.map((c) => [c.id, c]));

export const LandingPage = () => {
  const navigate = useNavigate();
  const activeSectionId = useLandingScrollBackground('hero');

  const handleServiceSelect = (serviceId) => {
    sessionStorage.setItem('selectedService', serviceId);
    navigate('/login');
  };

  return (
    <div className="landing-page-shell">
      <div className="landing-bg-stack" aria-hidden="true">
        {LANDING_SCROLL_SECTION_ORDER.map((id) => (
          <div
            key={id}
            className={`landing-bg-slide ${activeSectionId === id ? 'is-active' : ''}`}
            style={{
              backgroundImage: `linear-gradient(rgba(22, 28, 36, 0.48), rgba(22, 28, 36, 0.55)), url(${LANDING_BACKGROUND_BY_SECTION[id]})`,
            }}
          />
        ))}
      </div>

      <div className="page landing-page landing-page--scroll-bg">
        <section
          className="landing-scroll-section landing-scroll-section--hero"
          data-landing-bg="hero"
          aria-label="TrustHome introduction"
        >
          <div className="landing-hero-row">
            <div className="hero hero--bleed">
              <div className="hero-col hero-col--lead">
                <p className="hero-eyebrow">Kenya · Domestic services</p>
                <h1 className="hero-title">
                  <span className="hero-title-brand">TrustHome</span>
                </h1>
                <p className="hero-subtitle">Trusted household help for urban Kenya.</p>
              </div>
              <div className="hero-col hero-col--detail">
                <p className="hero-description">
                  TrustHome links homes and busy schedules in Kenya&apos;s urban centres — from
                  Nairobi and Mombasa to Kisumu and Nakuru — with vetted domestic workers you can
                  book for cooking, cleaning, childcare, and more. Built for apartments, gated
                  communities, and estates where trust and punctuality matter.
                </p>
                <ul className="hero-features hero-features--even" aria-label="Why TrustHome">
                  {HERO_POINTS.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
                <p className="hero-cta">Browse by category below, then pick a service to continue</p>
              </div>
            </div>
          </div>
        </section>

        <div className="services-showcase services-showcase--stacked">
          {SERVICE_GROUPS.map((group) => (
            <section
              key={group.id}
              className="landing-scroll-section"
              data-landing-bg={group.id}
              aria-labelledby={`group-title-${group.id}`}
            >
              <article className="service-group-section">
                <header className="service-group-header">
                  <div className="service-group-header-text">
                    <h2 id={`group-title-${group.id}`} className="service-group-title">
                      {group.title}
                    </h2>
                    <p className="service-group-subtitle">{group.subtitle}</p>
                  </div>
                </header>
                <div className="service-group-grid">
                  {group.ids.map((id) => {
                    const svc = categoryById[id];
                    if (!svc) return null;
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        className="service-tile"
                        onClick={() => handleServiceSelect(svc.id)}
                      >
                        <span className="service-tile-icon" aria-hidden="true">
                          {SERVICE_ICONS[svc.id] || '✨'}
                        </span>
                        <span className="service-tile-label">{svc.label}</span>
                        <span className="service-tile-hint">Tap to book</span>
                      </button>
                    );
                  })}
                </div>
              </article>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
