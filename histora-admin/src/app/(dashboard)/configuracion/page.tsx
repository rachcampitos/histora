'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/stores/auth-store';
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
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Bell,
  Building2,
  Check,
  CreditCard,
  Globe,
  Key,
  Laptop,
  Lock,
  Mail,
  Moon,
  Palette,
  Phone,
  Save,
  Settings,
  Shield,
  Sun,
  User,
  Wallet,
} from 'lucide-react';

const profileSchema = z.object({
  firstName: z.string().min(2, 'Minimo 2 caracteres'),
  lastName: z.string().min(2, 'Minimo 2 caracteres'),
  email: z.string().email('Email invalido'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Minimo 6 caracteres'),
  newPassword: z.string().min(8, 'Minimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { theme, setTheme } = useTheme();
  const { user } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: '',
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Perfil actualizado correctamente');
    } catch {
      toast.error('Error al actualizar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Contraseña actualizada correctamente');
      resetPassword();
    } catch {
      toast.error('Error al actualizar contraseña');
    } finally {
      setIsSaving(false);
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Oscuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Laptop },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground">
          Administra tu cuenta y preferencias del sistema
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar Navigation */}
        <Card className="lg:w-64">
          <CardContent className="p-4">
            <nav className="space-y-1">
              {[
                { id: 'profile', label: 'Perfil', icon: User },
                { id: 'security', label: 'Seguridad', icon: Lock },
                { id: 'appearance', label: 'Apariencia', icon: Palette },
                { id: 'notifications', label: 'Notificaciones', icon: Bell },
                { id: 'platform', label: 'Plataforma', icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      activeTab === item.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Perfil de Usuario
                </CardTitle>
                <CardDescription>
                  Actualiza tu informacion personal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-teal-500 to-blue-600 text-white text-xl">
                        {user?.firstName?.charAt(0)}
                        {user?.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Button variant="outline" type="button">
                        Cambiar foto
                      </Button>
                      <p className="mt-1 text-xs text-muted-foreground">
                        JPG, PNG. Max 2MB.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Name fields */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input
                        id="firstName"
                        {...registerProfile('firstName')}
                      />
                      {profileErrors.firstName && (
                        <p className="text-xs text-destructive">
                          {profileErrors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellido</Label>
                      <Input
                        id="lastName"
                        {...registerProfile('lastName')}
                      />
                      {profileErrors.lastName && (
                        <p className="text-xs text-destructive">
                          {profileErrors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contact fields */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          className="pl-9"
                          {...registerProfile('email')}
                        />
                      </div>
                      {profileErrors.email && (
                        <p className="text-xs text-destructive">
                          {profileErrors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefono</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          className="pl-9"
                          placeholder="+51 999 999 999"
                          {...registerProfile('phone')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                      <Save className="mr-2 h-4 w-4" />
                      {isSaving ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Cambiar Contraseña
                  </CardTitle>
                  <CardDescription>
                    Actualiza tu contraseña regularmente para mantener segura tu cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Contraseña actual</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        {...registerPassword('currentPassword')}
                      />
                      {passwordErrors.currentPassword && (
                        <p className="text-xs text-destructive">
                          {passwordErrors.currentPassword.message}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nueva contraseña</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          {...registerPassword('newPassword')}
                        />
                        {passwordErrors.newPassword && (
                          <p className="text-xs text-destructive">
                            {passwordErrors.newPassword.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          {...registerPassword('confirmPassword')}
                        />
                        {passwordErrors.confirmPassword && (
                          <p className="text-xs text-destructive">
                            {passwordErrors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSaving}>
                        <Lock className="mr-2 h-4 w-4" />
                        Actualizar contraseña
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Sesiones Activas
                  </CardTitle>
                  <CardDescription>
                    Gestiona los dispositivos donde has iniciado sesion
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <Laptop className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">MacBook Pro - Chrome</p>
                          <p className="text-xs text-muted-foreground">
                            Lima, Peru • Activo ahora
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Actual</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <Phone className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">iPhone 15 - Safari</p>
                          <p className="text-xs text-muted-foreground">
                            Lima, Peru • Hace 2 horas
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Cerrar sesion
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Apariencia
                </CardTitle>
                <CardDescription>
                  Personaliza como se ve la aplicacion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Tema</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {themeOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = theme === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setTheme(option.value)}
                          className={cn(
                            'flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors',
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-muted'
                          )}
                        >
                          <Icon className={cn('h-6 w-6', isSelected && 'text-primary')} />
                          <span className="text-sm font-medium">{option.label}</span>
                          {isSelected && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Idioma</Label>
                  <Select defaultValue="es">
                    <SelectTrigger className="w-[200px]">
                      <Globe className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en" disabled>English (Pronto)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificaciones
                </CardTitle>
                <CardDescription>
                  Configura que notificaciones deseas recibir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      id: 'verifications',
                      title: 'Nuevas verificaciones',
                      description: 'Cuando una enfermera solicita verificacion CEP',
                      enabled: true,
                    },
                    {
                      id: 'services',
                      title: 'Servicios activos',
                      description: 'Actualizaciones de servicios en progreso',
                      enabled: true,
                    },
                    {
                      id: 'payments',
                      title: 'Pagos y finanzas',
                      description: 'Notificaciones de pagos y reembolsos',
                      enabled: true,
                    },
                    {
                      id: 'alerts',
                      title: 'Alertas del sistema',
                      description: 'Alertas importantes y errores',
                      enabled: true,
                    },
                    {
                      id: 'reports',
                      title: 'Reportes semanales',
                      description: 'Resumen de metricas por email',
                      enabled: false,
                    },
                  ].map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {notification.description}
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          defaultChecked={notification.enabled}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-muted after:bg-background after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:outline-none" />
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Platform Tab */}
          {activeTab === 'platform' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Configuracion de Plataforma
                  </CardTitle>
                  <CardDescription>
                    Ajustes generales de NurseLite
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Comision de plataforma (%)</Label>
                      <Input type="number" defaultValue="10" />
                    </div>
                    <div className="space-y-2">
                      <Label>Radio de busqueda (km)</Label>
                      <Input type="number" defaultValue="10" />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tiempo max. espera (min)</Label>
                      <Input type="number" defaultValue="30" />
                    </div>
                    <div className="space-y-2">
                      <Label>Intentos de asignacion</Label>
                      <Input type="number" defaultValue="5" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Integracion de Pagos
                  </CardTitle>
                  <CardDescription>
                    Configuracion de Culqi y metodos de pago
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Culqi</p>
                        <p className="text-xs text-muted-foreground">
                          Tarjetas de credito y debito
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Conectado</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-100">
                        <span className="text-sm font-bold text-purple-600">Y</span>
                      </div>
                      <div>
                        <p className="font-medium">Yape</p>
                        <p className="text-xs text-muted-foreground">
                          Pagos con Yape via Culqi
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Activo</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
