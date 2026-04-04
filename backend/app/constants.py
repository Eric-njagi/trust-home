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
}


ALLOWED_SERVICE_IDS: frozenset[str] = frozenset(SERVICE_LABELS.keys())


def service_label(service_id: str) -> str:
    return SERVICE_LABELS.get(service_id, service_id)
