# Histora - Documentación

Sistema SaaS para gestión de consultorios médicos independientes.

## Descripción

**Histora** es una plataforma donde médicos pueden:
- Comprar suscripciones para sus consultorios
- Invitar colegas a trabajar en su consultorio
- Gestionar pacientes, citas y consultas
- Ofrecer un portal para pacientes con acceso a su historial
- Aparecer en un directorio público con reseñas

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
| Frontend | Angular 20 + Ionic 8 |
| Testing | Jest (275 tests) |
| Pagos | Culqi (Yape, tarjetas) |
| Notificaciones | Email, SMS, WhatsApp, Push |
| Almacenamiento | Cloudinary |

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
