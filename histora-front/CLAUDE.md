# Histora Care Admin - Panel de Administracion

## Descripcion

Panel de administracion web exclusivo para la gestion de **Histora Care** (enfermeria a domicilio).
Este proyecto anteriormente era un gestor de consultorios medicos, pero ha sido pivoteado
para servir como centro de control administrativo de la plataforma NurseLite.

**URL de Produccion:** https://admin.historahealth.com (pendiente configuracion)

## Stack Tecnologico

- **Framework:** Angular 19 (standalone components)
- **UI Library:** Angular Material
- **Charts:** ApexCharts
- **Internationalization:** ngx-translate (ES/EN)
- **State:** Signals (Angular 19)
- **Build:** Vite

## Estructura del Proyecto

```
histora-front/
├── src/
│   ├── app/
│   │   ├── admin/              # Modulos de administracion
│   │   │   ├── dashboard/      # Panel principal con KPIs
│   │   │   ├── nurses/         # Gestion de enfermeras
│   │   │   ├── nurse-verifications/ # Verificaciones CEP
│   │   │   ├── patients/       # Vista de pacientes
│   │   │   ├── users/          # Usuarios administrativos
│   │   │   ├── subscriptions/  # Gestion de suscripciones
│   │   │   ├── reports/        # Reportes y analiticas
│   │   │   └── settings/       # Configuracion del sistema
│   │   ├── authentication/     # Login/Password recovery
│   │   ├── auth/               # Google OAuth callback
│   │   ├── core/               # Servicios, guards, interceptors
│   │   ├── layout/             # Header, sidebar, layouts
│   │   └── shared/             # Componentes compartidos
│   ├── assets/
│   │   ├── data/routes.json    # Configuracion del menu lateral
│   │   └── i18n/               # Traducciones ES/EN
│   └── environments/           # Configuracion de entornos
```

## Funcionalidades Principales

### Dashboard
- KPIs: enfermeras activas, servicios del dia, verificaciones pendientes
- Alertas de panico en tiempo real
- Actividad reciente del sistema
- Graficas de servicios (ApexCharts)

### Gestion de Enfermeras
- Listado con filtros (verificacion, estado, disponibilidad)
- Perfil detallado con historial de servicios
- Activar/Desactivar enfermeras
- Vista de calificaciones y reviews

### Verificaciones CEP
- Cola de verificaciones pendientes
- Validacion con API del Colegio de Enfermeros del Peru
- Aprobacion/Rechazo con historial de decisiones
- Vista de documentos subidos

### Pacientes
- Vista de pacientes registrados
- Historial de servicios por paciente
- Informacion de contacto

## Roles de Acceso

Solo los siguientes roles pueden acceder al panel:
- `PLATFORM_ADMIN`: Acceso completo
- `PLATFORM_ADMIN_UI`: Acceso de lectura

Usuarios con otros roles (NURSE, PATIENT) son rechazados en el login.

## Comandos

```bash
# Desarrollo
npm start           # Servidor de desarrollo (localhost:4200)
npm run build       # Build de produccion
npm run test        # Tests unitarios
npm run lint        # ESLint
```

## Variables de Entorno

Las variables estan en `src/environments/`:
- `environment.ts` - Desarrollo
- `environment.prod.ts` - Produccion

```typescript
{
  apiUrl: 'https://api.historahealth.com',
  // ...
}
```

## Despliegue

- **Hosting:** Vercel (automatico con push a main)
- **Dominio:** admin.historahealth.com (pendiente)

## Notas Importantes

1. Este panel NO tiene registro publico - los admins se crean via backend
2. Las carpetas `/doctor`, `/patient`, `/calendar`, `/clinics` fueron eliminadas
3. El menu lateral solo muestra opciones de administracion
4. Todos los endpoints apuntan al API de histora-back

---
Actualizado: 2026-01-28
