'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { nursesApi } from '@/lib/api';
import { verificationStatus } from '@/lib/constants';
import { Nurse } from '@/types';
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
  DialogFooter,
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
  CheckCircle2,
  Clock,
  Eye,
  MoreHorizontal,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';

// Demo nurse type for placeholder data
interface DemoNurse {
  _id: string;
  userId: string;
  user: { firstName: string; lastName: string; email: string; phone?: string; avatar?: string };
  cepNumber: string;
  cepVerified: boolean;
  cepVerificationStatus: 'pending' | 'approved' | 'rejected';
  cepPhoto?: string;
  dni: string;
  specialties: string[];
  services: unknown[];
  averageRating: number;
  totalReviews: number;
  totalServices: number;
  isActive: boolean;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// Demo data
const demoNurses: DemoNurse[] = [
  {
    _id: '1',
    userId: 'u1',
    user: { firstName: 'Maria', lastName: 'Chavez Torres', email: 'maria@email.com', phone: '999888777' },
    cepNumber: '108887',
    cepVerified: true,
    cepVerificationStatus: 'approved',
    cepPhoto: '/placeholder-cep.jpg',
    dni: '44119536',
    specialties: ['Inyectables', 'Curaciones'],
    services: [],
    averageRating: 4.8,
    totalReviews: 45,
    totalServices: 89,
    isActive: true,
    isAvailable: true,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-20T10:00:00Z',
  },
  {
    _id: '2',
    userId: 'u2',
    user: { firstName: 'Ana', lastName: 'Rodriguez Lopez', email: 'ana@email.com', phone: '999777666' },
    cepNumber: '109234',
    cepVerified: false,
    cepVerificationStatus: 'pending',
    dni: '45678901',
    specialties: ['Adulto mayor'],
    services: [],
    averageRating: 0,
    totalReviews: 0,
    totalServices: 0,
    isActive: false,
    isAvailable: false,
    createdAt: '2025-01-28T10:00:00Z',
    updatedAt: '2025-01-28T10:00:00Z',
  },
  {
    _id: '3',
    userId: 'u3',
    user: { firstName: 'Carmen', lastName: 'Perez Diaz', email: 'carmen@email.com', phone: '999666555' },
    cepNumber: '107654',
    cepVerified: true,
    cepVerificationStatus: 'approved',
    dni: '43210987',
    specialties: ['Terapia IV', 'Signos vitales'],
    services: [],
    averageRating: 4.5,
    totalReviews: 23,
    totalServices: 45,
    isActive: true,
    isAvailable: false,
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-25T10:00:00Z',
  },
  {
    _id: '4',
    userId: 'u4',
    user: { firstName: 'Rosa', lastName: 'Martinez Silva', email: 'rosa@email.com', phone: '999555444' },
    cepNumber: '105432',
    cepVerified: false,
    cepVerificationStatus: 'rejected',
    dni: '42109876',
    specialties: ['Post-operatorio'],
    services: [],
    averageRating: 0,
    totalReviews: 0,
    totalServices: 0,
    isActive: false,
    isAvailable: false,
    createdAt: '2025-01-20T10:00:00Z',
    updatedAt: '2025-01-22T10:00:00Z',
  },
];

export default function EnfermerasPage() {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedNurse, setSelectedNurse] = useState<typeof demoNurses[0] | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch nurses
  const { data: nurses, isLoading } = useQuery<DemoNurse[]>({
    queryKey: ['nurses', tab, search],
    queryFn: () => nursesApi.getAll({ status: tab, search }),
    placeholderData: demoNurses,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (nurseId: string) => nursesApi.approve(nurseId),
    onSuccess: () => {
      toast.success('Enfermera aprobada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['nurses'] });
      setShowDetailDialog(false);
    },
    onError: () => {
      toast.error('Error al aprobar enfermera');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ nurseId, reason }: { nurseId: string; reason: string }) =>
      nursesApi.reject(nurseId, reason),
    onSuccess: () => {
      toast.success('Enfermera rechazada');
      queryClient.invalidateQueries({ queryKey: ['nurses'] });
      setShowDetailDialog(false);
    },
    onError: () => {
      toast.error('Error al rechazar enfermera');
    },
  });

  // Filter nurses based on tab and search
  const filteredNurses = nurses?.filter((nurse) => {
    const matchesTab =
      tab === 'all' ||
      (tab === 'pending' && nurse.cepVerificationStatus === 'pending') ||
      (tab === 'approved' && nurse.cepVerificationStatus === 'approved') ||
      (tab === 'rejected' && nurse.cepVerificationStatus === 'rejected');

    const matchesSearch =
      !search ||
      nurse.user?.firstName.toLowerCase().includes(search.toLowerCase()) ||
      nurse.user?.lastName.toLowerCase().includes(search.toLowerCase()) ||
      nurse.cepNumber.includes(search);

    return matchesTab && matchesSearch;
  });

  const stats = {
    total: nurses?.length || 0,
    pending: nurses?.filter((n) => n.cepVerificationStatus === 'pending').length || 0,
    approved: nurses?.filter((n) => n.cepVerificationStatus === 'approved').length || 0,
    rejected: nurses?.filter((n) => n.cepVerificationStatus === 'rejected').length || 0,
  };

  const openDetails = (nurse: typeof demoNurses[0]) => {
    setSelectedNurse(nurse);
    setShowDetailDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enfermeras</h1>
          <p className="text-muted-foreground">
            Gestiona las enfermeras registradas en la plataforma
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Enfermeras
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aprobadas
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rechazadas
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Lista de Enfermeras</CardTitle>
              <CardDescription>
                {filteredNurses?.length || 0} enfermeras encontradas
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o CEP..."
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
              <TabsTrigger value="all">
                Todas ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pendientes ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Aprobadas ({stats.approved})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rechazadas ({stats.rejected})
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
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
                      <TableHead>Enfermera</TableHead>
                      <TableHead>CEP</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Servicios</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNurses?.map((nurse) => (
                      <TableRow key={nurse._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={nurse.user?.avatar} />
                              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-blue-600 text-white">
                                {nurse.user?.firstName?.charAt(0)}
                                {nurse.user?.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {nurse.user?.firstName} {nurse.user?.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {nurse.user?.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-sm">{nurse.cepNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              verificationStatus[nurse.cepVerificationStatus]?.color
                            )}
                          >
                            {verificationStatus[nurse.cepVerificationStatus]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {nurse.averageRating > 0 ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{nurse.averageRating.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">
                                ({nurse.totalReviews})
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{nurse.totalServices}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(nurse.createdAt), 'dd MMM yyyy', {
                              locale: es,
                            })}
                          </span>
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
                              <DropdownMenuItem onClick={() => openDetails(nurse)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalles
                              </DropdownMenuItem>
                              {nurse.cepVerificationStatus === 'pending' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => approveMutation.mutate(nurse._id)}
                                    className="text-green-600"
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Aprobar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      rejectMutation.mutate({
                                        nurseId: nurse._id,
                                        reason: 'CEP no valido',
                                      })
                                    }
                                    className="text-red-600"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Rechazar
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!filteredNurses || filteredNurses.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No se encontraron enfermeras
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
            <DialogTitle>Detalle de Enfermera</DialogTitle>
            <DialogDescription>
              Informacion completa de la enfermera
            </DialogDescription>
          </DialogHeader>

          {selectedNurse && (
            <div className="space-y-6">
              {/* Profile header */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedNurse.user?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-teal-500 to-blue-600 text-white text-xl">
                    {selectedNurse.user?.firstName?.charAt(0)}
                    {selectedNurse.user?.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    {selectedNurse.user?.firstName} {selectedNurse.user?.lastName}
                  </h3>
                  <p className="text-muted-foreground">{selectedNurse.user?.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedNurse.user?.phone}
                  </p>
                </div>
                <Badge
                  className={cn(
                    verificationStatus[selectedNurse.cepVerificationStatus]?.color
                  )}
                >
                  {verificationStatus[selectedNurse.cepVerificationStatus]?.label}
                </Badge>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">CEP</p>
                  <p className="text-lg font-semibold">{selectedNurse.cepNumber}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">DNI</p>
                  <p className="text-lg font-semibold">{selectedNurse.dni}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-semibold">
                      {selectedNurse.averageRating.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">
                      ({selectedNurse.totalReviews} reviews)
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Servicios</p>
                  <p className="text-lg font-semibold">
                    {selectedNurse.totalServices} completados
                  </p>
                </div>
              </div>

              {/* Specialties */}
              <div>
                <p className="mb-2 text-sm font-medium">Especialidades</p>
                <div className="flex flex-wrap gap-2">
                  {selectedNurse.specialties.map((spec) => (
                    <Badge key={spec} variant="secondary">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Status info */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-3 w-3 rounded-full',
                      selectedNurse.isActive ? 'bg-green-500' : 'bg-gray-400'
                    )}
                  />
                  <span className="text-sm">
                    {selectedNurse.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-3 w-3 rounded-full',
                      selectedNurse.isAvailable ? 'bg-blue-500' : 'bg-gray-400'
                    )}
                  />
                  <span className="text-sm">
                    {selectedNurse.isAvailable ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedNurse?.cepVerificationStatus === 'pending' && (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() =>
                    rejectMutation.mutate({
                      nurseId: selectedNurse._id,
                      reason: 'CEP no valido',
                    })
                  }
                  disabled={rejectMutation.isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rechazar
                </Button>
                <Button
                  onClick={() => approveMutation.mutate(selectedNurse._id)}
                  disabled={approveMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aprobar
                </Button>
              </div>
            )}
            {selectedNurse?.cepVerificationStatus !== 'pending' && (
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
