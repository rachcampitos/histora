'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Coupon } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { cn } from '@/lib/utils';
import {
  Calendar,
  Copy,
  Edit,
  Gift,
  MoreHorizontal,
  Percent,
  Plus,
  Tag,
  Target,
  Ticket,
  Trash,
  TrendingUp,
  Users,
} from 'lucide-react';

// Demo coupons
const demoCoupons: Coupon[] = [
  {
    _id: '1',
    code: 'BIENVENIDO20',
    type: 'percentage',
    value: 20,
    minOrderValue: 50,
    maxUses: 100,
    currentUses: 45,
    maxUsesPerUser: 1,
    userSegment: 'new',
    validFrom: '2025-01-01T00:00:00Z',
    validUntil: '2025-03-31T23:59:59Z',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    _id: '2',
    code: 'ENFERMERA10',
    type: 'fixed',
    value: 10,
    maxUses: 500,
    currentUses: 123,
    maxUsesPerUser: 3,
    userSegment: 'all',
    validFrom: '2025-01-15T00:00:00Z',
    validUntil: '2025-02-28T23:59:59Z',
    isActive: true,
    createdAt: '2025-01-15T00:00:00Z',
  },
  {
    _id: '3',
    code: 'VERANO25',
    type: 'percentage',
    value: 25,
    minOrderValue: 100,
    maxUses: 50,
    currentUses: 50,
    maxUsesPerUser: 1,
    userSegment: 'existing',
    validFrom: '2025-01-01T00:00:00Z',
    validUntil: '2025-01-31T23:59:59Z',
    isActive: false,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    _id: '4',
    code: 'INYECTABLE15',
    type: 'percentage',
    value: 15,
    maxUses: 200,
    currentUses: 67,
    maxUsesPerUser: 2,
    userSegment: 'all',
    serviceTypes: ['injection'],
    validFrom: '2025-01-20T00:00:00Z',
    validUntil: '2025-04-30T23:59:59Z',
    isActive: true,
    createdAt: '2025-01-20T00:00:00Z',
  },
];

const couponSchema = z.object({
  code: z.string().min(3, 'Minimo 3 caracteres').max(20, 'Maximo 20 caracteres'),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(1, 'Valor minimo 1'),
  minOrderValue: z.number().optional(),
  maxUses: z.number().min(1, 'Minimo 1 uso'),
  maxUsesPerUser: z.number().min(1, 'Minimo 1 por usuario'),
  userSegment: z.enum(['new', 'existing', 'all']),
  validFrom: z.string(),
  validUntil: z.string(),
});

type CouponFormData = z.infer<typeof couponSchema>;

export default function MarketingPage() {
  const [tab, setTab] = useState('coupons');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Note: Coupons endpoints not yet implemented in backend
  // Using demo data for now
  const coupons = demoCoupons;
  const isLoading = false;

  // Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      type: 'percentage',
      maxUsesPerUser: 1,
      userSegment: 'all',
    },
  });

  const couponType = watch('type');

  // Note: Coupons endpoints not yet implemented in backend
  // Mock mutations for now
  const createMutation = {
    mutate: (data: CouponFormData) => {
      console.log('Creating coupon:', data);
      toast.success('Cupon creado exitosamente (demo)');
      setShowCreateDialog(false);
      reset();
    },
    isPending: false,
  };

  const deleteMutation = {
    mutate: (id: string) => {
      console.log('Deleting coupon:', id);
      toast.success('Cupon eliminado (demo)');
    },
    isPending: false,
  };

  const onSubmit = (data: CouponFormData) => {
    createMutation.mutate(data);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Codigo copiado');
  };

  // Stats
  const stats = {
    active: coupons?.filter((c) => c.isActive).length || 0,
    totalUses: coupons?.reduce((sum, c) => sum + c.currentUses, 0) || 0,
    newUserCoupons: coupons?.filter((c) => c.userSegment === 'new').length || 0,
  };

  const segmentLabels = {
    new: 'Nuevos usuarios',
    existing: 'Usuarios existentes',
    all: 'Todos',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing</h1>
          <p className="text-muted-foreground">
            Gestiona cupones y campanas de marketing
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear Cupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Cupon</DialogTitle>
              <DialogDescription>
                Configura los parametros del cupon de descuento
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Codigo del Cupon</Label>
                <Input
                  id="code"
                  placeholder="Ej: VERANO25"
                  {...register('code')}
                  className="uppercase"
                />
                {errors.code && (
                  <p className="text-xs text-destructive">{errors.code.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Descuento</Label>
                  <Select
                    defaultValue="percentage"
                    onValueChange={(v) => setValue('type', v as 'percentage' | 'fixed')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                      <SelectItem value="fixed">Monto Fijo (S/)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">
                    Valor {couponType === 'percentage' ? '(%)' : '(S/)'}
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    {...register('value', { valueAsNumber: true })}
                  />
                  {errors.value && (
                    <p className="text-xs text-destructive">{errors.value.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minOrderValue">Pedido Minimo (opcional)</Label>
                  <Input
                    id="minOrderValue"
                    type="number"
                    placeholder="S/ 0"
                    {...register('minOrderValue', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Segmento</Label>
                  <Select
                    defaultValue="all"
                    onValueChange={(v) => setValue('userSegment', v as 'new' | 'existing' | 'all')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="new">Nuevos usuarios</SelectItem>
                      <SelectItem value="existing">Usuarios existentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Usos Maximos</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    {...register('maxUses', { valueAsNumber: true })}
                  />
                  {errors.maxUses && (
                    <p className="text-xs text-destructive">{errors.maxUses.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUsesPerUser">Usos por Usuario</Label>
                  <Input
                    id="maxUsesPerUser"
                    type="number"
                    {...register('maxUsesPerUser', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validFrom">Valido Desde</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    {...register('validFrom')}
                  />
                  {errors.validFrom && (
                    <p className="text-xs text-destructive">{errors.validFrom.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Valido Hasta</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    {...register('validUntil')}
                  />
                  {errors.validUntil && (
                    <p className="text-xs text-destructive">{errors.validUntil.message}</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creando...' : 'Crear Cupon'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cupones Activos
            </CardTitle>
            <Ticket className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Canjes
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cupones Nuevos Usuarios
            </CardTitle>
            <Gift className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newUserCoupons}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cupones
            </CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coupons?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Gestionar Cupones</CardTitle>
          <CardDescription>
            Crea y administra codigos de descuento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="coupons">
                <Ticket className="mr-2 h-4 w-4" />
                Cupones
              </TabsTrigger>
              <TabsTrigger value="campaigns" disabled>
                <Target className="mr-2 h-4 w-4" />
                Campanas (Pronto)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="coupons" className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codigo</TableHead>
                      <TableHead>Descuento</TableHead>
                      <TableHead>Segmento</TableHead>
                      <TableHead>Uso</TableHead>
                      <TableHead>Validez</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons?.map((coupon) => {
                      const isExpired = new Date(coupon.validUntil) < new Date();
                      const usagePercent = Math.round((coupon.currentUses / coupon.maxUses) * 100);

                      return (
                        <TableRow key={coupon._id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="rounded bg-muted px-2 py-1 font-mono text-sm font-semibold">
                                {coupon.code}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyCode(coupon.code)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {coupon.type === 'percentage' ? (
                                <>
                                  <Percent className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold">{coupon.value}%</span>
                                </>
                              ) : (
                                <span className="font-semibold">S/ {coupon.value}</span>
                              )}
                            </div>
                            {coupon.minOrderValue && (
                              <p className="text-xs text-muted-foreground">
                                Min. S/ {coupon.minOrderValue}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              <Users className="mr-1 h-3 w-3" />
                              {segmentLabels[coupon.userSegment]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {coupon.currentUses} / {coupon.maxUses}
                                </span>
                              </div>
                              <div className="h-2 w-20 rounded-full bg-muted">
                                <div
                                  className={cn(
                                    'h-2 rounded-full',
                                    usagePercent >= 100 ? 'bg-red-500' :
                                    usagePercent >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                                  )}
                                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(coupon.validFrom), 'dd/MM/yy', { locale: es })} -{' '}
                                {format(new Date(coupon.validUntil), 'dd/MM/yy', { locale: es })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isExpired ? (
                              <Badge variant="secondary">Expirado</Badge>
                            ) : coupon.currentUses >= coupon.maxUses ? (
                              <Badge variant="secondary">Agotado</Badge>
                            ) : coupon.isActive ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Activo
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inactivo</Badge>
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
                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => copyCode(coupon.code)}>
                                  <Copy className="mr-2 h-4 w-4" />
                                  Copiar codigo
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => deleteMutation.mutate(coupon._id)}
                                  className="text-destructive"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!coupons || coupons.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No hay cupones creados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
