# Histora Care - Documentación Backend

## Índice de Documentación

### Autenticación y Seguridad
| Documento | Descripción |
|-----------|-------------|
| [PASSWORD-RECOVERY-OTP.md](./PASSWORD-RECOVERY-OTP.md) | Sistema de recuperación de contraseña con OTP de 6 dígitos |
| [EMAIL-VERIFICATION-RECOMMENDATION.md](./EMAIL-VERIFICATION-RECOMMENDATION.md) | Análisis UX/Marketing sobre verificación de email en registro |
| [SECURITY_SYSTEM.md](./SECURITY_SYSTEM.md) | Sistema de seguridad general, rate limiting, lockout |

### Verificación de Enfermeras
| Documento | Descripción |
|-----------|-------------|
| [NURSE-VERIFICATION-FLOW.md](./NURSE-VERIFICATION-FLOW.md) | Flujo completo de verificación CEP + RENIEC |
| [CEP-API.md](./CEP-API.md) | Integración con API del Colegio de Enfermeros del Perú |

### Funcionalidades
| Documento | Descripción |
|-----------|-------------|
| [NURSE-REVIEWS-SYSTEM.md](./NURSE-REVIEWS-SYSTEM.md) | Sistema de calificaciones y reseñas de enfermeras |
| [PAYMENT-BETA-MODE.md](./PAYMENT-BETA-MODE.md) | Modo beta de pagos (solo efectivo) |

---

## Estructura del Proyecto

```
histora-back/
├── src/
│   ├── auth/           # Autenticación, OAuth, recuperación contraseña
│   ├── users/          # Gestión de usuarios
│   ├── nurses/         # Perfiles y verificación de enfermeras
│   ├── patients/       # Perfiles de pacientes (pendiente)
│   ├── service-requests/ # Solicitudes de servicio
│   ├── payments/       # Procesamiento de pagos (Culqi)
│   ├── notifications/  # Notificaciones (email, push)
│   ├── uploads/        # Subida de archivos (Cloudinary)
│   └── admin/          # Panel de administración
├── docs/               # Esta documentación
└── test/               # Tests
```

## Variables de Entorno Requeridas

```env
# Base de datos
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=noreply@historahealth.com

# Cloudinary (imágenes)
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# RENIEC (opcional)
RENIEC_API_TOKEN=xxxxx

# URLs
FRONTEND_URL=https://app.historahealth.com
CARE_FRONTEND_URL=https://care.historahealth.com

# Pagos (Culqi)
CULQI_PUBLIC_KEY=pk_test_xxxxx
CULQI_SECRET_KEY=sk_test_xxxxx
```

## Despliegue

El backend se despliega automáticamente en **Railway** con cada push a `main`.

```bash
# NO ejecutar manualmente:
# railway up

# Solo hacer:
git push origin main
```

URL de producción: `https://api.historahealth.com`

## Comandos Útiles

```bash
# Desarrollo
npm run start:dev

# Build
npm run build

# Tests
npm run test
npm run test:e2e

# Lint
npm run lint
```

## Contacto

- **Desarrollo:** soporte@historahealth.com
- **Repositorio:** https://github.com/rachcampitos/histora
