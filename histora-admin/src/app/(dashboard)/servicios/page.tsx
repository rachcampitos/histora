'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { servicesApi } from '@/lib/api';
import { serviceStatus, serviceCategories } from '@/lib/constants';
import { ServiceRequestStatus } from '@/types';
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
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Eye,
  MapPin,
  MoreHorizontal,
  Search,
  Stethoscope,
  Trash2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// Service type matching backend response
interface ServiceItem {
  id: string;
  status: ServiceRequestStatus;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  service: { name: string; category: string; price: number; currency: string };
  patient: { id: string; firstName: string; lastName: string; avatar?: string } | null;
  nurse: { id: string; firstName: string; lastName: string; cepNumber: string; avatar?: string } | null;
  location: { district: string; city: string; address: string };
  requestedDate: string;
  requestedTimeSlot: 'morning' | 'afternoon' | 'evening' | 'asap';
  rating?: number;
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

interface ServicesResponse {
  data: ServiceItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Demo data for fallback
const demoServices: ServiceItem[] = [
  {
    id: '1',
    status: 'completed' as ServiceRequestStatus,
    paymentStatus: 'paid',
    service: { name: 'Inyectable intramuscular', category: 'injection', price: 45, currency: 'PEN' },
    patient: { id: 'p1', firstName: 'Juan', lastName: 'Perez' },
    nurse: { id: 'n1', firstName: 'Maria', lastName: 'Chavez', cepNumber: '108887' },
    location: { address: 'Av. Javier Prado 123', district: 'San Isidro', city: 'Lima' },
    requestedDate: '2025-01-28',
    requestedTimeSlot: 'morning',
    rating: 5,
    createdAt: '2025-01-27T15:00:00Z',
    completedAt: '2025-01-28T10:35:00Z',
  },
  {
    id: '2',
    status: 'in_progress' as ServiceRequestStatus,
    paymentStatus: 'pending',
    service: { name: 'Curacion de herida', category: 'wound_care', price: 80, currency: 'PEN' },
    patient: { id: 'p2', firstName: 'Carmen', lastName: 'Garcia' },
    nurse: { id: 'n2', firstName: 'Ana', lastName: 'Rodriguez', cepNumber: '109234' },
    location: { address: 'Calle Los Olivos 456', district: 'Miraflores', city: 'Lima' },
    requestedDate: '2025-01-28',
    requestedTimeSlot: 'afternoon',
    createdAt: '2025-01-28T12:00:00Z',
  },
  {
    id: '3',
    status: 'pending' as ServiceRequestStatus,
    paymentStatus: 'pending',
    service: { name: 'Control de signos vitales', category: 'vital_signs', price: 35, currency: 'PEN' },
    patient: { id: 'p3', firstName: 'Roberto', lastName: 'Silva' },
    nurse: null,
    location: { address: 'Jr. Union 789', district: 'La Molina', city: 'Lima' },
    requestedDate: '2025-01-29',
    requestedTimeSlot: 'asap',
    createdAt: '2025-01-28T16:00:00Z',
  },
  {
    id: '4',
    status: 'on_the_way' as ServiceRequestStatus,
    paymentStatus: 'paid',
    service: { name: 'Terapia IV', category: 'iv_therapy', price: 120, currency: 'PEN' },
    patient: { id: 'p4', firstName: 'Laura', lastName: 'Mendoza' },
    nurse: { id: 'n3', firstName: 'Carmen', lastName: 'Perez', cepNumber: '107654' },
    location: { address: 'Av. Arequipa 1234', district: 'San Borja', city: 'Lima' },
    requestedDate: '2025-01-28',
    requestedTimeSlot: 'evening',
    createdAt: '2025-01-28T14:00:00Z',
  },
  {
    id: '5',
    status: 'cancelled' as ServiceRequestStatus,
    paymentStatus: 'refunded',
    service: { name: 'Cuidado adulto mayor', category: 'elderly_care', price: 150, currency: 'PEN' },
    patient: { id: 'p5', firstName: 'Miguel', lastName: 'Torres' },
    nurse: null,
    location: { address: 'Calle Las Flores 567', district: 'Surco', city: 'Lima' },
    requestedDate: '2025-01-27',
    requestedTimeSlot: 'morning',
    createdAt: '2025-01-26T20:00:00Z',
    cancelledAt: '2025-01-27T08:00:00Z',
  },
];

const timeSlotLabels = {
  morning: 'Mañana (8am-12pm)',
  afternoon: 'Tarde (12pm-6pm)',
  evening: 'Noche (6pm-10pm)',
  asap: 'Lo antes posible',
};

// Orphaned service type
interface OrphanedServiceItem {
  id: string;
  status: ServiceRequestStatus;
  service: { name: string; category: string; price: number };
  patient: { firstName: string; lastName: string } | null;
  nurseId: string;
  nurseName: string;
  location: { district: string; city: string };
  createdAt: string;
}

interface OrphanedServicesResponse {
  count: number;
  data: OrphanedServiceItem[];
}

export default function ServiciosPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedOrphaned, setSelectedOrphaned] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch services from API
  const { data: servicesResponse, isLoading } = useQuery<ServicesResponse>({
    queryKey: ['admin-services', search],
    queryFn: () => servicesApi.getAll({ search, limit: 100 }),
  });

  // Fetch orphaned services
  const { data: orphanedResponse, isLoading: isLoadingOrphaned } = useQuery<OrphanedServicesResponse>({
    queryKey: ['admin-services-orphaned'],
    queryFn: () => servicesApi.getOrphaned(),
  });

  // Delete orphaned services mutation
  const deleteOrphanedMutation = useMutation({
    mutationFn: (ids: string[]) => servicesApi.deleteOrphaned(ids),
    onSuccess: (data) => {
      toast.success(`${data.deletedCount} servicios huerfanos eliminados`);
      queryClient.invalidateQueries({ queryKey: ['admin-services-orphaned'] });
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      setSelectedOrphaned([]);
      setShowDeleteConfirm(false);
    },
    onError: () => {
      toast.error('Error al eliminar servicios huerfanos');
    },
  });

  // Delete all orphaned services mutation
  const deleteAllOrphanedMutation = useMutation({
    mutationFn: () => servicesApi.deleteAllOrphaned(),
    onSuccess: (data) => {
      toast.success(`${data.deletedCount} servicios huerfanos eliminados`);
      queryClient.invalidateQueries({ queryKey: ['admin-services-orphaned'] });
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      setShowDeleteConfirm(false);
    },
    onError: () => {
      toast.error('Error al eliminar servicios huerfanos');
    },
  });

  const orphanedServices = orphanedResponse?.data || [];
  const orphanedCount = orphanedResponse?.count || 0;

  // Extract services array from response, fallback to demo data
  const services = servicesResponse?.data || demoServices;

  // Filter services by tab (search is already applied in API call)
  const filteredServices = services?.filter((service) => {
    const matchesTab =
      tab === 'all' ||
      (tab === 'active' && ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(service.status)) ||
      (tab === 'completed' && service.status === 'completed') ||
      (tab === 'cancelled' && ['cancelled', 'rejected'].includes(service.status));

    return matchesTab;
  });

  const stats = {
    total: services?.length || 0,
    active: services?.filter((s) => ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress'].includes(s.status)).length || 0,
    completed: services?.filter((s) => s.status === 'completed').length || 0,
    cancelled: services?.filter((s) => ['cancelled', 'rejected'].includes(s.status)).length || 0,
    gmv: services?.filter((s) => s.status === 'completed').reduce((sum, s) => sum + s.service.price, 0) || 0,
    orphaned: orphanedCount,
  };

  const toggleOrphanedSelection = (id: string) => {
    setSelectedOrphaned(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAllOrphaned = () => {
    if (selectedOrphaned.length === orphanedServices.length) {
      setSelectedOrphaned([]);
    } else {
      setSelectedOrphaned(orphanedServices.map(s => s.id));
    }
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
        {stats.orphaned > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Huerfanos
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.orphaned}</div>
              <p className="text-xs text-orange-600 dark:text-orange-400">Enfermera eliminada</p>
            </CardContent>
          </Card>
        )}
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
              {stats.orphaned > 0 && (
                <TabsTrigger value="orphaned" className="text-orange-600">
                  Huerfanos ({stats.orphaned})
                </TabsTrigger>
              )}
            </TabsList>

            {/* Orphaned Services Tab */}
            {tab === 'orphaned' ? (
              <div className="mt-4">
                {/* Warning Banner */}
                <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-orange-800 dark:text-orange-200">Servicios Huerfanos</h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Estos servicios fueron creados por enfermeras que ya han sido eliminadas del sistema.
                        Puedes eliminarlos de forma segura para limpiar la base de datos.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {orphanedServices.length > 0 && (
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedOrphaned.length === orphanedServices.length}
                        onChange={toggleAllOrphaned}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-muted-foreground">
                        {selectedOrphaned.length > 0
                          ? `${selectedOrphaned.length} seleccionados`
                          : 'Seleccionar todos'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {selectedOrphaned.length > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={deleteOrphanedMutation.isPending}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar seleccionados ({selectedOrphaned.length})
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrphaned(orphanedServices.map(s => s.id));
                          setShowDeleteConfirm(true);
                        }}
                        disabled={deleteAllOrphanedMutation.isPending}
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar todos ({orphanedCount})
                      </Button>
                    </div>
                  </div>
                )}

                {/* Orphaned Services Table */}
                {isLoadingOrphaned ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Enfermera (eliminada)</TableHead>
                        <TableHead>Ubicacion</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orphanedServices.map((service) => (
                        <TableRow key={service.id} className="bg-orange-50/50 dark:bg-orange-950/20">
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedOrphaned.includes(service.id)}
                              onChange={() => toggleOrphanedSelection(service.id)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{service.service.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {serviceCategories[service.service.category as keyof typeof serviceCategories]}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {service.patient?.firstName} {service.patient?.lastName}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-orange-300 text-orange-600">
                                <XCircle className="mr-1 h-3 w-3" />
                                Eliminada
                              </Badge>
                              <span className="text-xs text-muted-foreground truncate max-w-32">
                                {service.nurseName}
                              </span>
                            </div>
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
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">
                                {format(new Date(service.createdAt), 'dd MMM', { locale: es })}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {orphanedServices.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <CheckCircle2 className="h-8 w-8 text-green-500" />
                              <p className="text-muted-foreground">No hay servicios huerfanos</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            ) : (
              /* Regular Services Table */
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
                        <TableRow key={service.id}>
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
                                <AvatarImage src={service.patient?.avatar} />
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
                                  <AvatarImage src={service.nurse.avatar} />
                                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-blue-600 text-white text-xs">
                                    {service.nurse.firstName?.charAt(0)}
                                    {service.nurse.lastName?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">
                                  {service.nurse.firstName} {service.nurse.lastName}
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
            )}
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
                      <AvatarImage src={selectedService.patient?.avatar} />
                      <AvatarFallback>
                        {selectedService.patient?.firstName?.charAt(0)}
                        {selectedService.patient?.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedService.patient?.firstName} {selectedService.patient?.lastName}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Enfermera</p>
                  {selectedService.nurse ? (
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={selectedService.nurse.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-blue-600 text-white">
                          {selectedService.nurse.firstName?.charAt(0)}
                          {selectedService.nurse.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {selectedService.nurse.firstName} {selectedService.nurse.lastName}
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

              {/* Rating */}
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
                </div>
              )}

              {/* Cancelled status */}
              {selectedService.status === 'cancelled' && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Servicio cancelado
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {selectedService.cancelledAt
                      ? format(new Date(selectedService.cancelledAt), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })
                      : 'Fecha no disponible'}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirmar eliminacion
            </DialogTitle>
            <DialogDescription>
              Esta accion no se puede deshacer. Se eliminaran permanentemente{' '}
              <strong>{selectedOrphaned.length}</strong> servicios huerfanos de la base de datos.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950">
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Los servicios huerfanos son aquellos cuya enfermera fue eliminada del sistema.
              Eliminarlos no afectara a los pacientes ni a otras estadisticas.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleteOrphanedMutation.isPending || deleteAllOrphanedMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedOrphaned.length === orphanedServices.length) {
                  deleteAllOrphanedMutation.mutate();
                } else {
                  deleteOrphanedMutation.mutate(selectedOrphaned);
                }
              }}
              disabled={deleteOrphanedMutation.isPending || deleteAllOrphanedMutation.isPending}
            >
              {(deleteOrphanedMutation.isPending || deleteAllOrphanedMutation.isPending) ? (
                <>Eliminando...</>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar {selectedOrphaned.length} servicios
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
