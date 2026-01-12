# Histora - Sistema de Gestión de Consultorios Médicos

**Histora** es un sistema SaaS completo para la gestión de consultorios médicos, desarrollado para el contexto latinoamericano. Incluye manejo de pacientes, citas, historiales clínicos, notificaciones automatizadas y más.

## URLs de Producción

| Servicio | URL |
|----------|-----|
| Frontend | https://app.historahealth.com |
| Backend API | https://api.historahealth.com |
| Swagger Docs | http://localhost:3000/docs (solo desarrollo) |

---

## Estructura del Proyecto

```
histora/
├── histora-back/           # Backend NestJS
│   ├── src/
│   │   ├── auth/           # Autenticación JWT
│   │   ├── users/          # Gestión de usuarios
│   │   ├── patients/       # Pacientes
│   │   ├── doctors/        # Médicos y perfiles
│   │   ├── appointments/   # Citas médicas
│   │   ├── consultations/  # Consultas
│   │   ├── clinical-history/ # Historiales
│   │   ├── vitals/         # Signos vitales
│   │   ├── notifications/  # Notificaciones
│   │   ├── payments/       # Pagos
│   │   ├── uploads/        # Cloudinary
│   │   ├── chatbot/        # WhatsApp Bot
│   │   └── ...
│   └── Dockerfile
├── histora-front/          # Frontend Angular (Web)
│   ├── src/app/
│   │   ├── core/           # Servicios, guards
│   │   ├── authentication/ # Login, registro
│   │   ├── admin/          # Panel admin
│   │   ├── doctor/         # Panel médico
│   │   └── patient/        # Panel paciente
│   ├── Dockerfile
│   └── nginx.conf
├── histora-care/           # App Móvil (Ionic/Capacitor)
│   ├── src/app/
│   │   ├── auth/           # Login, registro
│   │   ├── nurse/          # Panel enfermera
│   │   │   ├── dashboard/  # Dashboard con mapa
│   │   │   ├── requests/   # Solicitudes
│   │   │   ├── services/   # Servicios ofrecidos
│   │   │   ├── earnings/   # Ganancias
│   │   │   └── profile/    # Perfil profesional
│   │   └── patient/        # Panel paciente
│   │       ├── map/        # Mapa con enfermeras
│   │       ├── tracking/   # Seguimiento en tiempo real
│   │       └── history/    # Historial de servicios
│   └── capacitor.config.ts
├── railway.toml            # Config Railway
└── README.md
```

---

## Stack Tecnológico

### Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| NestJS | 11 | Framework |
| MongoDB | Atlas | Base de datos |
| Mongoose | 8 | ODM |
| JWT | - | Autenticación |
| Cloudinary | - | Archivos/imágenes |
| SendGrid | - | Emails |
| WhatsApp API | - | Notificaciones |
| Helmet | 8 | Seguridad HTTP |
| Throttler | 6 | Rate limiting |

### Frontend (Web)
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Angular | 20 | Framework |
| Angular Material | 20 | UI Components |
| FullCalendar | 6 | Calendario |
| ApexCharts | 5 | Gráficos |
| NGX-Translate | 17 | i18n (ES/EN) |
| NGX-Datatable | 22 | Tablas |

### Mobile (Histora Care)
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Angular | 20 | Framework |
| Ionic | 8 | UI Components mobile |
| Capacitor | 8 | APIs nativas |
| Mapbox GL | 3 | Mapas y rutas |
| Socket.IO | 4 | Tiempo real |

---

## Características Principales

### Autenticación y Seguridad
- Login con email/contraseña
- **Google Sign-In** (OAuth 2.0)
- JWT con refresh token rotation
- "Recordarme" con tokens de larga duración
- Rate limiting (10/s, 100/min, 1000/h)
- Headers de seguridad (Helmet)
- CORS configurado
- Roles: **Platform Admin**, Clinic Owner, Doctor, Staff, Paciente

### Panel del Médico
- Dashboard con estadísticas
- Gestión de pacientes
- Calendario de citas interactivo
- Historiales clínicos completos
- Perfil profesional con CV
- Notificaciones en tiempo real

### Panel del Paciente
- Búsqueda de médicos
- Agendamiento de citas online
- Historial de consultas
- Portal del paciente
- Recordatorios automáticos

### Panel de Administración (Platform Admin)
- Dashboard con KPIs de la plataforma
- Gestión de clínicas
- Gestión de usuarios
- Suscripciones y planes
- Reportes de ingresos
- Configuración global
- **Notificaciones automáticas** cuando nuevos usuarios se registran
- Soporte completo para **Dark Mode**

### Sistema de Notificaciones
- Email (SendGrid)
- WhatsApp Business API
- Notificaciones in-app con polling (30s)
- Recordatorios automáticos:
  - 24 horas antes de la cita
  - 1 hora antes de la cita
- Notificaciones para médicos:
  - Nueva cita agendada
  - Cita cancelada por paciente
- Notificaciones para admins:
  - Nuevo médico registrado
  - Nuevo paciente registrado

### Chatbot WhatsApp
- Consulta de médicos disponibles
- Agendamiento de citas
- Consulta de citas existentes
- Cancelación de citas

### Accesibilidad
- Cumplimiento WCAG 2.1 AA
- Navegación por teclado
- Labels ARIA
- Contraste adecuado

### App Móvil - Histora Care
Aplicación móvil para servicios de enfermería a domicilio.

**Para Pacientes:**
- Mapa interactivo con enfermeras cercanas (Mapbox)
- Solicitud de servicios de salud
- Tracking en tiempo real estilo Uber
- Historial de servicios

**Para Enfermeras:**
- Dashboard con métricas y solicitudes
- Gestión de disponibilidad
- Control de servicios ofrecidos
- Seguimiento de ganancias
- Perfil profesional

---

## Instalación Local

### Requisitos
- Node.js 20+
- MongoDB (local o Atlas)
- npm

### Backend

```bash
cd histora-back
npm install
cp .env.example .env  # Configurar variables
npm run start:dev     # Puerto 3000
```

### Frontend

```bash
cd histora-front
npm install
npm start             # Puerto 4200
```

---

## Variables de Entorno

### Backend (.env)

```env
# Base de datos
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/histora

# JWT
JWT_SECRET=tu-secreto-seguro
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=tu-refresh-secreto
JWT_REFRESH_EXPIRATION=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu-cloud
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret

# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@historahealth.com

# WhatsApp
WHATSAPP_ACCESS_TOKEN=tu-token
WHATSAPP_PHONE_NUMBER_ID=tu-phone-id
WHATSAPP_VERIFY_TOKEN=histora_verify_token

# Server
PORT=3000
NODE_ENV=production
CORS_ORIGINS=https://app.historahealth.com
```

---

## Despliegue

### Railway (Producción actual)

**Backend Service:**
- Root Directory: `/` (usa railway.toml)
- Dockerfile: `histora-back/Dockerfile`
- Dominio: api.historahealth.com

**Frontend Service:**
- Root Directory: `histora-front`
- Dockerfile: `Dockerfile`
- Dominio: app.historahealth.com

### DNS (Namecheap)

```
CNAME  api  →  [backend-service].up.railway.app
CNAME  app  →  [frontend-service].up.railway.app
```

---

## API Endpoints

### Autenticación
```
POST /auth/login          # Iniciar sesión
POST /auth/register       # Registro
POST /auth/refresh        # Renovar token
POST /auth/logout         # Cerrar sesión
```

### Usuarios y Pacientes
```
GET    /users             # Listar usuarios
GET    /patients          # Listar pacientes
POST   /patients          # Crear paciente
GET    /patients/:id      # Obtener paciente
PATCH  /patients/:id      # Actualizar
```

### Médicos
```
GET    /doctors           # Listar médicos
GET    /doctors/:id       # Obtener médico
GET    /doctors/me        # Mi perfil
PATCH  /doctors/me        # Actualizar perfil
```

### Citas
```
GET    /appointments      # Listar citas
POST   /appointments      # Crear cita
PATCH  /appointments/:id  # Actualizar
DELETE /appointments/:id  # Cancelar
```

### Archivos
```
POST   /uploads/avatar       # Subir foto
DELETE /uploads/avatar       # Eliminar foto
POST   /uploads/doctor/cv    # Subir CV
DELETE /uploads/doctor/cv    # Eliminar CV
```

### Notificaciones
```
GET    /notifications           # Mis notificaciones
PATCH  /notifications/:id/read  # Marcar leída
PATCH  /notifications/read-all  # Marcar todas
```

---

## Scripts

### Backend
```bash
npm run start:dev    # Desarrollo
npm run start:prod   # Producción
npm run build        # Compilar
npm run test         # Tests
npm run test:cov     # Coverage
npm run lint         # Linting
```

### Frontend
```bash
npm start            # Desarrollo
npm run build        # Producción
npm run test         # Tests
npm run test:ci      # Tests CI
npm run lint         # Linting
```

---

## Seguridad Implementada

| Medida | Descripción |
|--------|-------------|
| Helmet.js | CSP, XSS Protection, HSTS |
| Rate Limiting | 10/s, 100/min, 1000/h por IP |
| JWT | Tokens de corta duración |
| Refresh Tokens | Rotación automática |
| CORS | Solo dominios autorizados |
| Validation | DTOs con class-validator |
| Sanitization | Whitelist en pipes |

---

## Tests

- **Backend**: 279+ tests unitarios (Jest)
- **Frontend**: 118+ tests unitarios (Karma/Jasmine)

```bash
# Ejecutar todos los tests
cd histora-back && npm test
cd histora-front && npm test
```

---

## Roadmap

### Completado
- [x] Backend completo (18 módulos)
- [x] Frontend Angular con Material
- [x] Sistema de autenticación JWT
- [x] **Google Sign-In** (OAuth 2.0)
- [x] Gestión de pacientes y citas
- [x] Historiales clínicos
- [x] Notificaciones automáticas
- [x] Chatbot WhatsApp
- [x] Despliegue en Railway
- [x] Dominio personalizado
- [x] Rate limiting y seguridad
- [x] **Panel de administración** con dark mode
- [x] **Perfil de médico** con CV
- [x] **Portal del paciente** completo
- [x] Accesibilidad WCAG 2.1 AA

### Pendiente
- [ ] Rediseño página de login/registro
- [ ] Integración WhatsApp Business completa
- [ ] Exportación PDF de historiales
- [x] App móvil Histora Care (Ionic/Capacitor)
- [ ] Google Auth en Histora Care
- [ ] Sistema de pagos (Stripe/MercadoPago)

---

## Licencia

Proyecto privado y propietario. Todos los derechos reservados.

**Desarrollado por Raul Campos** | historahealth.com
