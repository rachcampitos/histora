'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Progress } from '@/components/ui/progress';
import {
  Search,
  AlertTriangle,
  Shield,
  Star,
  MessageSquare,
  Ban,
  Send,
  Eye,
  AlertCircle,
  Users,
  UserX,
  Loader2,
  ThumbsDown,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AtRiskUser {
  _id: string;
  type: 'nurse' | 'patient';
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  riskScore: number;
  riskReasons: string[];
  totalComplaints: number;
  averageRating: number;
  lastIncidentAt?: string;
}

interface LowReview {
  _id: string;
  rating: number;
  comment: string;
  serviceId: string;
  patientName: string;
  nurseName: string;
  nurseId: string;
  createdAt: string;
  adminResponse?: string;
  respondedAt?: string;
}

// Demo data
const demoAtRiskUsers: AtRiskUser[] = [
  {
    _id: '1',
    type: 'nurse',
    firstName: 'Carmen',
    lastName: 'Diaz',
    email: 'carmen.diaz@email.com',
    riskScore: 75,
    riskReasons: ['3 quejas en ultimos 30 dias', 'Rating bajo (2.5)', 'Cancelaciones frecuentes'],
    totalComplaints: 5,
    averageRating: 2.5,
    lastIncidentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '2',
    type: 'patient',
    firstName: 'Roberto',
    lastName: 'Silva',
    email: 'roberto.silva@email.com',
    riskScore: 60,
    riskReasons: ['Reportado por 2 enfermeras', 'Comportamiento inapropiado'],
    totalComplaints: 3,
    averageRating: 0,
    lastIncidentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '3',
    type: 'nurse',
    firstName: 'Patricia',
    lastName: 'Vargas',
    email: 'patricia.vargas@email.com',
    riskScore: 45,
    riskReasons: ['Rating promedio bajo', 'Llegadas tarde frecuentes'],
    totalComplaints: 2,
    averageRating: 3.2,
    lastIncidentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const demoLowReviews: LowReview[] = [
  {
    _id: '1',
    rating: 1,
    comment: 'La enfermera llego 2 horas tarde y no se disculpo. Muy mal servicio.',
    serviceId: 's1',
    patientName: 'Juan Perez',
    nurseName: 'Carmen Diaz',
    nurseId: 'n1',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '2',
    rating: 2,
    comment: 'El servicio fue regular, pero no me explicaron bien los procedimientos.',
    serviceId: 's2',
    patientName: 'Maria Lopez',
    nurseName: 'Patricia Vargas',
    nurseId: 'n2',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    adminResponse: 'Lamentamos tu experiencia. Hemos contactado a la enfermera para mejorar.',
    respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '3',
    rating: 2,
    comment: 'Falta de profesionalismo. Estuvo usando el celular durante la cita.',
    serviceId: 's3',
    patientName: 'Carlos Ruiz',
    nurseName: 'Carmen Diaz',
    nurseId: 'n1',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const getRiskColor = (score: number) => {
  if (score >= 70) return 'text-red-600 bg-red-100 dark:bg-red-900/50';
  if (score >= 50) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/50';
  return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50';
};

const getRiskProgressColor = (score: number) => {
  if (score >= 70) return 'bg-red-500';
  if (score >= 50) return 'bg-orange-500';
  return 'bg-yellow-500';
};

export default function ModeracionPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('at-risk');
  const [selectedUser, setSelectedUser] = useState<AtRiskUser | null>(null);
  const [selectedReview, setSelectedReview] = useState<LowReview | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [warningMessage, setWarningMessage] = useState('');

  // Note: Moderation endpoints not fully implemented in backend
  // Using demo data for now
  const atRiskUsers = demoAtRiskUsers;
  const loadingUsers = false;
  const lowReviews = demoLowReviews;
  const loadingReviews = false;

  const stats = {
    atRiskTotal: 3,
    atRiskNurses: 2,
    atRiskPatients: 1,
    pendingReviews: 2,
    recentComplaints: 5,
    suspendedUsers: 1,
  };

  // Temporary handlers until backend is implemented
  const handleSendWarning = (userId: string, message: string) => {
    console.log('Sending warning to', userId, message);
    toast.success('Advertencia enviada');
    setSelectedUser(null);
    setWarningMessage('');
  };

  const handleSuspendUser = (userId: string) => {
    console.log('Suspending user', userId);
    toast.success('Usuario suspendido');
    setSelectedUser(null);
  };

  const handleRespondToReview = (reviewId: string, response: string) => {
    console.log('Responding to review', reviewId, response);
    toast.success('Respuesta enviada');
    setSelectedReview(null);
    setAdminResponse('');
  };

  const sendWarningMutation = {
    mutate: ({ userId, message }: { userId: string; message: string }) => handleSendWarning(userId, message),
    isPending: false,
  };

  const suspendUserMutation = {
    mutate: (userId: string) => handleSuspendUser(userId),
    isPending: false,
  };

  const respondReviewMutation = {
    mutate: ({ reviewId, response }: { reviewId: string; response: string }) =>
      handleRespondToReview(reviewId, response),
    isPending: false,
  };

  const filteredUsers = (atRiskUsers || demoAtRiskUsers).filter((user: AtRiskUser) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const filteredReviews = (lowReviews || demoLowReviews).filter((review: LowReview) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        review.nurseName.toLowerCase().includes(searchLower) ||
        review.patientName.toLowerCase().includes(searchLower) ||
        review.comment.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Moderacion</h1>
        <p className="text-muted-foreground">
          Controla usuarios en riesgo y gestiona resenas negativas
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Riesgo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.atRiskTotal || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Enfermeras</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.atRiskNurses || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pacientes</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.atRiskPatients || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resenas Pend.</CardTitle>
            <MessageSquare className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingReviews || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quejas Recientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recentComplaints || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Suspendidos</CardTitle>
            <UserX className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.suspendedUsers || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="at-risk" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Usuarios en Riesgo
            {stats?.atRiskTotal ? (
              <Badge variant="destructive" className="ml-1">
                {stats.atRiskTotal}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-2">
            <ThumbsDown className="h-4 w-4" />
            Resenas Bajas
            {stats?.pendingReviews ? (
              <Badge variant="secondary" className="ml-1">
                {stats.pendingReviews}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* At Risk Users */}
        <TabsContent value="at-risk" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loadingUsers ? (
                <div className="p-4 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">Sin usuarios en riesgo</h3>
                  <p className="text-muted-foreground">
                    No hay usuarios que requieran atencion
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Score de Riesgo</TableHead>
                      <TableHead>Razones</TableHead>
                      <TableHead>Quejas</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Ultimo Incidente</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: AtRiskUser) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback>
                                {user.firstName[0]}{user.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.type === 'nurse' ? 'Enfermera' : 'Paciente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-sm font-medium ${getRiskColor(user.riskScore)}`}>
                                {user.riskScore}%
                              </span>
                            </div>
                            <Progress
                              value={user.riskScore}
                              className="h-1.5 w-20"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            {user.riskReasons.slice(0, 2).map((reason, i) => (
                              <p key={i} className="text-xs text-muted-foreground truncate">
                                • {reason}
                              </p>
                            ))}
                            {user.riskReasons.length > 2 && (
                              <p className="text-xs text-muted-foreground">
                                +{user.riskReasons.length - 2} mas
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">{user.totalComplaints}</Badge>
                        </TableCell>
                        <TableCell>
                          {user.averageRating > 0 ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{user.averageRating.toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.lastIncidentAt
                            ? formatDistanceToNow(new Date(user.lastIncidentAt), {
                                addSuffix: true,
                                locale: es,
                              })
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              onClick={() => {
                                setSelectedUser(user);
                                setWarningMessage('');
                              }}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                if (confirm(`¿Suspender a ${user.firstName} ${user.lastName}?`)) {
                                  suspendUserMutation.mutate(user._id);
                                }
                              }}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Low Reviews */}
        <TabsContent value="reviews" className="mt-4">
          <div className="grid gap-4">
            {loadingReviews ? (
              [...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))
            ) : filteredReviews.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">Sin resenas bajas</h3>
                  <p className="text-muted-foreground">
                    No hay resenas negativas pendientes
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredReviews.map((review: LowReview) => (
                <Card key={review._id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-muted-foreground font-normal">
                            por {review.patientName}
                          </span>
                        </CardTitle>
                        <CardDescription>
                          Enfermera: {review.nurseName} •{' '}
                          {formatDistanceToNow(new Date(review.createdAt), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </CardDescription>
                      </div>
                      {review.adminResponse ? (
                        <Badge className="bg-green-100 text-green-800">Respondida</Badge>
                      ) : (
                        <Badge variant="secondary">Pendiente</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{review.comment}</p>
                    {review.adminResponse ? (
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          Respuesta del admin •{' '}
                          {format(new Date(review.respondedAt!), 'dd MMM, HH:mm', { locale: es })}
                        </p>
                        <p className="text-sm">{review.adminResponse}</p>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReview(review)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Responder
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* User Detail / Warning Dialog */}
      <Dialog
        open={!!selectedUser}
        onOpenChange={() => {
          setSelectedUser(null);
          setWarningMessage('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogTitle>
            <DialogDescription>
              Detalles del usuario y acciones disponibles
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback className="text-lg">
                    {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedUser.email}</p>
                  <Badge variant="outline">
                    {selectedUser.type === 'nurse' ? 'Enfermera' : 'Paciente'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <p className={`text-2xl font-bold ${getRiskColor(selectedUser.riskScore)}`}>
                    {selectedUser.riskScore}%
                  </p>
                  <p className="text-xs text-muted-foreground">Score Riesgo</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{selectedUser.totalComplaints}</p>
                  <p className="text-xs text-muted-foreground">Quejas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {selectedUser.averageRating > 0 ? selectedUser.averageRating.toFixed(1) : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">Rating</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Razones del riesgo:</h4>
                <ul className="space-y-1">
                  {selectedUser.riskReasons.map((reason, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="text-sm font-medium">Enviar advertencia</label>
                <Textarea
                  placeholder="Escribe el mensaje de advertencia..."
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedUser && confirm(`¿Suspender a ${selectedUser.firstName}?`)) {
                  suspendUserMutation.mutate(selectedUser._id);
                }
              }}
            >
              <Ban className="mr-2 h-4 w-4" />
              Suspender
            </Button>
            <Button
              onClick={() => {
                if (selectedUser && warningMessage) {
                  sendWarningMutation.mutate({
                    userId: selectedUser._id,
                    message: warningMessage,
                  });
                }
              }}
              disabled={!warningMessage || sendWarningMutation.isPending}
            >
              {sendWarningMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Enviar Advertencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Response Dialog */}
      <Dialog
        open={!!selectedReview}
        onOpenChange={() => {
          setSelectedReview(null);
          setAdminResponse('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder a Resena</DialogTitle>
            <DialogDescription>
              Escribe una respuesta para el paciente
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < selectedReview.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground">
                    por {selectedReview.patientName}
                  </span>
                </div>
                <p className="text-sm">{selectedReview.comment}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Enfermera: {selectedReview.nurseName}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Tu respuesta</label>
                <Textarea
                  placeholder="Escribe tu respuesta..."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  className="mt-1"
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReview(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (selectedReview && adminResponse) {
                  respondReviewMutation.mutate({
                    reviewId: selectedReview._id,
                    response: adminResponse,
                  });
                }
              }}
              disabled={!adminResponse || respondReviewMutation.isPending}
            >
              {respondReviewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Respuesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
