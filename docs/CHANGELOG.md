# Changelog

Historial de cambios del proyecto Histora.

## [v0.2.0] - 2025-12-25

### Sprint 2: Multi-tenancy, Subscriptions & Appointments

#### Nuevos Módulos

- **Subscriptions**
  - Planes: basic, professional, clinic
  - Gestión de suscripciones con trial de 14 días
  - Estados: trial, active, past_due, cancelled, expired

- **Appointments**
  - Gestión completa de citas médicas
  - Validación de disponibilidad de horarios
  - Cálculo automático de slots disponibles
  - Estados: scheduled, confirmed, in_progress, completed, cancelled, no_show

#### Multi-tenancy

- `clinicId` en schemas Patient y Doctor
- Aislamiento de datos por clínica
- `ClinicAccessGuard` para seguridad

#### Auth Guards & Decorators

- `JwtAuthGuard` - autenticación JWT
- `RolesGuard` - autorización por roles
- `@CurrentUser()`, `@Roles()`, `@Public()` decorators

#### Actualizaciones

- **Patient**:
  - Agregado: address, allergies, chronicConditions, bloodType
  - Implementado soft delete
  - Búsqueda por múltiples campos

- **Doctor**:
  - Agregado: perfil público, education, ratings
  - Directorio público (`/public/doctors`)
  - Campos para reviews

#### Tests

- 114 tests pasando
- 12 test suites

---

## [v0.1.0] - 2025-12-24

### Sprint 1: Fundamentos

#### Nuevos Módulos

- **Auth**
  - Registro de clinic_owner con creación de clínica
  - Registro de pacientes
  - Login con JWT
  - Perfil de usuario

- **Users**
  - Schema con roles: platform_admin, clinic_owner, clinic_doctor, clinic_staff, patient
  - CRUD básico
  - Soft delete

- **Clinics**
  - Schema con address, schedule, specialties
  - CRUD básico
  - Relación con owner

#### Mejoras

- Mock factory para testing de Mongoose
- Tests arreglados para todos los servicios
- Configuración de JWT y Passport

#### Tests

- 73 tests pasando

---

## [v0.0.1] - 2025-12-23

### Inicio del Proyecto

- Estructura inicial del monorepo
- Backend NestJS 11
- Frontend Angular 19 (placeholder)
- Módulos básicos: Patients, Doctors, Clinical History
- Conexión a MongoDB Atlas
- Configuración de Jest para testing

---

## Próximos Releases

### v0.3.0 - Sprint 3 (Planificado)

- [ ] Módulo Consultations
- [ ] Módulo Vitals
- [ ] Actualizar Clinical History con más campos
- [ ] Recetas médicas

### v0.4.0 - Sprint 4 (Planificado)

- [ ] Portal de Pacientes
- [ ] Módulo Reviews
- [ ] Directorio público mejorado

### v0.5.0 - Sprint 5 (Planificado)

- [ ] Integración Stripe
- [ ] Notificaciones (email/SMS)
- [ ] Archivos adjuntos (S3)
