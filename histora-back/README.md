# Histora Care - Backend API

Backend de **Histora Care**, la plataforma de enfermeria a domicilio. Construido con **NestJS** y **MongoDB**.

## Estructura de Modulos

```
src/
├── auth/                   # Autenticacion (JWT, Google OAuth, OTP)
│   ├── strategies/         # Passport strategies
│   ├── guards/             # JWT, Roles guards
│   ├── services/           # Account lockout, cookies
│   └── dto/                # Login, register DTOs
├── users/                  # Gestion de usuarios
├── nurses/                 # Perfiles de enfermeras
│   ├── cep-validation.service.ts  # Validacion CEP Peru
│   └── reniec-validation.service.ts
├── service-requests/       # Solicitudes de servicio
├── service-payments/       # Pagos (Culqi, Yape, efectivo)
│   └── providers/          # Culqi provider
├── patient-verification/   # Verificacion de pacientes
├── patient-addresses/      # Direcciones de pacientes
├── patient-ratings/        # Sistema de calificaciones
├── notifications/          # Notificaciones multicanal
│   └── providers/          # Email, SMS, WhatsApp, Push
├── uploads/                # Cloudinary (fotos, selfies)
├── tracking/               # Tracking GPS en tiempo real
├── chat/                   # Chat enfermera-paciente
├── safety/                 # Boton de panico, emergencias
├── admin/                  # Panel de administracion
├── health/                 # Health checks
└── common/                 # Guards, decorators, pipes, cache, encryption
```

## Tecnologias

| Tecnologia | Version | Uso |
|------------|---------|-----|
| NestJS | 11 | Framework |
| MongoDB | Atlas | Base de datos |
| Mongoose | 8 | ODM |
| Passport | 0.7 | Autenticacion |
| JWT | - | Tokens |
| Cloudinary | - | Imagenes |
| SendGrid | - | Emails |
| Culqi | - | Pagos |
| Socket.IO | - | Tiempo real |
| Helmet | 8 | Seguridad |
| Throttler | 6 | Rate limiting |

## Instalacion

```bash
npm install
cp .env.example .env  # Configurar variables
npm run start:dev     # Puerto 3000
```

## Variables de Entorno

```env
# Base de datos
MONGO_URL=mongodb+srv://...

# JWT
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# SendGrid
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=noreply@historahealth.com

# Culqi
CULQI_API_KEY=...

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGINS=http://localhost:8100
FRONTEND_URL=http://localhost:8100
```

## Scripts

```bash
npm run start:dev    # Desarrollo con watch
npm run start:prod   # Produccion
npm run build        # Compilar
npm run test         # Tests unitarios
npm run test:cov     # Coverage
npm run lint         # ESLint
```

## APIs Principales

### Auth
- `POST /auth/login` - Iniciar sesion
- `POST /auth/register/patient` - Registro paciente
- `POST /auth/register/nurse/validate-cep` - Validar CEP
- `POST /auth/register/nurse/complete` - Completar registro enfermera
- `POST /auth/refresh` - Renovar token
- `GET /auth/google` - Google OAuth
- `POST /auth/password-reset/request-otp` - Solicitar OTP
- `POST /auth/password-reset/reset-with-otp` - Reset con OTP

### Nurses
- `GET /nurses/nearby` - Enfermeras cercanas (geolocation)
- `GET /nurses/:id` - Perfil publico
- `GET /nurses/me` - Mi perfil
- `PATCH /nurses/me` - Actualizar perfil
- `PATCH /nurses/me/availability` - Disponibilidad
- `PATCH /nurses/me/location` - Ubicacion GPS

### Service Requests
- `POST /service-requests` - Crear solicitud
- `GET /service-requests` - Listar mis solicitudes
- `GET /service-requests/:id` - Detalle
- `PATCH /service-requests/:id/status` - Cambiar estado
- `POST /service-requests/:id/location` - Actualizar ubicacion

### Payments
- `GET /service-payments/:id/summary` - Resumen de pago
- `POST /service-payments` - Procesar pago
- `POST /service-payments/:id/verify-yape` - Verificar Yape

### Admin
- `GET /admin/dashboard` - Dashboard con KPIs
- `GET /admin/nurses` - Listar enfermeras
- `GET /admin/patients` - Listar pacientes
- `GET /admin/verifications` - Verificaciones pendientes

## Roles

| Rol | Descripcion |
|-----|-------------|
| `platform_admin` | Administrador de la plataforma |
| `patient` | Usuario que solicita servicios |
| `nurse` | Enfermera profesional verificada |

## Seguridad

- **Helmet.js**: CSP, XSS Protection, HSTS
- **Rate Limiting**: 10/s, 100/min, 1000/h por IP
- **JWT**: Access token 15min, Refresh token 7d
- **Refresh Token Rotation**: Tokens de un solo uso
- **Account Lockout**: Bloqueo tras intentos fallidos
- **CORS**: Solo dominios autorizados
- **Validation**: DTOs con class-validator

## Tests

```bash
npm run test           # 90+ tests unitarios
npm run test:cov       # Coverage report
npm run test:watch     # Watch mode
```

## Documentacion

- [Verificacion de enfermeras](docs/NURSE-VERIFICATION-FLOW.md)
- [API CEP Peru](docs/CEP-API.md)
- [Sistema de seguridad](docs/SECURITY_SYSTEM.md)
- [Pagos beta](docs/PAYMENT-BETA-MODE.md)

## Despliegue

**Railway** (automatico con git push)
- Root: `histora-back`
- Dominio: api.historahealth.com

> No ejecutar `railway up` manualmente.
