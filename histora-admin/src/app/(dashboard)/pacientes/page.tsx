'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import {
  Calendar,
  DollarSign,
  Eye,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Search,
  ShoppingBag,
  TrendingUp,
  UserCircle,
  Users,
} from 'lucide-react';

// Patient type
interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  district: string;
  totalServices: number;
  totalSpent: number;
  lastServiceDate: string;
  createdAt: string;
  isActive: boolean;
}

// Demo data
const demoPatients: Patient[] = [
  {
    _id: '1',
    firstName: 'Juan',
    lastName: 'Perez',
    email: 'juan.perez@email.com',
    phone: '999111222',
    district: 'San Isidro',
    totalServices: 12,
    totalSpent: 540,
    lastServiceDate: '2025-01-28T10:35:00Z',
    createdAt: '2024-06-15T10:00:00Z',
    isActive: true,
  },
  {
    _id: '2',
    firstName: 'Carmen',
    lastName: 'Garcia',
    email: 'carmen.garcia@email.com',
    phone: '999333444',
    district: 'Miraflores',
    totalServices: 5,
    totalSpent: 280,
    lastServiceDate: '2025-01-28T14:10:00Z',
    createdAt: '2024-09-20T10:00:00Z',
    isActive: true,
  },
  {
    _id: '3',
    firstName: 'Roberto',
    lastName: 'Silva',
    email: 'roberto.silva@email.com',
    phone: '999555666',
    district: 'La Molina',
    totalServices: 2,
    totalSpent: 90,
    lastServiceDate: '2025-01-15T10:00:00Z',
    createdAt: '2025-01-10T10:00:00Z',
    isActive: true,
  },
  {
    _id: '4',
    firstName: 'Laura',
    lastName: 'Mendoza',
    email: 'laura.mendoza@email.com',
    phone: '999777888',
    district: 'San Borja',
    totalServices: 8,
    totalSpent: 720,
    lastServiceDate: '2025-01-27T10:00:00Z',
    createdAt: '2024-08-05T10:00:00Z',
    isActive: true,
  },
  {
    _id: '5',
    firstName: 'Miguel',
    lastName: 'Torres',
    email: 'miguel.torres@email.com',
    phone: '999999000',
    district: 'Surco',
    totalServices: 1,
    totalSpent: 45,
    lastServiceDate: '2024-12-20T10:00:00Z',
    createdAt: '2024-12-15T10:00:00Z',
    isActive: false,
  },
  {
    _id: '6',
    firstName: 'Patricia',
    lastName: 'Flores',
    email: 'patricia.flores@email.com',
    phone: '999222333',
    district: 'Jesus Maria',
    totalServices: 15,
    totalSpent: 1250,
    lastServiceDate: '2025-01-26T10:00:00Z',
    createdAt: '2024-03-10T10:00:00Z',
    isActive: true,
  },
];

export default function PacientesPage() {
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<typeof demoPatients[0] | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Fetch patients
  const { data: patients, isLoading } = useQuery<Patient[]>({
    queryKey: ['patients', search],
    queryFn: () => patientsApi.getAll({ search }),
    placeholderData: demoPatients,
  });

  // Filter patients
  const filteredPatients = patients?.filter((patient) => {
    if (!search) return true;
    return (
      patient.firstName.toLowerCase().includes(search.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(search.toLowerCase()) ||
      patient.email.toLowerCase().includes(search.toLowerCase()) ||
      patient.district.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Calculate stats
  const stats = {
    total: patients?.length || 0,
    active: patients?.filter((p) => p.isActive).length || 0,
    totalRevenue: patients?.reduce((sum, p) => sum + p.totalSpent, 0) || 0,
    avgSpent: patients?.length ? Math.round((patients?.reduce((sum, p) => sum + p.totalSpent, 0) || 0) / patients.length) : 0,
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
              Ingresos Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket Promedio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {stats.avgSpent}</div>
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
                  <TableHead>Distrito</TableHead>
                  <TableHead>Servicios</TableHead>
                  <TableHead>Total Gastado</TableHead>
                  <TableHead>Ultimo Servicio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients?.map((patient) => (
                  <TableRow key={patient._id}>
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
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{patient.district}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{patient.totalServices}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">S/ {patient.totalSpent.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(patient.lastServiceDate), 'dd MMM yyyy', { locale: es })}
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {(!filteredPatients || filteredPatients.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
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
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedPatient.district}, Lima</span>
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
                  <p className="text-2xl font-bold">{selectedPatient.totalServices}</p>
                  <p className="text-sm text-muted-foreground">Servicios</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">S/ {selectedPatient.totalSpent}</p>
                  <p className="text-sm text-muted-foreground">Total Gastado</p>
                </div>
              </div>

              {/* Last service */}
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium text-muted-foreground">Ultimo Servicio</p>
                <p className="font-medium">
                  {format(new Date(selectedPatient.lastServiceDate), "dd 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
