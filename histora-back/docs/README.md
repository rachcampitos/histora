# Histora Care - Documentacion Backend

## Indice de Documentacion

### Autenticacion y Seguridad
| Documento | Descripcion |
|-----------|-------------|
| [PASSWORD-RECOVERY-OTP.md](./PASSWORD-RECOVERY-OTP.md) | Sistema de recuperacion de contrasena con OTP de 6 digitos |
| [SECURITY_SYSTEM.md](./SECURITY_SYSTEM.md) | Rate limiting, account lockout, Helmet, CORS |
| [EMAIL-VERIFICATION-RECOMMENDATION.md](./EMAIL-VERIFICATION-RECOMMENDATION.md) | Analisis UX/Marketing sobre verificacion de email |

### Verificacion de Enfermeras
| Documento | Descripcion |
|-----------|-------------|
| [NURSE-VERIFICATION-FLOW.md](./NURSE-VERIFICATION-FLOW.md) | Flujo completo de verificacion CEP + RENIEC |
| [NURSE-ONBOARDING-FLOW.md](./NURSE-ONBOARDING-FLOW.md) | Proceso de onboarding de enfermeras |
| [CEP-API.md](./CEP-API.md) | Integracion con API del Colegio de Enfermeros del Peru |

### Funcionalidades
| Documento | Descripcion |
|-----------|-------------|
| [NURSE-REVIEWS-SYSTEM.md](./NURSE-REVIEWS-SYSTEM.md) | Sistema de calificaciones y resenas de enfermeras |
| [PAYMENT-BETA-MODE.md](./PAYMENT-BETA-MODE.md) | Modo beta de pagos (Culqi, Yape, efectivo) |

---

## Estructura del Backend

```
src/
├── auth/                   # Autenticacion (JWT, Google OAuth, OTP)
│   ├── strategies/         # Passport strategies (JWT, Local, Google)
│   ├── guards/             # Auth guards (JWT, Roles)
│   ├── services/           # Account lockout, cookies
│   └── dto/                # Login, register DTOs
├── users/                  # Gestion de usuarios
├── nurses/                 # Perfiles de enfermeras
│   ├── cep-validation.service.ts    # Validacion CEP Peru
│   └── reniec-validation.service.ts # Validacion RENIEC (backup)
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
└── common/                 # Guards, decorators, pipes, cache
```

## Roles de Usuario

| Rol | Descripcion |
|-----|-------------|
| `platform_admin` | Administrador de la plataforma |
| `patient` | Paciente que solicita servicios |
| `nurse` | Enfermera profesional verificada |

## Variables de Entorno

```env
# Base de datos
MONGO_URL=mongodb+srv://...

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@historahealth.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# Pagos (Culqi)
CULQI_PUBLIC_KEY=pk_test_xxxxx
CULQI_API_KEY=sk_test_xxxxx

# Server
PORT=3000
NODE_ENV=production
CORS_ORIGINS=https://care.historahealth.com
FRONTEND_URL=https://care.historahealth.com
```

## Despliegue

El backend se despliega automaticamente en **Railway** con cada push a `main`.

```bash
# NO ejecutar manualmente:
# railway up

# Solo hacer:
git push origin main
```

URL de produccion: `https://api.historahealth.com`

## Comandos

```bash
npm run start:dev    # Desarrollo
npm run build        # Compilar
npm run test         # Tests unitarios (90+)
npm run test:cov     # Coverage
npm run lint         # Linting
```

---

**Histora Care** - Enfermeria a domicilio en Peru
