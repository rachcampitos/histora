'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { nursesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  Clock,
  Eye,
  MoreHorizontal,
  Search,
  ShieldCheck,
  ShieldX,
  Star,
  UserCheck,
  UserX,
  Users,
  XCircle,
  MapPin,
  Loader2,
  Power,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';

// Types matching backend response
interface NurseUser {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
}

interface NurseLocation {
  address?: string;
  district?: string;
  city?: string;
}

interface AdminNurse {
  id: string;
  userId: string;
  cepNumber: string;
  cepVerified: boolean;
  cepVerifiedAt?: string;
  verificationStatus: 'pending' | 'under_review' | 'approved' | 'rejected';
  specialties: string[];
  bio?: string;
  yearsOfExperience?: number;
  serviceRadius?: number;
  isAvailable: boolean;
  isActive: boolean;
  averageRating: number;
  totalReviews: number;
  totalServicesCompleted: number;
  user: NurseUser | null;
  location: NurseLocation | null;
  createdAt: string;
  updatedAt: string;
}

interface NursesResponse {
  data: AdminNurse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const verificationStatusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
  under_review: { label: 'En revision', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Eye },
  approved: { label: 'Verificada', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: ShieldCheck },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: ShieldX },
};

export default function EnfermerasPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedNurse, setSelectedNurse] = useState<AdminNurse | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch nurses from API
  const { data: nursesResponse, isLoading, error } = useQuery<NursesResponse>({
    queryKey: ['nurses', verificationFilter, statusFilter, search, page],
    queryFn: () => nursesApi.getAll({
      page,
      limit,
      verificationStatus: verificationFilter !== 'all' ? verificationFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: search || undefined,
    }),
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (nurseId: string) => nursesApi.toggleStatus(nurseId),
    onSuccess: (data) => {
      toast.success(data.isActive ? 'Enfermera activada' : 'Enfermera desactivada');
      queryClient.invalidateQueries({ queryKey: ['nurses'] });
    },
    onError: () => {
      toast.error('Error al cambiar estado');
    },
  });

  // Toggle availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: (nurseId: string) => nursesApi.toggleAvailability(nurseId),
    onSuccess: (data) => {
      toast.success(data.isAvailable ? 'Disponibilidad activada' : 'Disponibilidad desactivada');
      queryClient.invalidateQueries({ queryKey: ['nurses'] });
    },
    onError: () => {
      toast.error('Error al cambiar disponibilidad');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (nurseId: string) => nursesApi.delete(nurseId),
    onSuccess: () => {
      toast.success('Enfermera eliminada');
      queryClient.invalidateQueries({ queryKey: ['nurses'] });
    },
    onError: () => {
      toast.error('Error al eliminar enfermera');
    },
  });

  const nurses = nursesResponse?.data || [];
  const pagination = nursesResponse?.pagination;

  // Calculate stats
  const stats = {
    total: pagination?.total || 0,
    active: nurses.filter(n => n.isActive).length,
    verified: nurses.filter(n => n.verificationStatus === 'approved').length,
    pending: nurses.filter(n => n.verificationStatus === 'pending').length,
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <XCircle className="h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-lg font-semibold">Error al cargar enfermeras</h3>
        <p className="text-muted-foreground">
          No se pudo conectar con el servidor. Verifica tu conexion.
        </p>
        <Button
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['nurses'] })}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Enfermeras</h1>
        <p className="text-muted-foreground">
          Gestiona las enfermeras registradas en la plataforma
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Verificadas</CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o CEP..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={verificationFilter}
          onValueChange={(v) => {
            setVerificationFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Verificacion" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="under_review">En revision</SelectItem>
            <SelectItem value="approved">Verificadas</SelectItem>
            <SelectItem value="rejected">Rechazadas</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="inactive">Inactivas</SelectItem>
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
          ) : nurses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Sin enfermeras</h3>
              <p className="text-muted-foreground">
                No hay enfermeras que coincidan con los filtros
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enfermera</TableHead>
                  <TableHead>CEP</TableHead>
                  <TableHead>Verificacion</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Servicios</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Distrito</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nurses.map((nurse) => {
                  const StatusIcon = verificationStatusConfig[nurse.verificationStatus]?.icon || Clock;
                  return (
                    <TableRow key={nurse.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={nurse.user?.avatar} />
                            <AvatarFallback>
                              {nurse.user?.firstName?.[0]}{nurse.user?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {nurse.user?.firstName} {nurse.user?.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {nurse.user?.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{nurse.cepNumber}</TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${verificationStatusConfig[nurse.verificationStatus]?.color || ''}`}>
                          <StatusIcon className="h-3 w-3" />
                          {verificationStatusConfig[nurse.verificationStatus]?.label || nurse.verificationStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {nurse.averageRating > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{nurse.averageRating.toFixed(1)}</span>
                            <span className="text-muted-foreground text-xs">
                              ({nurse.totalReviews})
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sin reviews</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{nurse.totalServicesCompleted}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={nurse.isActive ? 'default' : 'secondary'}
                            className={nurse.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                          >
                            {nurse.isActive ? 'Activa' : 'Inactiva'}
                          </Badge>
                          {nurse.isActive && (
                            <span className={`text-xs ${nurse.isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                              {nurse.isAvailable ? 'Disponible' : 'No disponible'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {nurse.location?.district ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {nurse.location.district}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedNurse(nurse)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => toggleStatusMutation.mutate(nurse.id)}
                              disabled={toggleStatusMutation.isPending}
                            >
                              <Power className="mr-2 h-4 w-4" />
                              {nurse.isActive ? 'Desactivar' : 'Activar'}
                            </DropdownMenuItem>
                            {nurse.isActive && (
                              <DropdownMenuItem
                                onClick={() => toggleAvailabilityMutation.mutate(nurse.id)}
                                disabled={toggleAvailabilityMutation.isPending}
                              >
                                {nurse.isAvailable ? (
                                  <>
                                    <ToggleRight className="mr-2 h-4 w-4" />
                                    Marcar no disponible
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft className="mr-2 h-4 w-4" />
                                    Marcar disponible
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                if (confirm(`¿Eliminar a ${nurse.user?.firstName} ${nurse.user?.lastName}?`)) {
                                  deleteMutation.mutate(nurse.id);
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Mostrando {((page - 1) * limit) + 1} - {Math.min(page * limit, pagination.total)} de {pagination.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedNurse} onOpenChange={() => setSelectedNurse(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Enfermera</DialogTitle>
            <DialogDescription>
              Informacion completa del perfil
            </DialogDescription>
          </DialogHeader>
          {selectedNurse && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedNurse.user?.avatar} />
                  <AvatarFallback className="text-lg">
                    {selectedNurse.user?.firstName?.[0]}{selectedNurse.user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedNurse.user?.firstName} {selectedNurse.user?.lastName}
                  </h3>
                  <p className="text-muted-foreground">{selectedNurse.user?.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedNurse.user?.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">CEP</p>
                  <p className="font-mono font-medium">{selectedNurse.cepNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado Verificacion</p>
                  <Badge className={verificationStatusConfig[selectedNurse.verificationStatus]?.color}>
                    {verificationStatusConfig[selectedNurse.verificationStatus]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">
                      {selectedNurse.averageRating > 0 ? selectedNurse.averageRating.toFixed(1) : 'N/A'}
                    </span>
                    <span className="text-muted-foreground">
                      ({selectedNurse.totalReviews} reviews)
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Servicios Completados</p>
                  <p className="font-medium">{selectedNurse.totalServicesCompleted}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Experiencia</p>
                  <p className="font-medium">
                    {selectedNurse.yearsOfExperience ? `${selectedNurse.yearsOfExperience} años` : 'No especificado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Radio de Servicio</p>
                  <p className="font-medium">
                    {selectedNurse.serviceRadius ? `${selectedNurse.serviceRadius} km` : 'No especificado'}
                  </p>
                </div>
              </div>

              {selectedNurse.specialties?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Especialidades</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedNurse.specialties.map((spec, i) => (
                      <Badge key={i} variant="outline">{spec}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedNurse.bio && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bio</p>
                  <p className="text-sm">{selectedNurse.bio}</p>
                </div>
              )}

              {selectedNurse.location && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ubicacion</p>
                  <p className="text-sm">
                    {[selectedNurse.location.address, selectedNurse.location.district, selectedNurse.location.city]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant={selectedNurse.isActive ? 'destructive' : 'default'}
                  onClick={() => {
                    toggleStatusMutation.mutate(selectedNurse.id);
                    setSelectedNurse(null);
                  }}
                  disabled={toggleStatusMutation.isPending}
                >
                  {toggleStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedNurse.isActive ? 'Desactivar' : 'Activar'}
                </Button>
                <Button variant="outline" onClick={() => setSelectedNurse(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
