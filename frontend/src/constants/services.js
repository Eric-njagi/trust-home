export const SERVICE_CATEGORIES = [
  { id: 'laundry', label: 'Laundry' },
  { id: 'cooking', label: 'Cooking' },
  { id: 'house_cleaning', label: 'House Cleaning' },
  { id: 'utensils', label: 'Utensils' },
  { id: 'dishwashing', label: 'Dishwashing' },
  { id: 'nanny', label: 'Nanny' },
  { id: 'childcare', label: 'Childcare' },
  { id: 'house_help_monthly', label: 'House Help (Monthly Tier)' },
  { id: 'gardening', label: 'Gardening' },
  { id: 'pet_care', label: 'Pet Care' },
  /* Vehicle & fabrics */
  { id: 'vehicle_cleaning', label: 'Car Cleaning & Valet' },
  { id: 'carpet_upholstery_cleaning', label: 'Carpets, Rugs & Upholstery' },
  /* Moves & décor */
  { id: 'moving_packing', label: 'Moving & Packing Help' },
  { id: 'interior_decor', label: 'Home Décor & Styling' },
  /* Pests */
  { id: 'fumigation_pest_control', label: 'Fumigation & Pest Control' },
  /* Day-to-day home support */
  { id: 'window_glass_cleaning', label: 'Windows & Glass' },
  { id: 'ironing_wardrobe', label: 'Ironing & Wardrobe Care' },
  { id: 'shopping_household_errands', label: 'Shopping & Household Errands' },
  /* Common in Kenyan apartments, estates & rooftop setups */
  { id: 'water_tank_cleaning', label: 'Water Tank & Jojo Cleaning' },
  { id: 'compound_outdoor_cleaning', label: 'Compound, Veranda & Drains' },
  { id: 'solar_panel_cleaning', label: 'Solar Panel Cleaning' },
  { id: 'shared_estate_cleaning', label: 'Shared Estate & Staircase Cleaning' },
];

/**
 * Landing layout: every id in SERVICE_CATEGORIES appears exactly once.
 * Subtitles hint at what clients book (workers tick what they actually offer).
 */
export const SERVICE_GROUPS = [
  {
    id: 'home',
    title: 'Home & laundry',
    subtitle: 'General cleaning, dishes, laundry, and kitchenware',
    ids: ['house_cleaning', 'laundry', 'utensils', 'dishwashing'],
  },
  {
    id: 'kitchen',
    title: 'Kitchen & meals',
    subtitle: 'Cooking and meal prep for your household',
    ids: ['cooking'],
  },
  {
    id: 'family',
    title: 'Family & care',
    subtitle: 'Nannies, childcare, and live-in or monthly house help',
    ids: ['nanny', 'childcare', 'house_help_monthly'],
  },
  {
    id: 'vehicle_fabrics',
    title: 'Car, carpets & upholstery',
    subtitle: 'Mobile car wash, interior valet, carpets, rugs, sofas, and curtains',
    ids: ['vehicle_cleaning', 'carpet_upholstery_cleaning'],
  },
  {
    id: 'moves_decor',
    title: 'Moves & home décor',
    subtitle: 'Packing, small moves, furniture placement, hanging art, and light styling',
    ids: ['moving_packing', 'interior_decor'],
  },
  {
    id: 'pests',
    title: 'Fumigation & pest control',
    subtitle: 'Licensed-style treatments for cockroaches, bedbugs, rodents, termites, and general spraying',
    ids: ['fumigation_pest_control'],
  },
  {
    id: 'outdoor',
    title: 'Outdoor & pets',
    subtitle: 'Gardens, balconies, and pet sitting or walks',
    ids: ['gardening', 'pet_care'],
  },
  {
    id: 'daily_extras',
    title: 'Daily home support',
    subtitle: 'Windows, ironing, and running household errands',
    ids: ['window_glass_cleaning', 'ironing_wardrobe', 'shopping_household_errands'],
  },
  {
    id: 'kenya_estate',
    title: 'Tanks, compounds & shared estates',
    subtitle:
      'Rooftop tanks, outdoor areas, solar panels, and common spaces typical of Kenyan apartments and gated communities',
    ids: [
      'water_tank_cleaning',
      'compound_outdoor_cleaning',
      'solar_panel_cleaning',
      'shared_estate_cleaning',
    ],
  },
];
