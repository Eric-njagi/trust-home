import { SERVICE_GROUPS } from './services.js';

/**
 * Full-bleed backgrounds for the landing scroll experience (hero + each service group).
 * Images are thematic stock photos; swap URLs to refresh the look.
 */
export const LANDING_BACKGROUND_BY_SECTION = {
  hero:
    'https://images.unsplash.com/photo-1741991110666-88115e724741?auto=format&fit=crop&w=1920&q=85',
  home: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=1920&q=85',
  kitchen: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1920&q=85',
  family: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1920&q=85',
  vehicle_fabrics:
    'https://images.unsplash.com/photo-1520340351474-e39262d0d112?auto=format&fit=crop&w=1920&q=85',
  moves_decor:
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1920&q=85',
  pests: 'https://images.unsplash.com/photo-1630516908949-8bc994d8d48c?auto=format&fit=crop&w=1920&q=85',
  outdoor: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1920&q=85',
  daily_extras:
    'https://images.unsplash.com/photo-1584622650111-993a426f6d8a?auto=format&fit=crop&w=1920&q=85',
  kenya_estate:
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1920&q=85',
};

export const LANDING_SCROLL_SECTION_ORDER = ['hero', ...SERVICE_GROUPS.map((g) => g.id)];
