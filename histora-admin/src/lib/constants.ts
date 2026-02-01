import {
  LayoutDashboard,
  Users,
  Stethoscope,
  UserCircle,
  Wallet,
  Target,
  BarChart3,
  Settings,
  LucideIcon,
} from 'lucide-react';

// Navigation items
export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Enfermeras',
    href: '/enfermeras',
    icon: Users,
  },
  {
    title: 'Servicios',
    href: '/servicios',
    icon: Stethoscope,
  },
  {
    title: 'Pacientes',
    href: '/pacientes',
    icon: UserCircle,
  },
  {
    title: 'Finanzas',
    href: '/finanzas',
    icon: Wallet,
  },
  {
    title: 'Marketing',
    href: '/marketing',
    icon: Target,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Configuracion',
    href: '/configuracion',
    icon: Settings,
  },
];

// Service categories
export const serviceCategories = {
  injection: 'Inyectables',
  wound_care: 'Curaciones',
  catheter: 'Sondas',
  vital_signs: 'Signos vitales',
  iv_therapy: 'Terapia IV',
  blood_draw: 'Toma de muestras',
  medication: 'Medicamentos',
  elderly_care: 'Adulto mayor',
  post_surgery: 'Post-operatorio',
  other: 'Otro',
} as const;

// Service status
export const serviceStatus = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  accepted: { label: 'Aceptado', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  on_the_way: { label: 'En camino', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  arrived: { label: 'Llego', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  in_progress: { label: 'En progreso', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
} as const;

// Nurse verification status
export const verificationStatus = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  approved: { label: 'Aprobada', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
} as const;

// Payment status
export const paymentStatus = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-800' },
  refunded: { label: 'Reembolsado', color: 'bg-gray-100 text-gray-800' },
} as const;

// Lima districts (for filtering)
export const limaDistricts = [
  'San Isidro',
  'Miraflores',
  'La Molina',
  'Surco',
  'San Borja',
  'Barranco',
  'Jesus Maria',
  'Lince',
  'Magdalena',
  'Pueblo Libre',
  'San Miguel',
  'Chorrillos',
  'Ate',
  'Santa Anita',
  'La Victoria',
  'Rimac',
  'Cercado de Lima',
  'Breña',
  'Surquillo',
  'San Luis',
] as const;

// Time periods for analytics
export const timePeriods = [
  { value: '7d', label: 'Ultimos 7 dias' },
  { value: '30d', label: 'Ultimos 30 dias' },
  { value: '90d', label: 'Ultimos 90 dias' },
  { value: '1y', label: 'Ultimo año' },
] as const;

// Keyboard shortcuts
export const shortcuts = {
  commandPalette: { key: 'k', modifier: 'meta', label: '⌘K' },
  search: { key: '/', modifier: null, label: '/' },
  dashboard: { key: 'd', modifier: 'g', label: 'G D' },
  nurses: { key: 'n', modifier: 'g', label: 'G N' },
  services: { key: 's', modifier: 'g', label: 'G S' },
  toggleSidebar: { key: 'b', modifier: 'meta', label: '⌘B' },
} as const;
