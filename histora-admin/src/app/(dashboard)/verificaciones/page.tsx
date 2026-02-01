'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { verificationsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Search,
  ShieldCheck,
  ShieldX,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Verification {
  _id: string;
  nurseId: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  cepNumber: string;
  dni: string;
  cepData?: {
    fullName: string;
    photoUrl: string;
    isHabil: boolean;
  };
  documents: {
    type: string;
    url: string;
  }[];
  attemptNumber: number;
  reviewNotes?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
  nurse?: {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
  under_review: { label: 'En revision', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Eye },
  approved: { label: 'Aprobada', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle2 },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
};

// Demo data
const demoVerifications: Verification[] = [
  {
    _id: '1',
    nurseId: 'n1',
    status: 'pending',
    cepNumber: '108887',
    dni: '44119536',
    cepData: {
      fullName: 'CHAVEZ TORRES MARIA CLAUDIA',
      photoUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
      isHabil: true,
    },
    documents: [
      { type: 'dni_front', url: '/doc1.jpg' },
      { type: 'dni_back', url: '/doc2.jpg' },
      { type: 'selfie', url: '/doc3.jpg' },
    ],
    attemptNumber: 1,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    nurse: {
      firstName: 'Maria',
      lastName: 'Chavez',
      email: 'maria.chavez@email.com',
    },
  },
  {
    _id: '2',
    nurseId: 'n2',
    status: 'under_review',
    cepNumber: '125432',
    dni: '72345678',
    cepData: {
      fullName: 'LOPEZ GARCIA ANA LUCIA',
      photoUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
      isHabil: true,
    },
    documents: [
      { type: 'dni_front', url: '/doc1.jpg' },
      { type: 'selfie', url: '/doc3.jpg' },
    ],
    attemptNumber: 1,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    nurse: {
      firstName: 'Ana',
      lastName: 'Lopez',
      email: 'ana.lopez@email.com',
    },
  },
  {
    _id: '3',
    nurseId: 'n3',
    status: 'approved',
    cepNumber: '098765',
    dni: '45678901',
    cepData: {
      fullName: 'RODRIGUEZ MENDEZ CARMEN ROSA',
      photoUrl: 'https://randomuser.me/api/portraits/women/3.jpg',
      isHabil: true,
    },
    documents: [],
    attemptNumber: 1,
    reviewNotes: 'Documentos verificados correctamente',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    nurse: {
      firstName: 'Carmen',
      lastName: 'Rodriguez',
      email: 'carmen.rodriguez@email.com',
    },
  },
  {
    _id: '4',
    nurseId: 'n4',
    status: 'rejected',
    cepNumber: '111222',
    dni: '33445566',
    cepData: {
      fullName: 'TORRES SILVA PATRICIA',
      photoUrl: 'https://randomuser.me/api/portraits/women/4.jpg',
      isHabil: false,
    },
    documents: [],
    attemptNumber: 2,
    reviewNotes: 'CEP no se encuentra HABIL en el registro oficial',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    nurse: {
      firstName: 'Patricia',
      lastName: 'Torres',
      email: 'patricia.torres@email.com',
    },
  },
];

export default function VerificacionesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const { data: verifications, isLoading } = useQuery({
    queryKey: ['verifications', activeTab],
    queryFn: () => verificationsApi.getAll({ status: activeTab }),
    placeholderData: demoVerifications,
  });

  const { data: stats } = useQuery({
    queryKey: ['verification-stats'],
    queryFn: () => verificationsApi.getStats(),
    placeholderData: {
      pending: 5,
      under_review: 2,
      approved: 45,
      rejected: 8,
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: 'approved' | 'rejected'; notes: string }) =>
      verificationsApi.review(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      queryClient.invalidateQueries({ queryKey: ['verification-stats'] });
      toast.success(actionType === 'approve' ? 'Verificacion aprobada' : 'Verificacion rechazada');
      setSelectedVerification(null);
      setReviewNotes('');
      setActionType(null);
    },
    onError: () => {
      toast.error('Error al procesar la verificacion');
    },
  });

  const markUnderReviewMutation = useMutation({
    mutationFn: (id: string) => verificationsApi.markUnderReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      toast.success('Verificacion marcada en revision');
    },
  });

  const filteredVerifications = (verifications || demoVerifications).filter((v: Verification) => {
    if (activeTab !== 'all' && v.status !== activeTab) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        v.cepNumber.includes(search) ||
        v.dni.includes(search) ||
        v.nurse?.firstName?.toLowerCase().includes(searchLower) ||
        v.nurse?.lastName?.toLowerCase().includes(searchLower) ||
        v.cepData?.fullName?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleReview = () => {
    if (!selectedVerification || !actionType) return;
    reviewMutation.mutate({
      id: selectedVerification._id,
      status: actionType === 'approve' ? 'approved' : 'rejected',
      notes: reviewNotes,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Verificaciones CEP</h1>
        <p className="text-muted-foreground">
          Gestiona las verificaciones de enfermeras con el Colegio de Enfermeros del Peru
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Revision</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.under_review || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.approved || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.rejected || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por CEP, DNI o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pendientes
            {stats?.pending ? (
              <Badge variant="secondary" className="ml-1">
                {stats.pending}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="under_review" className="gap-2">
            <Eye className="h-4 w-4" />
            En Revision
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Aprobadas
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rechazadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredVerifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShieldCheck className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">Sin verificaciones</h3>
                  <p className="text-muted-foreground">
                    No hay verificaciones en este estado
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Enfermera</TableHead>
                      <TableHead>CEP</TableHead>
                      <TableHead>DNI</TableHead>
                      <TableHead>Estado CEP</TableHead>
                      <TableHead>Intento</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVerifications.map((verification: Verification) => {
                      const StatusIcon = statusConfig[verification.status].icon;
                      return (
                        <TableRow key={verification._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={verification.cepData?.photoUrl} />
                                <AvatarFallback>
                                  {verification.nurse?.firstName?.[0]}
                                  {verification.nurse?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {verification.cepData?.fullName || `${verification.nurse?.firstName} ${verification.nurse?.lastName}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {verification.nurse?.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{verification.cepNumber}</TableCell>
                          <TableCell className="font-mono">{verification.dni}</TableCell>
                          <TableCell>
                            {verification.cepData?.isHabil ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                HABIL
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                NO HABIL
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">#{verification.attemptNumber}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDistanceToNow(new Date(verification.createdAt), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedVerification(verification)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {verification.status === 'pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => {
                                      setSelectedVerification(verification);
                                      setActionType('approve');
                                    }}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      setSelectedVerification(verification);
                                      setActionType('reject');
                                    }}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail/Review Dialog */}
      <Dialog
        open={!!selectedVerification}
        onOpenChange={() => {
          setSelectedVerification(null);
          setReviewNotes('');
          setActionType(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve'
                ? 'Aprobar Verificacion'
                : actionType === 'reject'
                ? 'Rechazar Verificacion'
                : 'Detalle de Verificacion'}
            </DialogTitle>
            <DialogDescription>
              {actionType
                ? 'Revisa los datos antes de continuar'
                : 'Informacion completa de la verificacion'}
            </DialogDescription>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-4">
              {/* Nurse Info */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedVerification.cepData?.photoUrl} />
                  <AvatarFallback className="text-lg">
                    {selectedVerification.nurse?.firstName?.[0]}
                    {selectedVerification.nurse?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedVerification.cepData?.fullName}
                  </h3>
                  <p className="text-muted-foreground">{selectedVerification.nurse?.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">CEP: {selectedVerification.cepNumber}</Badge>
                    <Badge variant="outline">DNI: {selectedVerification.dni}</Badge>
                    {selectedVerification.cepData?.isHabil ? (
                      <Badge className="bg-green-100 text-green-800">HABIL</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">NO HABIL</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents */}
              {selectedVerification.documents.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documentos ({selectedVerification.documents.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedVerification.documents.map((doc, i) => (
                      <div
                        key={i}
                        className="aspect-square bg-muted rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                      >
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Previous Review Notes */}
              {selectedVerification.reviewNotes && !actionType && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-1">Notas de revision</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedVerification.reviewNotes}
                  </p>
                </div>
              )}

              {/* Review Form */}
              {actionType && (
                <div>
                  <label className="text-sm font-medium">
                    Notas de revision {actionType === 'reject' && '(requerido)'}
                  </label>
                  <Textarea
                    placeholder={
                      actionType === 'approve'
                        ? 'Documentos verificados correctamente...'
                        : 'Motivo del rechazo...'
                    }
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {actionType ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setActionType(null);
                    setReviewNotes('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant={actionType === 'approve' ? 'default' : 'destructive'}
                  onClick={handleReview}
                  disabled={reviewMutation.isPending || (actionType === 'reject' && !reviewNotes)}
                >
                  {reviewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {actionType === 'approve' ? 'Aprobar' : 'Rechazar'}
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                {selectedVerification?.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setActionType('reject')}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rechazar
                    </Button>
                    <Button onClick={() => setActionType('approve')}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Aprobar
                    </Button>
                  </>
                )}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
