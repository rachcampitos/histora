# Guía de la API de Histora

## Introducción

Histora es una plataforma SaaS para gestión de consultorios médicos. Esta guía explica cómo usar la API.

---

## Acceder a la Documentación Interactiva (Swagger)

Con el servidor corriendo, visita:

```
http://localhost:3000/docs
```

Swagger te permite:
- Ver todos los endpoints disponibles
- Probar las APIs directamente desde el navegador
- Ver qué datos espera y devuelve cada endpoint

---

## Autenticación

La API usa **JWT (JSON Web Tokens)** para autenticación. Necesitas un token para acceder a la mayoría de endpoints.

### Obtener un Token

#### Opción 1: Registrar nuevo usuario

```http
POST /auth/register
Content-Type: application/json

{
  "email": "doctor@ejemplo.com",
  "password": "tuContraseña123",
  "firstName": "Juan",
  "lastName": "Pérez",
  "clinicName": "Consultorio Pérez"
}
```

#### Opción 2: Iniciar sesión (si ya tienes cuenta)

```http
POST /auth/login
Content-Type: application/json

{
  "email": "doctor@ejemplo.com",
  "password": "tuContraseña123"
}
```

#### Respuesta

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "doctor@ejemplo.com",
    "firstName": "Juan",
    "role": "clinic_owner"
  }
}
```

### Usar el Token

En cada request, incluye el header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Usar el Token en Swagger

1. Click en **"Authorize"** (botón con candado arriba a la derecha)
2. Pega tu `access_token` en el campo
3. Click **"Authorize"** → **"Close"**
4. Ahora todos los endpoints protegidos funcionarán

---

## Endpoints Principales

### Pacientes (`/patients`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/patients` | Listar pacientes |
| POST | `/patients` | Crear paciente |
| GET | `/patients/:id` | Obtener paciente |
| PATCH | `/patients/:id` | Actualizar paciente |
| DELETE | `/patients/:id` | Eliminar paciente |
| GET | `/patients/count` | Contar pacientes |
| GET | `/patients/search?q=` | Buscar pacientes |

#### Ejemplo: Crear paciente

```http
POST /patients
Authorization: Bearer {tu_token}
Content-Type: application/json

{
  "firstName": "María",
  "lastName": "García",
  "email": "maria@ejemplo.com",
  "phone": "+52 555 123 4567",
  "dateOfBirth": "1990-05-15",
  "gender": "female"
}
```

---

### Citas (`/appointments`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/appointments` | Listar citas |
| POST | `/appointments` | Crear cita |
| GET | `/appointments/:id` | Obtener cita |
| PATCH | `/appointments/:id` | Actualizar cita |
| DELETE | `/appointments/:id` | Cancelar cita |
| GET | `/appointments/today` | Citas de hoy |
| GET | `/appointments/count` | Contar citas |

#### Estados de cita

- `scheduled` - Agendada
- `confirmed` - Confirmada
- `in_progress` - En curso
- `completed` - Completada
- `cancelled` - Cancelada
- `no_show` - No se presentó

#### Ejemplo: Crear cita

```http
POST /appointments
Authorization: Bearer {tu_token}
Content-Type: application/json

{
  "patientId": "id_del_paciente",
  "doctorId": "id_del_doctor",
  "scheduledDate": "2025-01-15",
  "startTime": "09:00",
  "endTime": "09:30",
  "reasonForVisit": "Consulta general"
}
```

---

### Consultas Médicas (`/consultations`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/consultations` | Listar consultas |
| POST | `/consultations` | Crear consulta |
| GET | `/consultations/:id` | Obtener consulta |
| PATCH | `/consultations/:id` | Actualizar consulta |
| PATCH | `/consultations/:id/complete` | Completar consulta |
| POST | `/consultations/from-appointment/:id` | Crear desde cita |

#### Estados de consulta

- `scheduled` - Programada
- `in_progress` - En progreso
- `completed` - Completada
- `cancelled` - Cancelada

---

### Historial Clínico (`/clinical-history`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/clinical-history` | Listar historiales |
| POST | `/clinical-history` | Crear historial |
| GET | `/clinical-history/:id` | Obtener historial |
| GET | `/clinical-history/patient/:patientId` | Historial de paciente |
| POST | `/clinical-history/:id/allergies` | Agregar alergia |
| POST | `/clinical-history/:id/conditions` | Agregar condición crónica |

---

### Signos Vitales (`/vitals`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/vitals` | Listar signos vitales |
| POST | `/vitals` | Registrar signos vitales |
| GET | `/vitals/patient/:patientId` | Vitales de paciente |
| GET | `/vitals/patient/:patientId/latest` | Últimos vitales |

#### Ejemplo: Registrar signos vitales

```http
POST /vitals
Authorization: Bearer {tu_token}
Content-Type: application/json

{
  "patientId": "id_del_paciente",
  "temperature": 36.5,
  "heartRate": 72,
  "systolicBP": 120,
  "diastolicBP": 80,
  "weight": 70,
  "height": 170
}
```

---

### Doctores (`/doctors`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/doctors` | Listar doctores |
| POST | `/doctors` | Crear doctor |
| GET | `/doctors/:id` | Obtener doctor |
| GET | `/doctors/count` | Contar doctores |

---

## Roles de Usuario

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `platform_admin` | Administrador de Histora | Todo |
| `clinic_owner` | Dueño del consultorio | Gestión completa de su clínica |
| `clinic_doctor` | Médico del consultorio | Sus pacientes y consultas |
| `clinic_staff` | Personal administrativo | Agendar citas, registrar pacientes |
| `patient` | Paciente | Portal del paciente |

---

## Códigos de Respuesta

| Código | Significado |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token inválido o faltante |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Recurso ya existe (ej: email duplicado) |
| 500 | Server Error - Error interno |

---

## Paginación

Los endpoints de listado soportan paginación:

```http
GET /patients?limit=20&offset=0
```

Respuesta:
```json
{
  "data": [...],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

---

## Filtros Comunes

### Por fecha
```http
GET /appointments?startDate=2025-01-01&endDate=2025-01-31
```

### Por estado
```http
GET /consultations?status=in_progress
```

### Por paciente
```http
GET /appointments?patientId=id_del_paciente
```

### Por doctor
```http
GET /consultations?doctorId=id_del_doctor
```

---

## Endpoints Públicos (Sin Token)

Estos endpoints no requieren autenticación:

| Endpoint | Descripción |
|----------|-------------|
| `POST /auth/register` | Registro |
| `POST /auth/login` | Login |
| `GET /public/doctors` | Directorio público de médicos |
| `GET /public/doctors/:id` | Perfil público de médico |
| `GET /subscriptions/plans` | Planes disponibles |

---

## Ejemplos con cURL

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@test.com","password":"123456"}'
```

### Listar pacientes
```bash
curl http://localhost:3000/patients \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Crear paciente
```bash
curl -X POST http://localhost:3000/patients \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "María",
    "lastName": "García",
    "email": "maria@test.com",
    "dateOfBirth": "1990-01-15",
    "gender": "female"
  }'
```

---

## Soporte

Si tienes dudas sobre la API, revisa la documentación interactiva en `/docs` o contacta al equipo de desarrollo.
