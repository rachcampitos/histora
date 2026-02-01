'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi, verificationsApi } from '@/lib/api';
import { verificationStatus } from '@/lib/constants';
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
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Users,
  ShieldAlert,
  Star,
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

export default function DashboardPage() {
  // Fetch dashboard stats from backend
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
  });

  // Fetch chart data
  const { data: chartData } = useQuery({
    queryKey: ['services-chart'],
    queryFn: () => dashboardApi.getServicesChart('7d'),
  });

  // Fetch pending verifications
  const { data: pendingVerifications } = useQuery({
    queryKey: ['pending-verifications-dashboard'],
    queryFn: () => verificationsApi.getPending(),
  });

  // Fetch recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => dashboardApi.getRecentActivity(10),
  });

  // Fetch alerts
  const { data: alerts } = useQuery({
    queryKey: ['panic-alerts'],
    queryFn: () => dashboardApi.getAlerts(),
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
      </div>

      {/* Metrics Grid - Row 1: Main Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Enfermeras Activas"
          value={stats?.nurses?.active || 0}
          icon={UserCheck}
          loading={statsLoading}
          subtitle={`${stats?.nurses?.verified || 0} verificadas`}
        />
        <MetricCard
          title="Servicios en Progreso"
          value={stats?.services?.inProgress || 0}
          icon={Stethoscope}
          loading={statsLoading}
          subtitle={`${stats?.services?.completedToday || 0} hoy`}
        />
        <MetricCard
          title="Alertas de Panico"
          value={stats?.safety?.activePanicAlerts || 0}
          icon={ShieldAlert}
          loading={statsLoading}
          subtitle={stats?.safety?.activePanicAlerts ? 'Requiere atencion' : 'Todo en orden'}
        />
        <MetricCard
          title="Calificacion Promedio"
          value={stats?.ratings?.averageRating?.toFixed(1) || '0.0'}
          icon={Star}
          loading={statsLoading}
          subtitle={`${stats?.ratings?.totalReviews || 0} resenas`}
        />
      </div>

      {/* Metrics Grid - Row 2: Additional Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Verificaciones Pendientes"
          value={stats?.nurses?.pendingVerification || 0}
          icon={AlertTriangle}
          loading={statsLoading}
        />
        <MetricCard
          title="Enfermeras Disponibles"
          value={stats?.nurses?.available || 0}
          icon={Users}
          loading={statsLoading}
        />
        <MetricCard
          title="Servicios Semana"
          value={stats?.services?.completedThisWeek || 0}
          icon={Activity}
          loading={statsLoading}
        />
        <MetricCard
          title="Ingresos Semana"
          value={stats?.services?.revenueThisWeek || 0}
          prefix="S/ "
          icon={TrendingUp}
          loading={statsLoading}
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendencia de Servicios (7 dias)
            </CardTitle>
            <CardDescription>
              Servicios completados por dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {chartData && chartData.length > 0 ? (
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
                      dataKey="count"
                      name="Servicios"
                      stroke="#14b8a6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorServicios)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No hay datos de servicios
                </div>
              )}
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
              <Link href="/verificaciones">
                Ver todas
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingVerifications?.slice(0, 4).map((verification: {
                id: string;
                nurseId: string;
                nurseName: string;
                nurseAvatar?: string;
                cepNumber: string;
                waitingDays: number;
              }) => (
                <div
                  key={verification.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={verification.nurseAvatar} />
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-blue-600 text-white text-sm">
                        {verification.nurseName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {verification.nurseName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        CEP: {verification.cepNumber} - {verification.waitingDays} dias esperando
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

      {/* Recent Activity and Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Actividad Reciente
              </CardTitle>
              <CardDescription>
                Ultimas 24 horas
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity?.slice(0, 5).map((activity: {
                id: string;
                type: string;
                title: string;
                description: string;
                timestamp: string;
                severity?: 'info' | 'warning' | 'critical';
              }) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 rounded-lg border p-4"
                >
                  <div
                    className={cn(
                      'h-2 w-2 mt-2 rounded-full flex-shrink-0',
                      activity.severity === 'critical'
                        ? 'bg-red-500'
                        : activity.severity === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.timestamp).toLocaleString('es-PE')}
                    </p>
                  </div>
                </div>
              ))}
              {(!recentActivity || recentActivity.length === 0) && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay actividad reciente
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Panic Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                Alertas de Panico
              </CardTitle>
              <CardDescription>
                Alertas activas que requieren atencion
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts?.slice(0, 5).map((alert: {
                id: string;
                nurseName: string;
                nurseAvatar?: string;
                level: string;
                status: string;
                message?: string;
                createdAt: string;
              }) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={alert.nurseAvatar} />
                      <AvatarFallback className="bg-red-500 text-white text-sm">
                        {alert.nurseName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{alert.nurseName}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.message || `Nivel: ${alert.level}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive">
                    {alert.status}
                  </Badge>
                </div>
              ))}
              {(!alerts || alerts.length === 0) && (
                <div className="py-8 text-center">
                  <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No hay alertas activas
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
