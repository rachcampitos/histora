# Histora - Documentación

Sistema SaaS para gestión de consultorios médicos independientes.

## URLs de Producción

| Servicio | URL |
|----------|-----|
| Frontend | https://app.historahealth.com |
| Backend API | https://api.historahealth.com |
| Swagger (dev) | http://localhost:3000/docs |

## Descripción

**Histora** es una plataforma donde médicos pueden:
- Comprar suscripciones para sus consultorios
- Invitar colegas a trabajar en su consultorio
- Gestionar pacientes, citas y consultas
- Ofrecer un portal para pacientes con acceso a su historial
- Aparecer en un directorio público con reseñas
- Recibir notificaciones por email y WhatsApp
- Agendar citas via chatbot de WhatsApp

## Índice

### Arquitectura
- [Arquitectura del Sistema](./architecture.md) - Visión general de la arquitectura
- [Modelos de Datos](./data-models.md) - Schemas y relaciones

### API Reference
- **[Guía Completa de la API](./api-guide.md)** - Cómo usar la API (START HERE)
- [Documentación Interactiva (Swagger)](http://localhost:3000/docs) - Probar endpoints en vivo

#### Endpoints por módulo:
- [Autenticación](./api/auth.md) - Login, registro, JWT
- [Pacientes](./api/patients.md) - CRUD de pacientes
- [Doctores](./api/doctors.md) - CRUD de doctores
- [Citas](./api/appointments.md) - Gestión de citas
- [Suscripciones](./api/subscriptions.md) - Planes y suscripciones
- [Historia Clínica](./api/clinical-history.md) - Historiales médicos

### Guías
- [Getting Started](./guides/getting-started.md) - Configuración del proyecto
- [Multi-tenancy](./guides/multi-tenancy.md) - Aislamiento de datos por clínica
- [Autenticación](./guides/authentication.md) - Flujo de autenticación y roles

### Changelog
- [CHANGELOG](./CHANGELOG.md) - Historial de versiones

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Backend | NestJS 11 |
| Base de datos | MongoDB (Mongoose 8) |
| Autenticación | JWT + Passport |
| Frontend | Angular 20 + Material |
| Testing | Jest (280+ tests) |
| Pagos | Culqi (Yape, tarjetas) |
| Notificaciones | SendGrid, WhatsApp |
| Almacenamiento | Cloudinary |
| Seguridad | Helmet, Throttler |
| Hosting | Railway |
| Dominio | Namecheap |

## Módulos del Sistema

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| Auth | ✅ | Autenticación y autorización |
| Users | ✅ | Gestión de usuarios |
| Clinics | ✅ | Consultorios/tenants |
| Subscriptions | ✅ | Planes y suscripciones |
| Patients | ✅ | Gestión de pacientes |
| Doctors | ✅ | Gestión de doctores |
| Appointments | ✅ | Citas médicas |
| Clinical History | ✅ | Historiales clínicos |
| Consultations | ✅ | Consultas/atenciones |
| Vitals | ✅ | Signos vitales |
| Reviews | ✅ | Reseñas de pacientes |
| Patient Portal | ✅ | Portal del paciente |
| Public Directory | ✅ | Directorio público de médicos |
| Notifications | ✅ | Email, SMS, WhatsApp, Push |
| Payments | ✅ | Yape, Plin, tarjetas (Culqi) |
| Uploads | ✅ | Fotos de perfil (Cloudinary) |
| Chatbot | ✅ | Bot WhatsApp para citas |

## Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| `platform_admin` | Administrador de Histora |
| `clinic_owner` | Dueño del consultorio (compra suscripción) |
| `clinic_doctor` | Médico invitado al consultorio |
| `clinic_staff` | Recepcionista/asistente |
| `patient` | Paciente con acceso al portal |

## Planes de Suscripción

| Plan | Doctores | Pacientes | Precio |
|------|----------|-----------|--------|
| Basic | 1 | 100 | $29/mes |
| Professional | 3 | 500 | $59/mes |
| Clinic | 10 | Ilimitado | $99/mes |

## Seguridad

| Medida | Descripción |
|--------|-------------|
| Helmet.js | Headers HTTP de seguridad |
| Rate Limiting | 10/s, 100/min, 1000/h |
| JWT | Tokens de corta duración |
| Refresh Tokens | Rotación automática |
| CORS | Solo dominios autorizados |
| Validation | class-validator en DTOs |

## Despliegue

El proyecto está desplegado en Railway:

- **Backend**: Dockerfile multi-stage, puerto dinámico
- **Frontend**: nginx con SPA routing
- **DNS**: CNAME records en Namecheap
