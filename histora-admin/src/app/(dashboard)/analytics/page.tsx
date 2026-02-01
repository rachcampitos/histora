'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Clock,
  MapPin,
  Percent,
  Star,
  Stethoscope,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

// Demo data
const servicesByCategory = [
  { name: 'Inyectables', value: 145, color: '#10b981' },
  { name: 'Curaciones', value: 89, color: '#6366f1' },
  { name: 'Adulto mayor', value: 67, color: '#f59e0b' },
  { name: 'Signos vitales', value: 45, color: '#ec4899' },
  { name: 'Terapia IV', value: 32, color: '#14b8a6' },
  { name: 'Otros', value: 28, color: '#8b5cf6' },
];

const servicesByDistrict = [
  { district: 'San Isidro', services: 78, revenue: 4680 },
  { district: 'Miraflores', services: 65, revenue: 3900 },
  { district: 'Surco', services: 52, revenue: 3120 },
  { district: 'San Borja', services: 45, revenue: 2700 },
  { district: 'La Molina', services: 38, revenue: 2280 },
  { district: 'Barranco', services: 28, revenue: 1680 },
];

const hourlyActivity = [
  { hour: '6am', services: 2 },
  { hour: '7am', services: 5 },
  { hour: '8am', services: 15 },
  { hour: '9am', services: 22 },
  { hour: '10am', services: 28 },
  { hour: '11am', services: 25 },
  { hour: '12pm', services: 18 },
  { hour: '1pm', services: 12 },
  { hour: '2pm', services: 15 },
  { hour: '3pm', services: 20 },
  { hour: '4pm', services: 22 },
  { hour: '5pm', services: 18 },
  { hour: '6pm', services: 25 },
  { hour: '7pm', services: 20 },
  { hour: '8pm', services: 12 },
  { hour: '9pm', services: 5 },
];

const conversionFunnel = [
  { stage: 'Busquedas', value: 1000 },
  { stage: 'Perfiles vistos', value: 650 },
  { stage: 'Solicitudes', value: 420 },
  { stage: 'Aceptadas', value: 380 },
  { stage: 'Completadas', value: 342 },
];

const retentionData = [
  { month: 'Mes 1', retention: 100 },
  { month: 'Mes 2', retention: 72 },
  { month: 'Mes 3', retention: 58 },
  { month: 'Mes 4', retention: 48 },
  { month: 'Mes 5', retention: 42 },
  { month: 'Mes 6', retention: 38 },
];

const nursePerformance = [
  { name: 'Maria Chavez', services: 89, rating: 4.8, revenue: 4450 },
  { name: 'Ana Rodriguez', services: 67, rating: 4.7, revenue: 3350 },
  { name: 'Carmen Perez', services: 54, rating: 4.9, revenue: 2700 },
  { name: 'Rosa Martinez', services: 48, rating: 4.6, revenue: 2400 },
  { name: 'Laura Diaz', services: 42, rating: 4.8, revenue: 2100 },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch analytics data
  const { data: metrics } = useQuery({
    queryKey: ['analytics-metrics', period],
    queryFn: () => analyticsApi.getMetrics(period),
    placeholderData: {
      conversionRate: 68.5,
      conversionChange: 5.2,
      avgResponseTime: 4.5, // minutes
      responseTimeChange: -12.3,
      repeatRate: 42,
      repeatRateChange: 8.1,
      cancellationRate: 4.2,
      cancellationChange: -2.5,
      avgRating: 4.7,
      nps: 72,
      avgServicesPerNurse: 12.5,
      peakHour: '10am',
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Metricas avanzadas y analisis de rendimiento
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

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de Conversion
            </CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.conversionRate}%</div>
            <div className={cn(
              'flex items-center text-xs',
              (metrics?.conversionChange ?? 0) > 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {(metrics?.conversionChange ?? 0) > 0 ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              {metrics?.conversionChange}% vs periodo anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tiempo de Respuesta
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgResponseTime} min</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingDown className="mr-1 h-3 w-3" />
              {Math.abs(metrics?.responseTimeChange ?? 0)}% mas rapido
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de Repeticion
            </CardTitle>
            <UserCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.repeatRate}%</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="mr-1 h-3 w-3" />
              +{metrics?.repeatRateChange}% vs periodo anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de Cancelacion
            </CardTitle>
            <Percent className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.cancellationRate}%</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingDown className="mr-1 h-3 w-3" />
              {Math.abs(metrics?.cancellationChange ?? 0)}% menos
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Services by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Servicios por Categoria
            </CardTitle>
            <CardDescription>
              Distribucion de servicios completados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="h-[200px] w-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={servicesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {servicesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {servicesByCategory.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span>{cat.name}</span>
                    </div>
                    <span className="font-medium">{cat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hourly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Actividad por Hora
            </CardTitle>
            <CardDescription>
              Hora pico: {metrics?.peakHour}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="hour"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    interval={1}
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
                  <Bar dataKey="services" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Services by District */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Servicios por Distrito
            </CardTitle>
            <CardDescription>
              Top distritos con mayor demanda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={servicesByDistrict} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    type="number"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="district"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="services" fill="#6366f1" radius={[0, 4, 4, 0]} name="Servicios" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Retention Curve */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Curva de Retencion
            </CardTitle>
            <CardDescription>
              Porcentaje de usuarios que regresan por mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={retentionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value) => [`${value}%`, 'Retencion']}
                  />
                  <Line
                    type="monotone"
                    dataKey="retention"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Funnel de Conversion
            </CardTitle>
            <CardDescription>
              De busqueda a servicio completado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversionFunnel.map((stage, index) => {
                const maxValue = conversionFunnel[0].value;
                const percentage = Math.round((stage.value / maxValue) * 100);
                const dropoff = index > 0
                  ? Math.round(((conversionFunnel[index - 1].value - stage.value) / conversionFunnel[index - 1].value) * 100)
                  : 0;

                return (
                  <div key={stage.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stage.stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{stage.value}</span>
                        {dropoff > 0 && (
                          <span className="flex items-center text-xs text-red-500">
                            <ArrowDown className="h-3 w-3" />
                            {dropoff}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-3 w-full rounded-full bg-muted">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-teal-500 to-blue-600"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Nurses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Top Enfermeras
            </CardTitle>
            <CardDescription>
              Por servicios completados en el periodo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nursePerformance.map((nurse, index) => (
                <div
                  key={nurse.name}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-muted text-muted-foreground'
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{nurse.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{nurse.services} servicios</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {nurse.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">S/ {nurse.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">ingresos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
