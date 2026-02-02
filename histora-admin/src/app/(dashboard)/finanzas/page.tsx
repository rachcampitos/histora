'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { financeApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  Percent,
  PiggyBank,
  Search,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

// Payment type matching backend response
interface Payment {
  id: string;
  reference: string;
  status: string;
  method: string;
  amount: number;
  currency: string;
  serviceFee: number;
  nurseEarnings: number;
  patient: { id: string; firstName: string; lastName: string } | null;
  nurse: { id: string; firstName: string; lastName: string; cepNumber: string } | null;
  serviceRequestId: string;
  cardBrand?: string;
  cardLast4?: string;
  createdAt: string;
  paidAt?: string;
  refundedAt?: string;
}

interface PaymentsResponse {
  data: Payment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface PaymentAnalytics {
  summary: {
    totalTransactions: number;
    totalVolume: number;
    totalFees: number;
    totalNurseEarnings: number;
    pendingPayments: number;
    pendingAmount: number;
    refundedCount: number;
    refundedAmount: number;
  };
  byMethod: { method: string; count: number; amount: number }[];
  byStatus: { status: string; count: number; amount: number }[];
  dailyVolume: { date: string; count: number; amount: number; fees: number }[];
}

// Demo data for fallback
const demoPayments: Payment[] = [
  {
    id: '1',
    reference: 'PAY-001',
    status: 'completed',
    method: 'yape',
    amount: 45,
    currency: 'PEN',
    serviceFee: 4.5,
    nurseEarnings: 40.5,
    patient: { id: 'p1', firstName: 'Juan', lastName: 'Perez' },
    nurse: { id: 'n1', firstName: 'Maria', lastName: 'Chavez', cepNumber: '108887' },
    serviceRequestId: 's1',
    createdAt: '2025-01-28T10:35:00Z',
    paidAt: '2025-01-28T10:35:00Z',
  },
  {
    id: '2',
    reference: 'PAY-002',
    status: 'completed',
    method: 'card',
    amount: 80,
    currency: 'PEN',
    serviceFee: 8,
    nurseEarnings: 72,
    patient: { id: 'p2', firstName: 'Carmen', lastName: 'Garcia' },
    nurse: { id: 'n2', firstName: 'Ana', lastName: 'Rodriguez', cepNumber: '109234' },
    serviceRequestId: 's2',
    cardBrand: 'Visa',
    cardLast4: '4242',
    createdAt: '2025-01-28T14:20:00Z',
    paidAt: '2025-01-28T14:20:00Z',
  },
  {
    id: '3',
    reference: 'PAY-003',
    status: 'pending',
    method: 'card',
    amount: 120,
    currency: 'PEN',
    serviceFee: 12,
    nurseEarnings: 108,
    patient: { id: 'p3', firstName: 'Laura', lastName: 'Mendoza' },
    nurse: { id: 'n3', firstName: 'Carmen', lastName: 'Perez', cepNumber: '107654' },
    serviceRequestId: 's3',
    createdAt: '2025-01-28T17:45:00Z',
  },
  {
    id: '4',
    reference: 'PAY-004',
    status: 'refunded',
    method: 'yape',
    amount: 45,
    currency: 'PEN',
    serviceFee: 0,
    nurseEarnings: 0,
    patient: { id: 'p4', firstName: 'Miguel', lastName: 'Torres' },
    nurse: { id: 'n1', firstName: 'Maria', lastName: 'Chavez', cepNumber: '108887' },
    serviceRequestId: 's4',
    createdAt: '2025-01-27T09:00:00Z',
    refundedAt: '2025-01-27T10:00:00Z',
  },
];

// Demo chart data (will be replaced with analytics.dailyVolume)
const demoRevenueData = [
  { date: '01 Ene', ingresos: 2450, comisiones: 245, reembolsos: 90 },
  { date: '08 Ene', ingresos: 3280, comisiones: 328, reembolsos: 45 },
  { date: '15 Ene', ingresos: 2800, comisiones: 280, reembolsos: 80 },
  { date: '22 Ene', ingresos: 4100, comisiones: 410, reembolsos: 0 },
  { date: '29 Ene', ingresos: 3840, comisiones: 384, reembolsos: 45 },
];

const demoPaymentMethodData = [
  { method: 'Yape', total: 8500, count: 156 },
  { method: 'Tarjeta', total: 6200, count: 78 },
];

export default function FinanzasPage() {
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch payments from API
  const { data: paymentsResponse, isLoading: isLoadingPayments } = useQuery<PaymentsResponse>({
    queryKey: ['admin-payments', search],
    queryFn: () => financeApi.getPayments({ search, limit: 100 }),
  });

  // Fetch analytics from API
  const { data: analytics } = useQuery<PaymentAnalytics>({
    queryKey: ['admin-payments-analytics'],
    queryFn: () => financeApi.getAnalytics(),
  });

  // Extract payments array from response, fallback to demo data
  const payments = paymentsResponse?.data || demoPayments;
  const isLoading = isLoadingPayments;

  // Calculate metrics from analytics or use demo values
  const metrics = {
    totalRevenue: analytics?.summary.totalVolume || 14700,
    revenueChange: 12.5,
    totalCommissions: analytics?.summary.totalFees || 1470,
    commissionsChange: 12.5,
    totalRefunds: analytics?.summary.refundedAmount || 260,
    refundsChange: -15.3,
    totalPayouts: analytics?.summary.totalNurseEarnings || 11760,
    pendingPayouts: analytics?.summary.pendingAmount || 2500,
    avgTransactionValue: 75,
  };

  // Filter payments (search is already applied in API call, this is for client-side filtering)
  const filteredPayments = payments;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pendiente</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Fallido</Badge>;
      case 'refunded':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Reembolsado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'refunded':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Wallet className="h-4 w-4 text-yellow-500" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'yape':
        return 'Yape';
      case 'card':
        return 'Tarjeta';
      case 'cash':
        return 'Efectivo';
      default:
        return method;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finanzas</h1>
          <p className="text-muted-foreground">
            Resumen financiero y transacciones
          </p>
        </div>
        <div className="flex gap-2">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <TabsList>
              <TabsTrigger value="7d">7 dias</TabsTrigger>
              <TabsTrigger value="30d">30 dias</TabsTrigger>
              <TabsTrigger value="90d">90 dias</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {metrics?.totalRevenue?.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +{metrics?.revenueChange}% vs periodo anterior
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comisiones (10%)
            </CardTitle>
            <Percent className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {metrics?.totalCommissions?.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +{metrics?.commissionsChange}% vs periodo anterior
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reembolsos
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">S/ {metrics?.totalRefunds?.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              {metrics?.refundsChange}% vs periodo anterior
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pagos Pendientes
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">S/ {metrics?.pendingPayouts?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Por pagar a enfermeras
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendencia de Ingresos</CardTitle>
            <CardDescription>
              Ingresos, comisiones y reembolsos en el periodo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.dailyVolume?.map(d => ({
                  date: format(new Date(d.date), 'dd MMM', { locale: es }),
                  ingresos: d.amount,
                  comisiones: d.fees,
                })) || demoRevenueData}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorComisiones" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v) => `S/${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`S/ ${value}`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="ingresos"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorIngresos)"
                    name="Ingresos"
                  />
                  <Area
                    type="monotone"
                    dataKey="comisiones"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorComisiones)"
                    name="Comisiones"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metodos de Pago</CardTitle>
            <CardDescription>
              Distribucion por metodo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.byMethod?.map(m => ({
                  method: m.method === 'yape' ? 'Yape' : m.method === 'card' ? 'Tarjeta' : 'Efectivo',
                  total: m.amount,
                  count: m.count,
                })) || demoPaymentMethodData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    type="number"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v) => `S/${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="method"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    width={60}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`S/ ${value}`, 'Total']}
                  />
                  <Bar dataKey="total" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {(analytics?.byMethod || demoPaymentMethodData).map((item) => (
                <div key={item.method} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>{item.method === 'yape' ? 'Yape' : item.method === 'card' ? 'Tarjeta' : item.method}</span>
                  </div>
                  <span className="text-muted-foreground">{item.count} transacciones</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Transacciones Recientes</CardTitle>
              <CardDescription>
                Historial de pagos, reembolsos y pagos a enfermeras
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transaccion..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Enfermera</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Comision</TableHead>
                  <TableHead>Neto Enfermera</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        <span className="text-sm font-mono">{payment.reference}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{getMethodLabel(payment.method)}</span>
                        {payment.cardLast4 && (
                          <span className="text-xs text-muted-foreground">
                            ****{payment.cardLast4}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {payment.patient ? `${payment.patient.firstName} ${payment.patient.lastName}` : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {payment.nurse ? `${payment.nurse.firstName} ${payment.nurse.lastName}` : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'font-medium',
                        payment.status === 'refunded' ? 'text-red-600' : 'text-green-600'
                      )}>
                        {payment.status === 'refunded' ? '-' : '+'}S/ {payment.amount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        S/ {payment.serviceFee}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-green-600">
                        S/ {payment.nurseEarnings}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(payment.createdAt), 'dd MMM HH:mm', { locale: es })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!filteredPayments || filteredPayments.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No se encontraron pagos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
