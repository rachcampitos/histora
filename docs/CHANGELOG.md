# Changelog

Historial de cambios del proyecto Histora.

## [v0.12.0] - 2026-01-29

### Onboarding y Perfil de Enfermeras (NurseLite)

#### Onboarding de Enfermeras
- **Flujo de 4 pantallas**: Welcome, Payment Model, Payment Setup, Plans
- **Modelo P2P explicado**: Los pacientes pagan directamente a las enfermeras
- **Metodos de pago**: Configuracion de Yape, Plin y Efectivo
- **Planes de suscripcion**: Basico (gratis), Pro (S/29), Premium (S/99)
- **Estado persistente**: localStorage para trackear completitud

#### Profile Checklist Component
- **Checklist gamificado**: Muestra progreso de completitud del perfil
- **4 items trackeados**: Metodos de pago, Servicios, Disponibilidad, Biografia
- **UI minimizable**: Se puede colapsar y se oculta al completar todo
- **Integracion con dashboard**: Visible despues del banner de verificacion

#### Banner Contextual de Pagos
- **Deteccion inteligente**: Aparece cuando no hay Yape/Plin configurado
- **Scroll automatico**: Navega a la seccion de metodos de pago
- **Soporte dark mode**: Colores adaptados al tema NurseLite

#### Mejoras de UX
- Redireccion automatica al onboarding si no esta completo
- Dark mode completo en todos los componentes nuevos
- Gradientes NurseLite (teal/navy) consistentes

---

## [v0.11.0] - 2026-01-06

### Seguridad y Documentación

#### Seguridad
- **Helmet.js**: Headers HTTP de seguridad (CSP, XSS Protection, HSTS)
- **Rate Limiting**: @nestjs/throttler con 3 niveles:
  - Short: 10 requests/segundo
  - Medium: 100 requests/minuto
  - Long: 1000 requests/hora
- **ThrottlerGuard**: Habilitado globalmente via APP_GUARD
- **SkipThrottle**: Webhook de WhatsApp excluido del rate limiting

#### Documentación
- README.md actualizado con información completa
- URLs de producción documentadas
- Guías de despliegue actualizadas

---

## [v0.10.0] - 2026-01-06

### Notificaciones en Tiempo Real

#### Notificaciones para Médicos
- `NEW_APPOINTMENT_BOOKED`: Cuando paciente agenda cita
- `APPOINTMENT_CANCELLED_BY_PATIENT`: Cuando paciente cancela
- `UPCOMING_APPOINTMENT_REMINDER`: Recordatorios programados
- `NEW_PATIENT_REVIEW`: Cuando paciente deja reseña

#### Frontend
- NotificationsService con polling cada 30 segundos
- HeaderComponent integrado con API de notificaciones
- Marcar como leída individual y masivo
- Navegación inteligente desde notificaciones

#### Bugfix
- Avatar incluido en AuthResponse para persistencia de foto de perfil

---

## [v0.9.0] - 2026-01-06

### Perfil de Médico con CV

#### Backend
- Doctor Schema: subdocumentos Experience, Certification, Skill
- Campos: cvUrl, cvPublicId, cvFormat, consultationFee, currency, address
- Endpoints GET/PATCH /doctors/me
- Uploads: POST/DELETE /uploads/doctor/cv (PDF/DOCX)

#### Frontend
- `/doctor/profile`: Perfil editable con FormArrays
- Subida de CV a Cloudinary (PDF/DOCX, máx 5MB)
- `/patient/doctors`: Lista con filtros y paginación
- `/patient/doctors/:id`: Vista de perfil para pacientes
- CV viewer embebido con Google Docs Viewer

---

## [v0.8.0] - 2026-01-06

### Despliegue en Producción

#### Railway
- Backend desplegado en api.historahealth.com
- Frontend desplegado en app.historahealth.com
- Configuración con railway.toml para monorepo

#### Docker
- Dockerfile para backend con multi-stage build
- Dockerfile para frontend con nginx
- nginx.conf para SPA routing

#### DNS
- Dominio historahealth.com en Namecheap
- CNAME records para api y app

---

## [v0.7.0] - 2026-01-06

### Chatbot WhatsApp

#### Módulo Chatbot
- WhatsApp Business API integration
- Webhook verification endpoint
- Message processing async

#### Conversational Flow
- Menú principal interactivo
- Consulta de médicos disponibles
- Agendamiento de citas
- Consulta de citas existentes
- Cancelación de citas

---

## [v0.6.0] - 2026-01-06

### Recordatorios Automáticos

#### Scheduler
- @nestjs/schedule para cron jobs
- ReminderSchedulerService

#### Recordatorios
- 24 horas antes (cada hora)
- 1 hora antes (cada 15 minutos)
- Campo `reminders` en Appointment schema

---

## [v0.5.0] - 2025-12-27

### Frontend Completo

#### Angular 20 con Material
- Dashboard con estadísticas
- Gestión de pacientes
- Calendario de citas (FullCalendar)
- Historiales clínicos
- Perfil de usuario

#### UI/UX
- Sistema de temas claro/oscuro
- Sidebar colapsable
- Responsive design
- i18n (ES/EN)

---

## [v0.4.0] - 2025-12-26

### Notificaciones y Pagos

#### Notificaciones
- Email (SendGrid/SES/SMTP)
- SMS (Twilio)
- WhatsApp (Twilio)
- Push notifications (Firebase)
- Preferences por usuario

#### Pagos
- Integración Culqi
- Yape, Plin, tarjetas
- Historial de transacciones

#### Uploads
- Cloudinary integration
- Fotos de perfil
- Documentos médicos

---

## [v0.3.0] - 2025-12-26

### Consultas y Portal del Paciente

#### Consultations
- Notas clínicas
- Diagnósticos
- Prescripciones
- Signos vitales

#### Patient Portal
- Acceso con credenciales
- Historial de consultas
- Próximas citas
- Resultados de exámenes

#### Reviews
- Reseñas de pacientes
- Sistema de rating 1-5

---

## [v0.2.0] - 2025-12-25

### Multi-tenancy y Citas

#### Subscriptions
- Planes: basic, professional, clinic
- Trial de 14 días
- Estados: trial, active, past_due, cancelled, expired

#### Appointments
- Gestión completa de citas
- Validación de disponibilidad
- Slots automáticos
- Estados: scheduled, confirmed, in_progress, completed, cancelled, no_show

#### Multi-tenancy
- clinicId en Patient y Doctor
- Aislamiento de datos
- ClinicAccessGuard

#### Auth
- JwtAuthGuard
- RolesGuard
- @CurrentUser(), @Roles(), @Public() decorators

---

## [v0.1.0] - 2025-12-24

### Fundamentos

#### Auth
- Registro de clinic_owner
- Registro de pacientes
- Login con JWT

#### Users
- Roles: platform_admin, clinic_owner, clinic_doctor, clinic_staff, patient
- CRUD básico
- Soft delete

#### Clinics
- Schema con address, schedule, specialties
- Relación con owner

---

## [v0.0.1] - 2025-12-23

### Inicio del Proyecto

- Estructura monorepo
- Backend NestJS 11
- MongoDB Atlas
- Módulos: Patients, Doctors, Clinical History
- Configuración Jest

---

## Próximas Versiones

### v0.13.0 (Planificado)
- [ ] Google Sign-In para NurseLite
- [ ] Notificaciones push para enfermeras
- [ ] Historial de ganancias detallado

### v1.0.0 (Planificado)
- [ ] App móvil con Capacitor
- [ ] Exportación PDF de reportes
- [ ] Sistema de videoconsultas
- [ ] Integración WhatsApp Business completa
