# Histora Care - Documentacion Backend

> **IMPORTANTE:** La documentacion principal consolidada se encuentra en:
> `/docs/NURSELITE-PLATFORM.md`
>
> Este directorio contiene documentacion tecnica especifica del backend.

## Documentacion Consolidada

| Documento | Ubicacion | Descripcion |
|-----------|-----------|-------------|
| **NURSELITE-PLATFORM.md** | `/docs/` | Documentacion principal unificada |
| **CEP-API.md** | `/docs/` | Referencia tecnica API del CEP |
| **CLAUDE.md** | `/` | Instrucciones para Claude Code |

## Documentacion Tecnica Backend (Este directorio)

Los siguientes archivos contienen detalles tecnicos especificos que complementan la documentacion principal:

| Documento | Estado | Notas |
|-----------|--------|-------|
| `SECURITY_SYSTEM.md` | Referencia | Sistema completo de seguridad (detalle tecnico) |
| `NURSE-VERIFICATION-FLOW.md` | Referencia | Flujo tecnico de verificacion |
| `CEP-API.md` | **Movido a /docs/** | Ver `/docs/CEP-API.md` |
| `NURSE-ONBOARDING-FLOW.md` | Referencia | Flujo de onboarding |
| `NURSE-REVIEWS-SYSTEM.md` | Referencia | Sistema de reviews |
| `PASSWORD-RECOVERY-OTP.md` | Referencia | Sistema OTP |
| `PAYMENT-BETA-MODE.md` | **Obsoleto** | Ahora en NURSELITE-PLATFORM.md |

---

## Estructura del Backend

```
src/
├── auth/                   # Autenticacion (JWT, Google OAuth, OTP)
│   ├── strategies/         # Passport strategies (JWT, Local, Google)
│   ├── guards/             # Auth guards (JWT, Roles)
│   └── dto/                # Login, register DTOs
├── users/                  # Gestion de usuarios
├── nurses/                 # Perfiles de enfermeras
│   ├── cep-validation.service.ts    # Validacion CEP Peru
│   ├── nurse-verification.service.ts
│   └── nurse-review.schema.ts
├── service-requests/       # Solicitudes de servicio
├── service-payments/       # Pagos (Culqi, Yape, efectivo)
├── admin/                  # Panel de administracion
├── notifications/          # Email, SMS, Push
├── uploads/                # Cloudinary
└── common/                 # Guards, decorators, pipes
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

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# Pagos (Culqi) - En modo simulacion durante beta
CULQI_PUBLIC_KEY=pk_test_xxxxx
CULQI_API_KEY=sk_test_xxxxx

# Server
PORT=3000
NODE_ENV=production
```

## Despliegue

Automatico con push a `main` → Railway

```bash
# Solo hacer:
git push origin main
```

URL: `https://api.historahealth.com`

## Comandos

```bash
npm run start:dev    # Desarrollo
npm run build        # Compilar
npm run test         # Tests unitarios
```

---

**NurseLite** - Enfermeria a domicilio en Peru
