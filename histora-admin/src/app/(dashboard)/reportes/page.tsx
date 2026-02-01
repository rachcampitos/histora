'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Stethoscope,
  MapPin,
  Star,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Demo data
const demoServicesData = [
  { date: 'Lun', completed: 45, cancelled: 5 },
  { date: 'Mar', completed: 52, cancelled: 8 },
  { date: 'Mie', completed: 48, cancelled: 3 },
  { date: 'Jue', completed: 61, cancelled: 7 },
  { date: 'Vie', completed: 55, cancelled: 4 },
  { date: 'Sab', completed: 38, cancelled: 6 },
  { date: 'Dom', completed: 25, cancelled: 2 },
];

const demoRegionData = [
  { region: 'San Isidro', services: 120, revenue: 4800, nurses: 25 },
  { region: 'Miraflores', services: 95, revenue: 3800, nurses: 20 },
  { region: 'La Molina', services: 85, revenue: 3400, nurses: 18 },
  { region: 'Surco', services: 75, revenue: 3000, nurses: 15 },
  { region: 'San Borja', services: 65, revenue: 2600, nurses: 12 },
];

const demoServiceCategories = [
  { name: 'Inyectables', value: 35, color: '#3b82f6' },
  { name: 'Curaciones', value: 25, color: '#10b981' },
  { name: 'Cuidado adulto mayor', value: 20, color: '#8b5cf6' },
  { name: 'Signos vitales', value: 12, color: '#f59e0b' },
  { name: 'Otros', value: 8, color: '#6b7280' },
];

const demoTopNurses = [
  { id: '1', name: 'Maria Chavez', avatar: '', rating: 4.9, services: 45, revenue: 2250 },
  { id: '2', name: 'Ana Lopez', avatar: '', rating: 4.8, services: 42, revenue: 2100 },
  { id: '3', name: 'Carmen Rodriguez', avatar: '', rating: 4.8, services: 38, revenue: 1900 },
  { id: '4', name: 'Patricia Torres', avatar: '', rating: 4.7, services: 35, revenue: 1750 },
  { id: '5', name: 'Lucia Mendez', avatar: '', rating: 4.7, services: 32, revenue: 1600 },
];

export default function ReportesPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState('overview');

  // Note: Reports endpoints not yet implemented in backend
  // Using demo data for now
  const metrics = {
    totalServices: 1245,
    servicesGrowth: 12.5,
    totalRevenue: 49800,
    revenueGrowth: 8.3,
    totalUsers: 890,
    usersGrowth: 15.2,
    averageRating: 4.7,
    completionRate: 94.5,
  };

  const servicesData = demoServicesData;
  const regionData = demoRegionData;
  const categoryData = demoServiceCategories;
  const topNurses = demoTopNurses;

  const handleExport = (type: 'pdf' | 'excel') => {
    // In a real app, this would trigger a download
    console.log(`Exporting ${type} report for period ${period}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes</h1>
          <p className="text-muted-foreground">
            Analiticas y metricas del negocio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Ultimos 7 dias</SelectItem>
              <SelectItem value="30d">Ultimos 30 dias</SelectItem>
              <SelectItem value="90d">Ultimos 90 dias</SelectItem>
              <SelectItem value="1y">Ultimo año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Servicios</CardTitle>
            <Stethoscope className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalServices?.toLocaleString()}</div>
            <div className={`flex items-center text-xs ${(metrics?.servicesGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(metrics?.servicesGrowth || 0) >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              {metrics?.servicesGrowth}% vs periodo anterior
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {metrics?.totalRevenue?.toLocaleString()}</div>
            <div className={`flex items-center text-xs ${(metrics?.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(metrics?.revenueGrowth || 0) >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              {metrics?.revenueGrowth}% vs periodo anterior
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers?.toLocaleString()}</div>
            <div className={`flex items-center text-xs ${(metrics?.usersGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(metrics?.usersGrowth || 0) >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3" />
              )}
              {metrics?.usersGrowth}% vs periodo anterior
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Satisfaccion</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.averageRating}/5.0</div>
            <p className="text-xs text-muted-foreground">
              Tasa de completado: {metrics?.completionRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="regional" className="gap-2">
            <MapPin className="h-4 w-4" />
            Regional
          </TabsTrigger>
          <TabsTrigger value="nurses" className="gap-2">
            <Users className="h-4 w-4" />
            Enfermeras
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Servicios por Dia</CardTitle>
                <CardDescription>Completados vs Cancelados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={servicesData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        name="Completados"
                        stackId="1"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="cancelled"
                        name="Cancelados"
                        stackId="1"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Por Categoria</CardTitle>
                <CardDescription>Distribucion de servicios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(categoryData || demoServiceCategories).map((entry: { color: string }, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Servicios']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {(categoryData || demoServiceCategories).map((item: { name: string; value: number; color: string }) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Regional Tab */}
        <TabsContent value="regional" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Servicios por Distrito</CardTitle>
                <CardDescription>Top 5 distritos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="region" type="category" className="text-xs" width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="services" name="Servicios" fill="hsl(var(--primary))" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalle por Region</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Distrito</TableHead>
                      <TableHead className="text-right">Servicios</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Enfermeras</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(regionData || demoRegionData).map((region: { region: string; services: number; revenue: number; nurses: number }) => (
                      <TableRow key={region.region}>
                        <TableCell className="font-medium">{region.region}</TableCell>
                        <TableCell className="text-right">{region.services}</TableCell>
                        <TableCell className="text-right">S/ {region.revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{region.nurses}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Nurses Tab */}
        <TabsContent value="nurses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Enfermeras</CardTitle>
              <CardDescription>Por servicios completados en el periodo</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Enfermera</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                    <TableHead className="text-right">Servicios</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(topNurses || demoTopNurses).map((nurse: { id: string; name: string; avatar?: string; rating: number; services: number; revenue: number }, index: number) => (
                    <TableRow key={nurse.id}>
                      <TableCell>
                        <Badge variant={index < 3 ? 'default' : 'secondary'}>
                          {index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={nurse.avatar} />
                            <AvatarFallback>
                              {nurse.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{nurse.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{nurse.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{nurse.services}</TableCell>
                      <TableCell className="text-right font-medium">
                        S/ {nurse.revenue.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
