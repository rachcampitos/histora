'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { servicesApi } from '@/lib/api';
import { serviceStatus, serviceCategories } from '@/lib/constants';
import { ServiceRequest, ServiceRequestStatus } from '@/types';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  MapPin,
  MoreHorizontal,
  Search,
  Stethoscope,
  XCircle,
} from 'lucide-react';

// Service demo type
interface DemoService {
  _id: string;
  patientId: string;
  patient?: { firstName: string; lastName: string; email: string; phone: string };
  nurseId?: string;
  nurse?: { user?: { firstName: string; lastName: string; avatar: string | null }; cepNumber: string };
  service: { name: string; category: string; price: number; currency: string; durationMinutes: number };
  status: ServiceRequestStatus;
  location: { address: string; district: string; city: string; reference?: string };
  requestedDate: string;
  requestedTimeSlot: 'morning' | 'afternoon' | 'evening' | 'asap';
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  rating?: number;
  review?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentMethod?: 'card' | 'yape';
  createdAt: string;
  updatedAt: string;
}

// Demo data
const demoServices: DemoService[] = [
  {
    _id: '1',
    patientId: 'p1',
    patient: { firstName: 'Juan', lastName: 'Perez', email: 'juan@email.com', phone: '999111222' },
    nurseId: 'n1',
    nurse: { user: { firstName: 'Maria', lastName: 'Chavez', avatar: null }, cepNumber: '108887' },
    service: { name: 'Inyectable intramuscular', category: 'injection', price: 45, currency: 'PEN', durationMinutes: 30 },
    status: 'completed' as ServiceRequestStatus,
    location: { address: 'Av. Javier Prado 123', district: 'San Isidro', city: 'Lima', reference: 'Edificio azul' },
    requestedDate: '2025-01-28',
    requestedTimeSlot: 'morning' as const,
    scheduledAt: '2025-01-28T10:00:00Z',
    startedAt: '2025-01-28T10:05:00Z',
    completedAt: '2025-01-28T10:35:00Z',
    rating: 5,
    review: 'Excelente servicio, muy profesional',
    paymentStatus: 'paid' as const,
    paymentMethod: 'yape' as const,
    createdAt: '2025-01-27T15:00:00Z',
    updatedAt: '2025-01-28T10:35:00Z',
  },
  {
    _id: '2',
    patientId: 'p2',
    patient: { firstName: 'Carmen', lastName: 'Garcia', email: 'carmen@email.com', phone: '999333444' },
    nurseId: 'n2',
    nurse: { user: { firstName: 'Ana', lastName: 'Rodriguez', avatar: null }, cepNumber: '109234' },
    service: { name: 'Curacion de herida', category: 'wound_care', price: 80, currency: 'PEN', durationMinutes: 45 },
    status: 'in_progress' as ServiceRequestStatus,
    location: { address: 'Calle Los Olivos 456', district: 'Miraflores', city: 'Lima' },
    requestedDate: '2025-01-28',
    requestedTimeSlot: 'afternoon' as const,
    scheduledAt: '2025-01-28T14:00:00Z',
    startedAt: '2025-01-28T14:10:00Z',
    paymentStatus: 'pending' as const,
    createdAt: '2025-01-28T12:00:00Z',
    updatedAt: '2025-01-28T14:10:00Z',
  },
  {
    _id: '3',
    patientId: 'p3',
    patient: { firstName: 'Roberto', lastName: 'Silva', email: 'roberto@email.com', phone: '999555666' },
    service: { name: 'Control de signos vitales', category: 'vital_signs', price: 35, currency: 'PEN', durationMinutes: 20 },
    status: 'pending' as ServiceRequestStatus,
    location: { address: 'Jr. Union 789', district: 'La Molina', city: 'Lima' },
    requestedDate: '2025-01-29',
    requestedTimeSlot: 'asap' as const,
    paymentStatus: 'pending' as const,
    createdAt: '2025-01-28T16:00:00Z',
    updatedAt: '2025-01-28T16:00:00Z',
  },
  {
    _id: '4',
    patientId: 'p4',
    patient: { firstName: 'Laura', lastName: 'Mendoza', email: 'laura@email.com', phone: '999777888' },
    nurseId: 'n3',
    nurse: { user: { firstName: 'Carmen', lastName: 'Perez', avatar: null }, cepNumber: '107654' },
    service: { name: 'Terapia IV', category: 'iv_therapy', price: 120, currency: 'PEN', durationMinutes: 60 },
    status: 'on_the_way' as ServiceRequestStatus,
    location: { address: 'Av. Arequipa 1234', district: 'San Borja', city: 'Lima' },
    requestedDate: '2025-01-28',
    requestedTimeSlot: 'evening' as const,
    scheduledAt: '2025-01-28T18:00:00Z',
    paymentStatus: 'paid' as const,
    paymentMethod: 'card' as const,
    createdAt: '2025-01-28T14:00:00Z',
    updatedAt: '2025-01-28T17:30:00Z',
  },
  {
    _id: '5',
    patientId: 'p5',
    patient: { firstName: 'Miguel', lastName: 'Torres', email: 'miguel@email.com', phone: '999999000' },
    service: { name: 'Cuidado adulto mayor', category: 'elderly_care', price: 150, currency: 'PEN', durationMinutes: 180 },
    status: 'cancelled' as ServiceRequestStatus,
    location: { address: 'Calle Las Flores 567', district: 'Surco', city: 'Lima' },
    requestedDate: '2025-01-27',
    requestedTimeSlot: 'morning' as const,
    cancelledAt: '2025-01-27T08:00:00Z',
    cancelReason: 'Paciente cancelo por emergencia',
    paymentStatus: 'refunded' as const,
    createdAt: '2025-01-26T20:00:00Z',
    updatedAt: '2025-01-27T08:00:00Z',
  },
];

const timeSlotLabels = {
  morning: 'Mañana (8am-12pm)',
  afternoon: 'Tarde (12pm-6pm)',
  evening: 'Noche (6pm-10pm)',
  asap: 'Lo antes posible',
};

export default function ServiciosPage() {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState<typeof demoServices[0] | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Fetch services
  const { data: services, isLoading } = useQuery<DemoService[]>({
    queryKey: ['services', tab, search],
    queryFn: () => servicesApi.getAll({ status: tab, search }),
    placeholderData: demoServices,
  });

  // Filter services
  const filteredServices = services?.filter((service) => {
    const matchesTab =
      tab === 'all' ||
      (tab === 'active' && ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(service.status)) ||
      (tab === 'completed' && service.status === 'completed') ||
      (tab === 'cancelled' && ['cancelled', 'rejected'].includes(service.status));

    const matchesSearch =
      !search ||
      service.patient?.firstName.toLowerCase().includes(search.toLowerCase()) ||
      service.patient?.lastName.toLowerCase().includes(search.toLowerCase()) ||
      service.service.name.toLowerCase().includes(search.toLowerCase()) ||
      service.location.district.toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const stats = {
    total: services?.length || 0,
    active: services?.filter((s) => ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(s.status)).length || 0,
    completed: services?.filter((s) => s.status === 'completed').length || 0,
    cancelled: services?.filter((s) => ['cancelled', 'rejected'].includes(s.status)).length || 0,
    gmv: services?.filter((s) => s.status === 'completed').reduce((sum, s) => sum + s.service.price, 0) || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Servicios</h1>
          <p className="text-muted-foreground">
            Gestiona las solicitudes de servicio en la plataforma
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Servicios
            </CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Curso
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completados
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              GMV (Completados)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {stats.gmv.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Lista de Servicios</CardTitle>
              <CardDescription>
                {filteredServices?.length || 0} servicios encontrados
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar servicio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">Todos ({stats.total})</TabsTrigger>
              <TabsTrigger value="active">En Curso ({stats.active})</TabsTrigger>
              <TabsTrigger value="completed">Completados ({stats.completed})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelados ({stats.cancelled})</TabsTrigger>
            </TabsList>

            <div className="mt-4 overflow-x-auto">
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
                      <TableHead>Servicio</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Enfermera</TableHead>
                      <TableHead>Ubicacion</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices?.map((service) => (
                      <TableRow key={service._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{service.service.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {serviceCategories[service.service.category as keyof typeof serviceCategories]}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {service.patient?.firstName?.charAt(0)}
                                {service.patient?.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {service.patient?.firstName} {service.patient?.lastName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {service.nurse ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={service.nurse.user?.avatar || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-blue-600 text-white text-xs">
                                  {service.nurse.user?.firstName?.charAt(0)}
                                  {service.nurse.user?.lastName?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {service.nurse.user?.firstName} {service.nurse.user?.lastName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sin asignar</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{service.location.district}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(serviceStatus[service.status]?.color)}>
                            {serviceStatus[service.status]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">S/ {service.service.price}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {format(new Date(service.createdAt), 'dd MMM', { locale: es })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedService(service);
                                  setShowDetailDialog(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalles
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!filteredServices || filteredServices.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No se encontraron servicios
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del Servicio</DialogTitle>
            <DialogDescription>
              Informacion completa de la solicitud
            </DialogDescription>
          </DialogHeader>

          {selectedService && (
            <div className="space-y-6">
              {/* Service header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedService.service.name}</h3>
                  <p className="text-muted-foreground">
                    {serviceCategories[selectedService.service.category as keyof typeof serviceCategories]}
                  </p>
                </div>
                <Badge className={cn(serviceStatus[selectedService.status]?.color, 'text-sm')}>
                  {serviceStatus[selectedService.status]?.label}
                </Badge>
              </div>

              {/* Participants */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Paciente</p>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {selectedService.patient?.firstName?.charAt(0)}
                        {selectedService.patient?.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedService.patient?.firstName} {selectedService.patient?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedService.patient?.phone}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Enfermera</p>
                  {selectedService.nurse ? (
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={selectedService.nurse.user?.avatar || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-blue-600 text-white">
                          {selectedService.nurse.user?.firstName?.charAt(0)}
                          {selectedService.nurse.user?.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {selectedService.nurse.user?.firstName} {selectedService.nurse.user?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          CEP: {selectedService.nurse.cepNumber}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Sin asignar</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="rounded-lg border p-4">
                <p className="mb-2 text-sm font-medium text-muted-foreground">Ubicacion</p>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{selectedService.location.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedService.location.district}, {selectedService.location.city}
                    </p>
                    {selectedService.location.reference && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Ref: {selectedService.location.reference}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Horario Solicitado</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {timeSlotLabels[selectedService.requestedTimeSlot]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedService.requestedDate), 'dd MMMM yyyy', { locale: es })}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Precio</p>
                  <p className="text-2xl font-bold">S/ {selectedService.service.price}</p>
                  <Badge variant={selectedService.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                    {selectedService.paymentStatus === 'paid' ? 'Pagado' :
                     selectedService.paymentStatus === 'refunded' ? 'Reembolsado' : 'Pendiente'}
                  </Badge>
                </div>
              </div>

              {/* Rating & Review */}
              {selectedService.rating && (
                <div className="rounded-lg border p-4">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Calificacion</p>
                  <div className="flex items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          'text-xl',
                          i < selectedService.rating! ? 'text-yellow-400' : 'text-gray-300'
                        )}
                      >
                        ★
                      </span>
                    ))}
                    <span className="ml-2 text-lg font-semibold">{selectedService.rating}/5</span>
                  </div>
                  {selectedService.review && (
                    <p className="mt-2 text-sm italic text-muted-foreground">
                      "{selectedService.review}"
                    </p>
                  )}
                </div>
              )}

              {/* Cancel reason */}
              {selectedService.cancelReason && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Motivo de cancelacion
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {selectedService.cancelReason}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
