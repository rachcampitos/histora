'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { Loader2 } from 'lucide-react';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();
  const [message, setMessage] = useState('Procesando inicio de sesion con Google...');

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      setMessage('Error en la autenticacion con Google');
      toast.error('Error de autenticacion', {
        description: error,
      });
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    if (accessToken && userParam) {
      try {
        const user = JSON.parse(userParam);

        // Check if user is admin
        if (user.role !== 'platform_admin') {
          setMessage('Solo administradores pueden acceder');
          toast.error('Acceso denegado', {
            description: 'Tu cuenta no tiene permisos de administrador.',
          });
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        // Store auth
        login(user, accessToken);

        toast.success('Bienvenido', {
          description: `Hola ${user.firstName}!`,
        });

        router.push('/dashboard');
      } catch (err) {
        console.error('Error parsing Google callback:', err);
        setMessage('Error al procesar la respuesta');
        setTimeout(() => router.push('/login'), 2000);
      }
    } else {
      setMessage('Parametros de autenticacion faltantes');
      setTimeout(() => router.push('/login'), 2000);
    }
  }, [searchParams, login, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg text-slate-400">{message}</p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-slate-400">Cargando...</p>
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
