'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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

// Transaction type
interface Transaction {
  _id: string;
  type: string;
  amount: number;
  fee: number;
  net: number;
  description: string;
  paymentMethod?: string;
  status: string;
  serviceId?: string;
  nurseId?: string;
  nurseName?: string;
  patientName?: string;
  createdAt: string;
}

// Demo data
const demoTransactions: Transaction[] = [
  {
    _id: '1',
    type: 'payment',
    amount: 45,
    fee: 4.5,
    net: 40.5,
    description: 'Pago servicio #1234',
    paymentMethod: 'yape',
    status: 'completed',
    serviceId: 's1',
    nurseId: 'n1',
    nurseName: 'Maria Chavez',
    patientName: 'Juan Perez',
    createdAt: '2025-01-28T10:35:00Z',
  },
  {
    _id: '2',
    type: 'payment',
    amount: 80,
    fee: 8,
    net: 72,
    description: 'Pago servicio #1235',
    paymentMethod: 'card',
    status: 'completed',
    serviceId: 's2',
    nurseId: 'n2',
    nurseName: 'Ana Rodriguez',
    patientName: 'Carmen Garcia',
    createdAt: '2025-01-28T14:20:00Z',
  },
  {
    _id: '3',
    type: 'payment',
    amount: 120,
    fee: 12,
    net: 108,
    description: 'Pago servicio #1236',
    paymentMethod: 'card',
    status: 'pending',
    serviceId: 's3',
    nurseId: 'n3',
    nurseName: 'Carmen Perez',
    patientName: 'Laura Mendoza',
    createdAt: '2025-01-28T17:45:00Z',
  },
  {
    _id: '4',
    type: 'refund',
    amount: -45,
    fee: 0,
    net: -45,
    description: 'Reembolso servicio #1200',
    paymentMethod: 'yape',
    status: 'completed',
    serviceId: 's4',
    nurseId: 'n1',
    nurseName: 'Maria Chavez',
    patientName: 'Miguel Torres',
    createdAt: '2025-01-27T09:00:00Z',
  },
  {
    _id: '5',
    type: 'payout',
    amount: -500,
    fee: 0,
    net: -500,
    description: 'Pago semanal a Maria Chavez',
    status: 'completed',
    nurseId: 'n1',
    nurseName: 'Maria Chavez',
    createdAt: '2025-01-26T12:00:00Z',
  },
];

const revenueData = [
  { date: '01 Ene', ingresos: 2450, comisiones: 245, reembolsos: 90 },
  { date: '08 Ene', ingresos: 3280, comisiones: 328, reembolsos: 45 },
  { date: '15 Ene', ingresos: 2800, comisiones: 280, reembolsos: 80 },
  { date: '22 Ene', ingresos: 4100, comisiones: 410, reembolsos: 0 },
  { date: '29 Ene', ingresos: 3840, comisiones: 384, reembolsos: 45 },
];

const paymentMethodData = [
  { method: 'Yape', total: 8500, count: 156 },
  { method: 'Tarjeta', total: 6200, count: 78 },
];

export default function FinanzasPage() {
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Note: Finance endpoints not yet implemented in backend
  // Using demo data for now
  const transactions = demoTransactions;
  const isLoading = false;

  const metrics = {
    totalRevenue: 14700,
    revenueChange: 12.5,
    totalCommissions: 1470,
    commissionsChange: 12.5,
    totalRefunds: 260,
    refundsChange: -15.3,
    totalPayouts: 11760,
    pendingPayouts: 2500,
    avgTransactionValue: 75,
  };

  // Filter transactions
  const filteredTransactions = transactions?.filter((tx) => {
    if (!search) return true;
    return (
      tx.description.toLowerCase().includes(search.toLowerCase()) ||
      tx.nurseName?.toLowerCase().includes(search.toLowerCase()) ||
      tx.patientName?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pendiente</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Fallido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'refund':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      case 'payout':
        return <Wallet className="h-4 w-4 text-blue-500" />;
      default:
        return <DollarSign className="h-4 w-4" />;
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
                <AreaChart data={revenueData}>
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
                <BarChart data={paymentMethodData} layout="vertical">
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
              {paymentMethodData.map((item) => (
                <div key={item.method} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>{item.method}</span>
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead>Enfermera</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Comision</TableHead>
                  <TableHead>Neto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions?.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(tx.type)}
                        <span className="capitalize text-sm">
                          {tx.type === 'payment' ? 'Pago' :
                           tx.type === 'refund' ? 'Reembolso' : 'Pago Enfermera'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{tx.description}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{tx.nurseName || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'font-medium',
                        tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {tx.amount > 0 ? '+' : ''}S/ {Math.abs(tx.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        S/ {tx.fee}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'font-medium',
                        tx.net > 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {tx.net > 0 ? '+' : ''}S/ {Math.abs(tx.net)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(tx.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(tx.createdAt), 'dd MMM HH:mm', { locale: es })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!filteredTransactions || filteredTransactions.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No se encontraron transacciones
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
