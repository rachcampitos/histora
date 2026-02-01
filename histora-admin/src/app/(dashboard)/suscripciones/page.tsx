'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Percent,
  Calendar,
  Crown,
  Sparkles,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Subscription {
  _id: string;
  nurseId: string;
  nurseName: string;
  nurseAvatar?: string;
  nurseEmail: string;
  plan: 'free' | 'basic' | 'premium';
  status: 'active' | 'trial' | 'cancelled' | 'expired';
  startDate: string;
  endDate?: string;
  trialEndsAt?: string;
  amount: number;
  currency: string;
}

const planConfig = {
  free: { label: 'Gratis', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', icon: Sparkles },
  basic: { label: 'Basico', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: CreditCard },
  premium: { label: 'Premium', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: Crown },
};

const statusConfig = {
  active: { label: 'Activa', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  trial: { label: 'Prueba', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  expired: { label: 'Expirada', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
};

// Demo data
const demoSubscriptions: Subscription[] = [
  {
    _id: '1',
    nurseId: 'n1',
    nurseName: 'Maria Chavez',
    nurseEmail: 'maria@email.com',
    plan: 'premium',
    status: 'active',
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 49.90,
    currency: 'PEN',
  },
  {
    _id: '2',
    nurseId: 'n2',
    nurseName: 'Ana Lopez',
    nurseEmail: 'ana@email.com',
    plan: 'basic',
    status: 'active',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 29.90,
    currency: 'PEN',
  },
  {
    _id: '3',
    nurseId: 'n3',
    nurseName: 'Carmen Rodriguez',
    nurseEmail: 'carmen@email.com',
    plan: 'premium',
    status: 'trial',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 49.90,
    currency: 'PEN',
  },
  {
    _id: '4',
    nurseId: 'n4',
    nurseName: 'Patricia Torres',
    nurseEmail: 'patricia@email.com',
    plan: 'basic',
    status: 'cancelled',
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 29.90,
    currency: 'PEN',
  },
  {
    _id: '5',
    nurseId: 'n5',
    nurseName: 'Lucia Mendez',
    nurseEmail: 'lucia@email.com',
    plan: 'free',
    status: 'active',
    startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 0,
    currency: 'PEN',
  },
];

const demoMrrData = [
  { month: 'Jul', mrr: 890 },
  { month: 'Ago', mrr: 1250 },
  { month: 'Sep', mrr: 1680 },
  { month: 'Oct', mrr: 2100 },
  { month: 'Nov', mrr: 2450 },
  { month: 'Dic', mrr: 2890 },
  { month: 'Ene', mrr: 3200 },
];

const demoPlanDistribution = [
  { name: 'Free', value: 45, color: '#6b7280' },
  { name: 'Basic', value: 35, color: '#3b82f6' },
  { name: 'Premium', value: 20, color: '#8b5cf6' },
];

export default function SuscripcionesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  // Note: Subscriptions endpoints not yet implemented in backend
  // Using demo data for now
  const subscriptions = demoSubscriptions;
  const isLoading = false;

  const metrics = {
    mrr: 3200,
    mrrGrowth: 10.7,
    arr: 38400,
    arpu: 35.50,
    conversionRate: 45,
    churnRate: 2.3,
    activeSubscriptions: 90,
    trialSubscriptions: 15,
  };

  const filteredSubscriptions = (subscriptions || demoSubscriptions).filter((sub: Subscription) => {
    if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
    if (planFilter !== 'all' && sub.plan !== planFilter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        sub.nurseName.toLowerCase().includes(searchLower) ||
        sub.nurseEmail.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Suscripciones</h1>
        <p className="text-muted-foreground">
          Metricas de revenue y gestion de suscripciones
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {metrics?.mrr?.toLocaleString() || 0}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +{metrics?.mrrGrowth || 0}% vs mes anterior
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ARR</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {metrics?.arr?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Revenue anual recurrente</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ARPU</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {metrics?.arpu?.toFixed(2) || 0}</div>
            <p className="text-xs text-muted-foreground">Revenue por usuario</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <Percent className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.churnRate || 0}%</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingDown className="mr-1 h-3 w-3" />
              Bajo (objetivo &lt;5%)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolucion MRR</CardTitle>
            <CardDescription>Ultimos 7 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={demoMrrData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `S/${value}`} />
                  <Tooltip
                    formatter={(value) => [`S/ ${value}`, 'MRR']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="mrr"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribucion por Plan</CardTitle>
            <CardDescription>Porcentaje de usuarios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demoPlanDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {demoPlanDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Usuarios']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {demoPlanDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Suscripciones Activas</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">Planes pagos activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Periodo de Prueba</CardTitle>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.trialSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tasa de conversion: {metrics?.conversionRate || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar enfermera..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="trial">En prueba</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
            <SelectItem value="expired">Expiradas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="free">Gratis</SelectItem>
            <SelectItem value="basic">Basico</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Sin suscripciones</h3>
              <p className="text-muted-foreground">
                No hay suscripciones que coincidan con los filtros
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enfermera</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Vencimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((sub: Subscription) => {
                  const PlanIcon = planConfig[sub.plan]?.icon || CreditCard;
                  return (
                    <TableRow key={sub._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={sub.nurseAvatar} />
                            <AvatarFallback>
                              {sub.nurseName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{sub.nurseName}</p>
                            <p className="text-sm text-muted-foreground">{sub.nurseEmail}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${planConfig[sub.plan]?.color || ''}`}>
                          <PlanIcon className="h-3 w-3" />
                          {planConfig[sub.plan]?.label || sub.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[sub.status]?.color || ''}>
                          {statusConfig[sub.status]?.label || sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sub.amount > 0 ? (
                          <span className="font-medium">S/ {sub.amount.toFixed(2)}</span>
                        ) : (
                          <span className="text-muted-foreground">Gratis</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(sub.startDate), 'dd MMM yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sub.status === 'trial' && sub.trialEndsAt ? (
                          <span className="text-yellow-600">
                            Trial: {format(new Date(sub.trialEndsAt), 'dd MMM', { locale: es })}
                          </span>
                        ) : sub.endDate ? (
                          format(new Date(sub.endDate), 'dd MMM yyyy', { locale: es })
                        ) : (
                          <span className="text-green-600">Activa</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
