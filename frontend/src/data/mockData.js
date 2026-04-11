import { SERVICE_CATEGORIES } from '../constants/services.js';

export const mockWorkers = [
  {
    id: 'w1',
    name: 'Alice N.',
    rating: 4.8,
    services: ['house_cleaning', 'laundry', 'vehicle_cleaning', 'window_glass_cleaning'],
    hourlyRate: 450,
    city: 'Kilimani, Nairobi',
    available: true,
  },
  {
    id: 'w2',
    name: 'Brian K.',
    rating: 4.6,
    services: ['cooking', 'dishwashing', 'shopping_household_errands'],
    hourlyRate: 500,
    city: 'Nyali, Mombasa',
    available: false,
  },
  {
    id: 'w3',
    name: 'Carla D.',
    rating: 4.9,
    services: ['childcare', 'house_help_monthly', 'carpet_upholstery_cleaning', 'fumigation_pest_control'],
    hourlyRate: 550,
    city: 'Milimani, Kisumu',
    available: true,
  },
];

export const mockJobs = [
  {
    id: 'j1',
    workerId: 'w1',
    clientName: 'John Kamau',
    service: 'house_cleaning',
    date: '2026-02-03',
    time: '10:00 - 12:00',
    status: 'pending',
  },
  {
    id: 'j2',
    workerId: 'w1',
    clientName: 'Mary Wanjiku',
    service: 'laundry',
    date: '2026-02-04',
    time: '14:00 - 16:00',
    status: 'accepted',
  },
];

export const mockInvoices = [
  {
    id: 'inv1',
    clientName: 'John Kamau',
    workerName: 'Alice N.',
    service: 'House Cleaning',
    amount: 4500,
    date: '2026-01-30',
    status: 'Paid',
  },
  {
    id: 'inv2',
    clientName: 'Mary Wanjiku',
    workerName: 'Brian K.',
    service: 'Cooking',
    amount: 6000,
    date: '2026-01-28',
    status: 'Unpaid',
  },
];

export const mockMessages = [
  {
    id: 'm1',
    from: 'client',
    text: 'Hi, just confirming you can arrive at 10am?',
    timestamp: '10:05',
  },
  {
    id: 'm2',
    from: 'worker',
    text: 'Yes, I will be there on time.',
    timestamp: '10:06',
  },
];

export const getServiceLabel = (id) => {
  const svc = SERVICE_CATEGORIES.find((s) => s.id === id);
  return svc ? svc.label : id;
};
