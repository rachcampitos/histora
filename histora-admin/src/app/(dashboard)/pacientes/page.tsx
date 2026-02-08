'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { patientsApi } from '@/lib/api';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { toast } from 'sonner';
import {
  Calendar,
  Eye,
  Mail,
  MoreHorizontal,
  Phone,
  Search,
  ShoppingBag,
  Trash2,
  TrendingUp,
  UserCircle,
  Users,
} from 'lucide-react';

// Patient type matching backend response
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  authProvider: string;
  totalServicesRequested: number;
  totalServicesCompleted: number;
  createdAt: string;
  lastServiceAt: string | null;
}

// Demo data
const demoPatients: Patient[] = [
  {
    id: '1',
    firstName: 'Juan',
    lastName: 'Perez',
    email: 'juan.perez@email.com',
    phone: '999111222',
    isActive: true,
    isEmailVerified: true,
    authProvider: 'local',
    totalServicesRequested: 12,
    totalServicesCompleted: 10,
    createdAt: '2024-06-15T10:00:00Z',
    lastServiceAt: '2025-01-28T10:35:00Z',
  },
  {
    id: '2',
    firstName: 'Carmen',
    lastName: 'Garcia',
    email: 'carmen.garcia@email.com',
    phone: '999333444',
    isActive: true,
    isEmailVerified: true,
    authProvider: 'local',
    totalServicesRequested: 5,
    totalServicesCompleted: 5,
    createdAt: '2024-09-20T10:00:00Z',
    lastServiceAt: '2025-01-28T14:10:00Z',
  },
  {
    id: '3',
    firstName: 'Roberto',
    lastName: 'Silva',
    email: 'roberto.silva@email.com',
    phone: '999555666',
    isActive: true,
    isEmailVerified: true,
    authProvider: 'local',
    totalServicesRequested: 2,
    totalServicesCompleted: 2,
    createdAt: '2025-01-10T10:00:00Z',
    lastServiceAt: '2025-01-15T10:00:00Z',
  },
  {
    id: '4',
    firstName: 'Laura',
    lastName: 'Mendoza',
    email: 'laura.mendoza@email.com',
    phone: '999777888',
    isActive: true,
    isEmailVerified: true,
    authProvider: 'local',
    totalServicesRequested: 8,
    totalServicesCompleted: 7,
    createdAt: '2024-08-05T10:00:00Z',
    lastServiceAt: '2025-01-27T10:00:00Z',
  },
  {
    id: '5',
    firstName: 'Miguel',
    lastName: 'Torres',
    email: 'miguel.torres@email.com',
    phone: '999999000',
    isActive: false,
    isEmailVerified: true,
    authProvider: 'local',
    totalServicesRequested: 1,
    totalServicesCompleted: 1,
    createdAt: '2024-12-15T10:00:00Z',
    lastServiceAt: '2024-12-20T10:00:00Z',
  },
  {
    id: '6',
    firstName: 'Patricia',
    lastName: 'Flores',
    email: 'patricia.flores@email.com',
    phone: '999222333',
    isActive: true,
    isEmailVerified: true,
    authProvider: 'local',
    totalServicesRequested: 15,
    totalServicesCompleted: 14,
    createdAt: '2024-03-10T10:00:00Z',
    lastServiceAt: '2025-01-26T10:00:00Z',
  },
];

interface PatientsResponse {
  data: Patient[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export default function PacientesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<typeof demoPatients[0] | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Fetch patients
  const { data: patientsResponse, isLoading } = useQuery<PatientsResponse>({
    queryKey: ['patients', search],
    queryFn: () => patientsApi.getAll({ search }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (patientId: string) => patientsApi.delete(patientId),
    onSuccess: () => {
      toast.success('Paciente eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
    onError: () => {
      toast.error('Error al eliminar paciente');
    },
  });

  // Extract patients array from response, fallback to demo data
  const patients = patientsResponse?.data || demoPatients;

  // Filter patients (search is also applied in API)
  const filteredPatients = patients.filter((patient) => {
    if (!search) return true;
    return (
      patient.firstName.toLowerCase().includes(search.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(search.toLowerCase()) ||
      patient.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Calculate stats
  const stats = {
    total: patients.length,
    active: patients.filter((p) => p.isActive).length,
    totalServices: patients.reduce((sum, p) => sum + (p.totalServicesCompleted || 0), 0),
    avgServices: patients.length ? Math.round(patients.reduce((sum, p) => sum + (p.totalServicesCompleted || 0), 0) / patients.length) : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">
            Gestiona los pacientes registrados en la plataforma
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pacientes
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
              Pacientes Activos
            </CardTitle>
            <UserCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Servicios
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Promedio por Paciente
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgServices} servicios</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Lista de Pacientes</CardTitle>
              <CardDescription>
                {filteredPatients?.length || 0} pacientes encontrados
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente..."
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
                  <TableHead>Paciente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Servicios Solicitados</TableHead>
                  <TableHead>Servicios Completados</TableHead>
                  <TableHead>Ultimo Servicio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients?.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                            {patient.firstName.charAt(0)}
                            {patient.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {patient.firstName} {patient.lastName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{patient.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{patient.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{patient.totalServicesRequested}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3 text-green-500" />
                        <span className="font-medium text-green-600">{patient.totalServicesCompleted}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {patient.lastServiceAt
                          ? format(new Date(patient.lastServiceAt), 'dd MMM yyyy', { locale: es })
                          : 'Sin servicios'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={patient.isActive ? 'default' : 'secondary'}>
                        {patient.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
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
                              setSelectedPatient(patient);
                              setShowDetailDialog(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              if (confirm(`¿Eliminar a ${patient.firstName} ${patient.lastName}? Esta accion eliminara todos sus datos incluyendo imagenes.`)) {
                                deleteMutation.mutate(patient.id);
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
                ))}
                {(!filteredPatients || filteredPatients.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No se encontraron pacientes
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del Paciente</DialogTitle>
            <DialogDescription>
              Informacion completa del paciente
            </DialogDescription>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-6">
              {/* Profile header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xl">
                    {selectedPatient.firstName.charAt(0)}
                    {selectedPatient.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h3>
                  <p className="text-muted-foreground">{selectedPatient.email}</p>
                  <Badge variant={selectedPatient.isActive ? 'default' : 'secondary'}>
                    {selectedPatient.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedPatient.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Miembro desde {format(new Date(selectedPatient.createdAt), 'MMMM yyyy', { locale: es })}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">{selectedPatient.totalServicesRequested}</p>
                  <p className="text-sm text-muted-foreground">Servicios Solicitados</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedPatient.totalServicesCompleted}</p>
                  <p className="text-sm text-muted-foreground">Servicios Completados</p>
                </div>
              </div>

              {/* Last service */}
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium text-muted-foreground">Ultimo Servicio</p>
                <p className="font-medium">
                  {selectedPatient.lastServiceAt
                    ? format(new Date(selectedPatient.lastServiceAt), "dd 'de' MMMM 'de' yyyy", { locale: es })
                    : 'Sin servicios aun'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
