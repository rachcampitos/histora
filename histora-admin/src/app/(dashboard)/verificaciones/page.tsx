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
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Camera,
  User,
  BadgeCheck,
  ExternalLink,
  Phone,
  Mail,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

// Types matching the backend API response
interface CepValidationResult {
  isValid?: boolean;
  region?: string;
  isHabil?: boolean;
  status?: string;
  fullName?: string;
  photoUrl?: string;
  validatedAt?: string;
}

interface VerificationDocument {
  url: string;
  type: 'cep_front' | 'cep_back' | 'dni_front' | 'dni_back' | 'selfie_with_dni';
  uploadedAt: string;
}

interface NurseUser {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
}

interface VerificationNurse {
  _id: string;
  cepNumber: string;
  specialties: string[];
  officialCepPhotoUrl?: string;
  selfieUrl?: string;
  cepRegisteredName?: string;
  bio?: string;
  yearsOfExperience?: number;
  user?: NurseUser;
}

interface Verification {
  _id: string;
  id?: string;
  nurseId: string;
  userId: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  dniNumber?: string;
  fullNameOnDni?: string;
  documents: VerificationDocument[];
  officialCepPhotoUrl?: string;
  cepIdentityConfirmed?: boolean;
  cepIdentityConfirmedAt?: string;
  cepValidation?: CepValidationResult;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  attemptNumber: number;
  createdAt: string;
  updatedAt: string;
  nurse?: VerificationNurse;
}

interface VerificationStats {
  pending: number;
  under_review?: number;
  underReview?: number;
  approved: number;
  rejected: number;
  total?: number;
}

interface VerificationsResponse {
  data: Verification[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  verifications?: Verification[];
  total?: number;
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
  under_review: { label: 'En revision', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Eye },
  approved: { label: 'Aprobada', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle2 },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
};

const documentLabels: Record<string, string> = {
  cep_front: 'CEP (Frente)',
  cep_back: 'CEP (Dorso)',
  dni_front: 'DNI (Frente)',
  dni_back: 'DNI (Dorso)',
  selfie_with_dni: 'Selfie con DNI',
};

export default function VerificacionesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<VerificationDocument | null>(null);

  // Fetch verifications
  const { data: verificationsResponse, isLoading, error } = useQuery<VerificationsResponse>({
    queryKey: ['verifications', activeTab],
    queryFn: () => verificationsApi.getAll({ status: activeTab }),
  });

  // Extract verifications from response (handle both formats)
  const verifications = verificationsResponse?.data || verificationsResponse?.verifications || [];

  // Fetch stats
  const { data: stats } = useQuery<VerificationStats>({
    queryKey: ['verification-stats'],
    queryFn: () => verificationsApi.getStats(),
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: 'approved' | 'rejected'; notes: string }) =>
      verificationsApi.review(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      queryClient.invalidateQueries({ queryKey: ['verification-stats'] });
      toast.success(showRejectionForm ? 'Verificacion rechazada' : 'Verificacion aprobada');
      closeDialog();
    },
    onError: () => {
      toast.error('Error al procesar la verificacion');
    },
  });

  // Mark under review mutation
  const markUnderReviewMutation = useMutation({
    mutationFn: (id: string) => verificationsApi.markUnderReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      queryClient.invalidateQueries({ queryKey: ['verification-stats'] });
      toast.success('Verificacion marcada en revision');
    },
  });

  const closeDialog = () => {
    setSelectedVerification(null);
    setReviewNotes('');
    setRejectionReason('');
    setShowRejectionForm(false);
    setSelectedDocument(null);
  };

  const filteredVerifications = verifications.filter((v: Verification) => {
    if (activeTab !== 'all' && v.status !== activeTab) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      const cepNumber = v.nurse?.cepNumber || '';
      const dniNumber = v.dniNumber || '';
      const firstName = v.nurse?.user?.firstName || '';
      const lastName = v.nurse?.user?.lastName || '';
      const fullName = v.fullNameOnDni || v.cepValidation?.fullName || '';
      return (
        cepNumber.includes(search) ||
        dniNumber.includes(search) ||
        firstName.toLowerCase().includes(searchLower) ||
        lastName.toLowerCase().includes(searchLower) ||
        fullName.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleApprove = () => {
    if (!selectedVerification) return;
    const id = selectedVerification._id || selectedVerification.id;
    if (!id) return;
    reviewMutation.mutate({
      id,
      status: 'approved',
      notes: reviewNotes,
    });
  };

  const handleReject = () => {
    if (!selectedVerification || !rejectionReason) return;
    const id = selectedVerification._id || selectedVerification.id;
    if (!id) return;
    reviewMutation.mutate({
      id,
      status: 'rejected',
      notes: `${reviewNotes}\n\nMotivo de rechazo: ${rejectionReason}`,
    });
  };

  const getInitials = (firstName?: string, lastName?: string): string => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '??';
  };

  const getCepPhotoUrl = (verification: Verification): string | null => {
    return verification.officialCepPhotoUrl
      || verification.nurse?.officialCepPhotoUrl
      || verification.cepValidation?.photoUrl
      || null;
  };

  // Get under_review count (handle both formats)
  const underReviewCount = stats?.under_review ?? stats?.underReview ?? 0;

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
            <div className="text-2xl font-bold">{underReviewCount}</div>
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
            {underReviewCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {underReviewCount}
              </Badge>
            )}
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
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-red-500/50" />
                  <h3 className="mt-4 text-lg font-semibold">Error al cargar</h3>
                  <p className="text-muted-foreground">
                    No se pudieron cargar las verificaciones
                  </p>
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
                      <TableHead>Documentos</TableHead>
                      <TableHead>Intento</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVerifications.map((verification: Verification) => {
                      const StatusIcon = statusConfig[verification.status].icon;
                      const docsCount = verification.documents?.length || 0;
                      return (
                        <TableRow key={verification._id || verification.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={getCepPhotoUrl(verification) || verification.nurse?.user?.avatar} />
                                <AvatarFallback>
                                  {getInitials(
                                    verification.nurse?.user?.firstName,
                                    verification.nurse?.user?.lastName
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {verification.fullNameOnDni ||
                                    verification.cepValidation?.fullName ||
                                    `${verification.nurse?.user?.firstName || ''} ${verification.nurse?.user?.lastName || ''}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {verification.nurse?.user?.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{verification.nurse?.cepNumber || '-'}</TableCell>
                          <TableCell className="font-mono">{verification.dniNumber || '-'}</TableCell>
                          <TableCell>
                            {verification.cepValidation?.isHabil !== undefined ? (
                              verification.cepValidation.isHabil ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  HABIL
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  NO HABIL
                                </Badge>
                              )
                            ) : (
                              <Badge variant="outline">Sin validar</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              <FileText className="h-3 w-3" />
                              {docsCount}/5
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">#{verification.attemptNumber || 1}</Badge>
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
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => {
                                      const id = verification._id || verification.id;
                                      if (id) markUnderReviewMutation.mutate(id);
                                    }}
                                    title="Marcar en revision"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => {
                                      setSelectedVerification(verification);
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
                                      setShowRejectionForm(true);
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
      <Dialog open={!!selectedVerification} onOpenChange={() => closeDialog()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showRejectionForm
                ? 'Rechazar Verificacion'
                : 'Detalle de Verificacion'}
            </DialogTitle>
            <DialogDescription>
              {showRejectionForm
                ? 'Indica el motivo del rechazo para que la enfermera pueda corregirlo'
                : 'Revisa los documentos y fotos antes de aprobar'}
            </DialogDescription>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-6">
              {/* Nurse Info Header */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={getCepPhotoUrl(selectedVerification) || selectedVerification.nurse?.user?.avatar} />
                  <AvatarFallback className="text-lg">
                    {getInitials(
                      selectedVerification.nurse?.user?.firstName,
                      selectedVerification.nurse?.user?.lastName
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {selectedVerification.fullNameOnDni ||
                      selectedVerification.cepValidation?.fullName ||
                      `${selectedVerification.nurse?.user?.firstName || ''} ${selectedVerification.nurse?.user?.lastName || ''}`}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {selectedVerification.nurse?.user?.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {selectedVerification.nurse.user.email}
                      </span>
                    )}
                    {selectedVerification.nurse?.user?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedVerification.nurse.user.phone}
                      </span>
                    )}
                  </div>
                </div>
                <Badge className={statusConfig[selectedVerification.status].color}>
                  {statusConfig[selectedVerification.status].label}
                </Badge>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Numero CEP</p>
                  <p className="font-semibold font-mono">{selectedVerification.nurse?.cepNumber || '-'}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Numero DNI</p>
                  <p className="font-semibold font-mono">{selectedVerification.dniNumber || '-'}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Nombre en CEP</p>
                  <p className="font-semibold text-sm">
                    {selectedVerification.cepValidation?.fullName || selectedVerification.fullNameOnDni || '-'}
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Intento #</p>
                  <p className="font-semibold">{selectedVerification.attemptNumber || 1}</p>
                </div>
              </div>

              {/* CEP Validation Section */}
              {selectedVerification.cepValidation && (
                <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <h4 className="flex items-center gap-2 font-semibold text-green-800 dark:text-green-200 mb-3">
                    <BadgeCheck className="h-5 w-5" />
                    Validacion CEP Oficial
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <Badge
                      className={
                        selectedVerification.cepValidation.isHabil
                          ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100'
                      }
                    >
                      {selectedVerification.cepValidation.isHabil ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {selectedVerification.cepValidation.status || (selectedVerification.cepValidation.isHabil ? 'HABIL' : 'INHABILITADO')}
                    </Badge>
                    {selectedVerification.cepValidation.region && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                        <MapPin className="h-3 w-3 mr-1" />
                        {selectedVerification.cepValidation.region}
                      </Badge>
                    )}
                  </div>
                  {selectedVerification.cepValidation.validatedAt && (
                    <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                      Verificado el {format(new Date(selectedVerification.cepValidation.validatedAt), 'dd/MM/yyyy HH:mm')}
                    </p>
                  )}
                </div>
              )}

              {/* Identity Confirmation Badge */}
              {selectedVerification.cepIdentityConfirmed && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 text-green-800 dark:text-green-100">
                  <BadgeCheck className="h-5 w-5" />
                  <span className="font-medium">Identidad confirmada por el usuario</span>
                  {selectedVerification.cepIdentityConfirmedAt && (
                    <span className="ml-auto text-sm">
                      {format(new Date(selectedVerification.cepIdentityConfirmedAt), 'dd/MM/yyyy HH:mm')}
                    </span>
                  )}
                </div>
              )}

              {/* Photo Comparison Section */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="flex items-center gap-2 font-semibold mb-2">
                  <Camera className="h-5 w-5 text-primary" />
                  Comparacion de Fotos
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Verifica que la persona en las tres fotos sea la misma antes de aprobar
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Official CEP Photo */}
                  <div className="bg-background p-4 rounded-lg text-center border flex flex-col">
                    <div className="flex items-center justify-center gap-2 mb-3 text-sm font-medium">
                      <BadgeCheck className="h-4 w-4 text-green-600" />
                      Foto Oficial CEP
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center">
                      {getCepPhotoUrl(selectedVerification) ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-green-200 flex-shrink-0">
                            <img
                              src={getCepPhotoUrl(selectedVerification)!}
                              alt="Foto oficial CEP"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Badge className="bg-green-600 text-white">
                            Registro Oficial
                          </Badge>
                        </div>
                      ) : (
                        <div className="w-28 h-28 rounded-full bg-muted flex flex-col items-center justify-center">
                          <Camera className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs mt-1">Sin foto</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selfie Photo */}
                  <div className="bg-background p-4 rounded-lg text-center border flex flex-col">
                    <div className="flex items-center justify-center gap-2 mb-3 text-sm font-medium">
                      <Camera className="h-4 w-4 text-blue-600" />
                      Selfie de Verificacion
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center">
                      {selectedVerification.nurse?.selfieUrl ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-blue-200 flex-shrink-0">
                            <img
                              src={selectedVerification.nurse.selfieUrl}
                              alt="Selfie de verificacion"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Badge className="bg-blue-600 text-white">
                            Tomada por Usuario
                          </Badge>
                        </div>
                      ) : (
                        <div className="w-28 h-28 rounded-full bg-muted flex flex-col items-center justify-center">
                          <Camera className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs mt-1">Sin selfie</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Avatar */}
                  <div className="bg-background p-4 rounded-lg text-center border flex flex-col">
                    <div className="flex items-center justify-center gap-2 mb-3 text-sm font-medium">
                      <User className="h-4 w-4 text-yellow-600" />
                      Avatar de Perfil
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center">
                      {selectedVerification.nurse?.user?.avatar ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-yellow-200 flex-shrink-0">
                            <img
                              src={selectedVerification.nurse.user.avatar}
                              alt="Avatar de perfil"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Badge className="bg-yellow-600 text-white">
                            Foto de Perfil
                          </Badge>
                        </div>
                      ) : (
                        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                          {getInitials(
                            selectedVerification.nurse?.user?.firstName,
                            selectedVerification.nurse?.user?.lastName
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Specialties */}
              {selectedVerification.nurse?.specialties && selectedVerification.nurse.specialties.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Especialidades</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedVerification.nurse.specialties.map((specialty, i) => (
                      <Badge key={i} variant="secondary">{specialty}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents Section */}
              {selectedVerification.documents && selectedVerification.documents.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 font-semibold mb-3">
                    <FileText className="h-5 w-5" />
                    Documentos ({selectedVerification.documents.length}/5)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {selectedVerification.documents.map((doc, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedDocument(doc)}
                        className="aspect-square bg-muted rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors border-2 border-transparent hover:border-primary p-2"
                      >
                        <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-xs text-center font-medium">
                          {documentLabels[doc.type] || doc.type}
                        </span>
                      </button>
                    ))}
                    {/* Show missing documents */}
                    {['cep_front', 'cep_back', 'dni_front', 'dni_back', 'selfie_with_dni']
                      .filter(type => !selectedVerification.documents.some(d => d.type === type))
                      .map((missingType, i) => (
                        <div
                          key={`missing-${i}`}
                          className="aspect-square bg-red-50 dark:bg-red-950 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-red-300 dark:border-red-700 p-2"
                        >
                          <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
                          <span className="text-xs text-center font-medium text-red-600 dark:text-red-400">
                            {documentLabels[missingType]} (Faltante)
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Previous Review Info */}
              {selectedVerification.reviewedAt && (
                <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Revision Anterior</h4>
                  <p className="text-sm">
                    <strong>Fecha:</strong> {format(new Date(selectedVerification.reviewedAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                  {selectedVerification.reviewNotes && (
                    <p className="text-sm mt-1">
                      <strong>Notas:</strong> {selectedVerification.reviewNotes}
                    </p>
                  )}
                  {selectedVerification.rejectionReason && (
                    <p className="text-sm mt-1 text-red-600 dark:text-red-400">
                      <strong>Motivo de rechazo:</strong> {selectedVerification.rejectionReason}
                    </p>
                  )}
                </div>
              )}

              {/* Review Form */}
              {(selectedVerification.status === 'pending' || selectedVerification.status === 'under_review') && (
                <div className="space-y-4 p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold">Revision</h4>
                  <div>
                    <label className="text-sm font-medium">Notas internas (opcional)</label>
                    <Textarea
                      placeholder="Notas que solo veran los administradores..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  {showRejectionForm && (
                    <div>
                      <label className="text-sm font-medium text-red-600">
                        Motivo de rechazo (la enfermera vera este mensaje) *
                      </label>
                      <Textarea
                        placeholder="Se especifico para ayudarla a corregir su solicitud..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="mt-1 border-red-300 focus:border-red-500"
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {showRejectionForm ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectionForm(false);
                    setRejectionReason('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={reviewMutation.isPending || !rejectionReason}
                >
                  {reviewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar Rechazo
                </Button>
              </>
            ) : selectedVerification?.status === 'pending' || selectedVerification?.status === 'under_review' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectionForm(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rechazar
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={reviewMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {reviewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aprobar
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={closeDialog}>
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument ? documentLabels[selectedDocument.type] || selectedDocument.type : 'Documento'}
            </DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="flex flex-col items-center gap-4">
              <img
                src={selectedDocument.url}
                alt={documentLabels[selectedDocument.type] || selectedDocument.type}
                className="max-w-full max-h-[60vh] rounded-lg shadow-lg object-contain"
              />
              <Button asChild variant="outline">
                <a href={selectedDocument.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir en nueva pestana
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
