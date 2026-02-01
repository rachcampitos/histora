'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { dashboardApi, nursesApi, servicesApi } from '@/lib/api';
import { serviceStatus, verificationStatus } from '@/lib/constants';
import { MetricCard } from '@/components/charts/metric-card';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Demo data for the chart
const chartData = [
  { date: '01 Ene', servicios: 12, ingresos: 1450 },
  { date: '08 Ene', servicios: 19, ingresos: 2280 },
  { date: '15 Ene', servicios: 15, ingresos: 1800 },
  { date: '22 Ene', servicios: 25, ingresos: 3000 },
  { date: '29 Ene', servicios: 32, ingresos: 3840 },
  { date: '05 Feb', servicios: 28, ingresos: 3360 },
];

export default function DashboardPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard-metrics', period],
    queryFn: () => dashboardApi.getMetrics(period),
    // Use demo data for now
    placeholderData: {
      gmv: 125450,
      gmvChange: 15.2,
      totalServices: 342,
      servicesChange: 12.5,
      activeNurses: 87,
      nursesChange: 8.3,
      activePatients: 456,
      patientsChange: 18.7,
      avgRating: 4.7,
      conversionRate: 68.5,
      cancellationRate: 4.2,
    },
  });

  // Fetch pending verifications
  const { data: pendingVerifications } = useQuery({
    queryKey: ['pending-verifications'],
    queryFn: () => nursesApi.getPendingVerifications(),
    placeholderData: [
      {
        _id: '1',
        user: { firstName: 'Maria', lastName: 'Chavez', avatar: null },
        cepNumber: '108887',
        createdAt: new Date().toISOString(),
      },
      {
        _id: '2',
        user: { firstName: 'Ana', lastName: 'Rodriguez', avatar: null },
        cepNumber: '109234',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  });

  // Fetch active services
  const { data: activeServices } = useQuery({
    queryKey: ['active-services'],
    queryFn: () => servicesApi.getActive(),
    placeholderData: [
      {
        _id: '1',
        service: { name: 'Inyectable intramuscular', price: 45 },
        status: 'in_progress',
        nurse: { user: { firstName: 'Claudia', lastName: 'Torres' } },
        patient: { firstName: 'Juan', lastName: 'Perez' },
        location: { district: 'San Isidro' },
      },
      {
        _id: '2',
        service: { name: 'Curacion de herida', price: 80 },
        status: 'on_the_way',
        nurse: { user: { firstName: 'Maria', lastName: 'Lopez' } },
        patient: { firstName: 'Carmen', lastName: 'Garcia' },
        location: { district: 'Miraflores' },
      },
    ],
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de operaciones de NurseLite
          </p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <TabsList>
            <TabsTrigger value="7d">7 dias</TabsTrigger>
            <TabsTrigger value="30d">30 dias</TabsTrigger>
            <TabsTrigger value="90d">90 dias</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="GMV Total"
          value={metrics?.gmv || 0}
          change={metrics?.gmvChange}
          prefix="S/ "
          icon={DollarSign}
          loading={metricsLoading}
        />
        <MetricCard
          title="Servicios Completados"
          value={metrics?.totalServices || 0}
          change={metrics?.servicesChange}
          icon={Stethoscope}
          loading={metricsLoading}
        />
        <MetricCard
          title="Enfermeras Activas"
          value={metrics?.activeNurses || 0}
          change={metrics?.nursesChange}
          icon={UserCheck}
          loading={metricsLoading}
        />
        <MetricCard
          title="Pacientes Activos"
          value={metrics?.activePatients || 0}
          change={metrics?.patientsChange}
          icon={Users}
          loading={metricsLoading}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendencia de Servicios
            </CardTitle>
            <CardDescription>
              Servicios completados e ingresos en el periodo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorServicios" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
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
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="servicios"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorServicios)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pending Verifications */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Verificaciones Pendientes
              </CardTitle>
              <CardDescription>
                Enfermeras esperando aprobacion CEP
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/enfermeras?tab=pending">
                Ver todas
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingVerifications?.slice(0, 4).map((nurse: {
                _id: string;
                user: { firstName: string; lastName: string; avatar?: string };
                cepNumber: string;
                createdAt: string;
              }) => (
                <div
                  key={nurse._id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={nurse.user?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-blue-600 text-white text-sm">
                        {nurse.user?.firstName?.charAt(0)}
                        {nurse.user?.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {nurse.user?.firstName} {nurse.user?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        CEP: {nurse.cepNumber}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={verificationStatus.pending.color}>
                    Pendiente
                  </Badge>
                </div>
              ))}
              {(!pendingVerifications || pendingVerifications.length === 0) && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay verificaciones pendientes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Services */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Servicios en Curso
            </CardTitle>
            <CardDescription>
              Servicios activos en este momento
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/servicios?tab=active">
              Ver todos
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeServices?.slice(0, 5).map((service: {
              _id: string;
              service: { name: string; price: number };
              status: keyof typeof serviceStatus;
              nurse?: { user?: { firstName: string; lastName: string } };
              patient?: { firstName: string; lastName: string };
              location?: { district: string };
            }) => (
              <div
                key={service._id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      service.status === 'in_progress'
                        ? 'bg-green-500 animate-pulse'
                        : service.status === 'on_the_way'
                        ? 'bg-blue-500 animate-pulse'
                        : 'bg-yellow-500'
                    )}
                  />
                  <div>
                    <p className="font-medium">{service.service?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {service.nurse?.user?.firstName} {service.nurse?.user?.lastName} →{' '}
                      {service.patient?.firstName} {service.patient?.lastName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      S/ {service.service?.price}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {service.location?.district}
                    </p>
                  </div>
                  <Badge
                    className={
                      serviceStatus[service.status]?.color || 'bg-gray-100'
                    }
                  >
                    {serviceStatus[service.status]?.label || service.status}
                  </Badge>
                </div>
              </div>
            ))}
            {(!activeServices || activeServices.length === 0) && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No hay servicios activos en este momento
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
