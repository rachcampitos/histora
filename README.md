# NurseLite - Enfermeria a Domicilio

**NurseLite** es una plataforma marketplace que conecta pacientes con enfermeras profesionales para servicios de salud a domicilio en Peru. Similar al modelo Uber, permite a los pacientes solicitar servicios de enfermeria y hacer seguimiento en tiempo real.

## URLs de Produccion

| Servicio | URL |
|----------|-----|
| Landing Page | https://nurse-lite.com |
| App Movil (NurseLite) | https://app.nurse-lite.com |
| Backend API | https://api.historahealth.com |
| Swagger Docs | https://api.historahealth.com/docs |

---

## Estructura del Proyecto

```
histora/
├── histora-back/           # Backend NestJS
│   ├── src/
│   │   ├── auth/           # Autenticacion JWT + Google OAuth
│   │   ├── users/          # Gestion de usuarios
│   │   ├── nurses/         # Perfiles de enfermeras
│   │   ├── service-requests/ # Solicitudes de servicio
│   │   ├── service-payments/ # Pagos (Culqi, Yape)
│   │   ├── patient-verification/ # Verificacion de pacientes
│   │   ├── patient-addresses/ # Direcciones de pacientes
│   │   ├── patient-ratings/ # Calificaciones
│   │   ├── notifications/  # Notificaciones multicanal
│   │   ├── uploads/        # Cloudinary (fotos, selfies)
│   │   ├── tracking/       # Tracking en tiempo real
│   │   ├── chat/           # Chat enfermera-paciente
│   │   ├── safety/         # Boton de panico, emergencias
│   │   ├── admin/          # Panel de administracion
│   │   └── health/         # Health checks
│   └── docs/               # Documentacion tecnica
├── histora-care/           # App Movil (Ionic/Angular/Capacitor)
│   ├── src/app/
│   │   ├── auth/           # Login, registro
│   │   ├── nurse/          # Panel enfermera
│   │   │   ├── dashboard/  # Dashboard con mapa
│   │   │   ├── requests/   # Solicitudes entrantes
│   │   │   ├── services/   # Servicios ofrecidos
│   │   │   ├── earnings/   # Ganancias y pagos
│   │   │   ├── verification/ # Verificacion CEP
│   │   │   └── profile/    # Perfil profesional
│   │   └── patient/        # Panel paciente
│   │       ├── home/       # Inicio con servicios
│   │       ├── nurses/     # Busqueda de enfermeras
│   │       ├── tracking/   # Seguimiento en tiempo real
│   │       └── history/    # Historial de servicios
│   └── capacitor.config.ts
├── nurselite-landing/      # Landing page (Next.js 16 + Tailwind 4)
├── histora-admin/          # Panel admin (Next.js 16 + TanStack Query)
├── histora-front/          # (Legacy - No en uso activo)
└── CLAUDE.md               # Instrucciones para desarrollo
```

---

## Stack Tecnologico

### Backend (NestJS)
| Tecnologia | Version | Uso |
|------------|---------|-----|
| NestJS | 11 | Framework |
| MongoDB | Atlas | Base de datos |
| Mongoose | 8 | ODM |
| JWT | - | Autenticacion |
| Passport | - | Estrategias (Local, JWT, Google) |
| Cloudinary | - | Almacenamiento de imagenes |
| SendGrid | - | Emails transaccionales |
| Culqi | - | Procesamiento de pagos (tarjetas, Yape) |
| Socket.IO | - | Tiempo real (tracking) |
| Helmet | 8 | Seguridad HTTP |
| Throttler | 6 | Rate limiting |

### Mobile (Ionic/Angular)
| Tecnologia | Version | Uso |
|------------|---------|-----|
| Angular | 20 | Framework |
| Ionic | 8 | UI Components mobile |
| Capacitor | 8 | APIs nativas (GPS, camara, notificaciones) |
| Mapbox GL | 3 | Mapas y rutas |
| Socket.IO Client | 4 | Tracking en tiempo real |

---

## Caracteristicas Principales

### Para Pacientes
- **Busqueda de enfermeras** cercanas en mapa interactivo
- **Solicitud de servicios** de salud a domicilio
- **Tracking en tiempo real** estilo Uber
- **Multiples metodos de pago**: Tarjeta, Yape, Efectivo
- **Historial de servicios** y calificaciones
- **Chat directo** con la enfermera asignada
- **Boton de panico** para emergencias

### Para Enfermeras
- **Dashboard** con metricas y solicitudes entrantes
- **Verificacion CEP** (Colegio de Enfermeros del Peru)
- **Gestion de disponibilidad** y ubicacion
- **Control de servicios** ofrecidos y precios
- **Seguimiento de ganancias** y pagos
- **Perfil profesional** con especialidades

### Panel de Administracion
- Dashboard con KPIs de la plataforma
- Gestion de enfermeras y verificaciones
- Gestion de pacientes
- Reportes de servicios e ingresos
- Configuracion de comisiones
- Soporte para **Dark Mode**

### Sistema de Seguridad
- Verificacion de enfermeras via CEP oficial
- Verificacion de identidad con selfie
- Sistema de calificaciones bidireccional
- Boton de panico con alerta a contactos
- Tracking GPS durante el servicio

---

## Autenticacion

### Metodos Soportados
- **Email/Password** con verificacion
- **Google Sign-In** (OAuth 2.0)
- **OTP por email** para recuperacion de contrasena

### Roles
| Rol | Descripcion |
|-----|-------------|
| `platform_admin` | Administrador de la plataforma |
| `patient` | Paciente/Usuario que solicita servicios |
| `nurse` | Enfermera profesional verificada |

### Seguridad JWT
- Access token: 15 minutos (enfermeras: 30 min)
- Refresh token: 7 dias (con "recordarme": 30 dias)
- Rotacion automatica de refresh tokens

---

## Flujo de Verificacion de Enfermeras

1. **Registro inicial** con email y datos basicos
2. **Validacion CEP**: DNI + numero CEP verificados con cep.org.pe
3. **Confirmacion de identidad**: Foto oficial del CEP mostrada
4. **Subida de selfie** para verificacion facial
5. **Aprobacion manual** por administrador
6. **Activacion** del perfil profesional

---

## APIs Principales

### Autenticacion
```
POST /auth/login              # Iniciar sesion
POST /auth/register/patient   # Registro paciente
POST /auth/register/nurse/validate-cep  # Validar CEP
POST /auth/register/nurse/complete      # Completar registro enfermera
POST /auth/refresh            # Renovar token
GET  /auth/google             # Google OAuth
```

### Enfermeras
```
GET  /nurses/nearby           # Enfermeras cercanas (geolocation)
GET  /nurses/:id              # Perfil de enfermera
GET  /nurses/me               # Mi perfil (enfermera)
PATCH /nurses/me              # Actualizar perfil
PATCH /nurses/me/availability # Actualizar disponibilidad
PATCH /nurses/me/location     # Actualizar ubicacion
```

### Solicitudes de Servicio
```
POST   /service-requests              # Crear solicitud
GET    /service-requests              # Mis solicitudes
GET    /service-requests/:id          # Detalle de solicitud
PATCH  /service-requests/:id/status   # Cambiar estado
POST   /service-requests/:id/location # Actualizar ubicacion (tracking)
```

### Pagos
```
GET  /service-payments/:serviceRequestId/summary  # Resumen de pago
POST /service-payments                            # Procesar pago
POST /service-payments/:id/verify-yape            # Verificar Yape
```

### Notificaciones
```
GET   /notifications              # Mis notificaciones
PATCH /notifications/:id/read     # Marcar como leida
PATCH /notifications/read-all     # Marcar todas
POST  /notifications/register-device  # Registrar para push
```

---

## Instalacion Local

### Requisitos
- Node.js 22+ (requerido por Capacitor CLI)
- MongoDB (local o Atlas)
- npm o yarn

### Backend

```bash
cd histora-back
npm install
cp .env.example .env  # Configurar variables
npm run start:dev     # Puerto 3000
```

### Mobile (Ionic)

```bash
cd histora-care
npm install
ionic serve           # Puerto 8100
```

---

## Variables de Entorno (Backend)

```env
# Base de datos
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/histora

# JWT
JWT_SECRET=tu-secreto-seguro
JWT_REFRESH_SECRET=tu-refresh-secreto

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu-cloud
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# SendGrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@historahealth.com

# Culqi (Pagos)
CULQI_PUBLIC_KEY=pk_test_xxx
CULQI_API_KEY=sk_test_xxx

# Server
PORT=3000
NODE_ENV=production
CORS_ORIGINS=https://app.nurse-lite.com
FRONTEND_URL=https://app.nurse-lite.com
```

---

## Despliegue

### Backend (Railway)
- **Despliegue automatico** con git push a main
- Root Directory: `histora-back`
- Dominio: api.historahealth.com

### App Movil - NurseLite (Cloudflare Pages)
- **Despliegue automatico** con git push a main
- Root Directory: `histora-care`
- Dominio: app.nurse-lite.com

### Landing Page (Cloudflare Pages)
- **Despliegue automatico** con git push a main
- Root Directory: `nurselite-landing`
- Dominio: nurse-lite.com

### Panel Admin (Cloudflare Pages)
- **Despliegue automatico** con git push a main
- Root Directory: `histora-admin`

> **IMPORTANTE**: No ejecutar `railway up` ni `wrangler pages deploy` manualmente. Solo hacer `git push origin main`.

---

## Scripts

### Backend
```bash
npm run start:dev    # Desarrollo
npm run build        # Compilar
npm run test         # Tests (90+ tests)
npm run lint         # Linting
```

### Mobile
```bash
ionic serve          # Desarrollo web
ionic build          # Build produccion
ionic cap run ios    # Ejecutar en iOS
ionic cap run android # Ejecutar en Android
npm run test         # Tests
```

---

## Integraciones Externas

| Servicio | Uso |
|----------|-----|
| **CEP Peru** | Validacion de enfermeras (cep.org.pe) |
| **Culqi** | Procesamiento de pagos (tarjetas, Yape) |
| **Cloudinary** | Almacenamiento de imagenes |
| **SendGrid** | Emails transaccionales |
| **Mapbox** | Mapas y geocodificacion |
| **MongoDB Atlas** | Base de datos en la nube |
| **Google OAuth** | Autenticacion social |
| **Sentry** | Monitoreo de errores y performance |

---

## Monitoreo (Sentry)

El proyecto incluye monitoreo de errores con Sentry:

- **Frontend**: Captura errores de Angular y performance de navegacion
- **Backend**: Captura excepciones y profiling de rendimiento
- **Dashboard**: https://sentry.io (org: Histora)

Solo activo en produccion para evitar ruido en desarrollo.

---

## Compilacion Nativa (iOS/Android)

### Requisitos
- **iOS**: macOS + Xcode 15+
- **Android**: Android Studio + JDK 17

### Comandos
```bash
cd histora-care

# Sincronizar cambios web con nativo
npx cap sync

# Abrir en IDE nativo
npx cap open ios      # Abre Xcode
npx cap open android  # Abre Android Studio

# Ejecutar en dispositivo/emulador
npx cap run ios
npx cap run android
```

### App Info
- **Bundle ID**: com.historahealth.nurselite
- **App Name**: NurseLite

---

## Tests

- **Backend**: 90+ tests unitarios (Jest)
- **Mobile**: Tests con Jasmine/Karma

```bash
# Backend
cd histora-back && npm test

# Mobile
cd histora-care && npm test
```

---

## Documentacion Adicional

- [Flujo de verificacion de enfermeras](histora-back/docs/NURSE-VERIFICATION-FLOW.md)
- [Sistema de pagos](histora-care/docs/PAYMENT-STRATEGY.md)
- [API del CEP](histora-back/docs/CEP-API.md)
- [Flujos del sistema](histora-care/docs/FLUJOS_SISTEMA.md)

---

## Roadmap

### Completado
- [x] Autenticacion (JWT, Google OAuth)
- [x] Verificacion de enfermeras via CEP
- [x] Busqueda de enfermeras por geolocalizacion
- [x] Solicitudes de servicio
- [x] Tracking en tiempo real (Socket.IO + Mapbox)
- [x] Sistema de calificaciones y resenas
- [x] Panel de administracion (Next.js)
- [x] Compilacion nativa iOS/Android (Capacitor)
- [x] Monitoreo de errores (Sentry)
- [x] Chat en tiempo real paciente-enfermera
- [x] Pagos: Efectivo, Yape P2P, Plin P2P
- [x] Codigos de seguridad bidireccionales
- [x] Boton de panico y sistema de emergencia
- [x] Verificacion de identidad de pacientes
- [x] Dark mode completo
- [x] Landing page (nurse-lite.com)

### Pendiente

| Descripcion | Prioridad |
|-------------|-----------|
| Notificaciones Push nativas (Firebase/APNs) | Alta |
| Integracion Culqi para tarjetas de credito | Alta |
| Escalabilidad: Redis Cache | Media |
| Sistema de Favoritos para Pacientes | Baja |
| Testing: Aumentar cobertura a 80% | Media |

---

## Licencia

Proyecto privado y propietario. Todos los derechos reservados.

**Desarrollado por Raul Campos** | nurse-lite.com
