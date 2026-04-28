import { SERVICE_GROUPS } from './services.js';

/**
 * Full-bleed backgrounds for the landing scroll experience (hero + each service group).
 * Images are thematic stock photos; swap URLs to refresh the look.
 */
export const LANDING_BACKGROUND_BY_SECTION = {
  hero:
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=2200&q=85',
  home: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=2200&q=85',
  kitchen:
    'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=2200&q=85',
  family:
    'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=2200&q=85',
  vehicle_fabrics:
    'https://images.unsplash.com/photo-1769641156620-48f014424c4f?auto=format&fit=crop&w=2200&q=85',
  moves_decor:
    'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=2200&q=85',
  pests:
    'https://images.unsplash.com/photo-1711900176167-eedaa6e7fdae?auto=format&fit=crop&w=2200&q=85',
  outdoor:
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=2200&q=85',
  daily_extras:
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=2200&q=85',
  kenya_estate:
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=2200&q=85',
};

export const LANDING_SCROLL_SECTION_ORDER = ['hero', ...SERVICE_GROUPS.map((g) => g.id)];
