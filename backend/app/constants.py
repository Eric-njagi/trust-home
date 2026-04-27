"""Service category ids aligned with frontend `constants/services.js`."""

SERVICE_LABELS: dict[str, str] = {
    "laundry": "Laundry",
    "cooking": "Cooking",
    "house_cleaning": "House Cleaning",
    "utensils": "Utensils",
    "dishwashing": "Dishwashing",
    "nanny": "Nanny",
    "childcare": "Childcare",
    "house_help_monthly": "House Help (Monthly Tier)",
    "gardening": "Gardening",
    "pet_care": "Pet Care",
    "vehicle_cleaning": "Car Cleaning & Valet",
    "carpet_upholstery_cleaning": "Carpets, Rugs & Upholstery",
    "moving_packing": "Moving & Packing Help",
    "interior_decor": "Home Décor & Styling",
    "fumigation_pest_control": "Fumigation & Pest Control",
    "window_glass_cleaning": "Windows & Glass",
    "ironing_wardrobe": "Ironing & Wardrobe Care",
    "shopping_household_errands": "Shopping & Household Errands",
    "water_tank_cleaning": "Water Tank & Jojo Cleaning",
    "compound_outdoor_cleaning": "Compound, Veranda & Drains",
    "solar_panel_cleaning": "Solar Panel Cleaning",
    "shared_estate_cleaning": "Shared Estate & Staircase Cleaning",
}


ALLOWED_SERVICE_IDS: frozenset[str] = frozenset(SERVICE_LABELS.keys())


def service_label(service_id: str) -> str:
    return SERVICE_LABELS.get(service_id, service_id)
