# API: Citas

Base URL: `/appointments`

**Autenticación:** Requerida (JWT)
**Roles permitidos:** `clinic_owner`, `clinic_doctor`, `clinic_staff`

## Endpoints

### POST /appointments

Crea una nueva cita.

**Body:**
```json
{
  "patientId": "507f1f77bcf86cd799439011",
  "doctorId": "507f1f77bcf86cd799439012",
  "scheduledDate": "2025-01-20",
  "startTime": "10:00",
  "endTime": "10:30",
  "reasonForVisit": "Consulta de control"
}
```

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439020",
  "clinicId": "507f1f77bcf86cd799439001",
  "patientId": "507f1f77bcf86cd799439011",
  "doctorId": "507f1f77bcf86cd799439012",
  "scheduledDate": "2025-01-20T00:00:00.000Z",
  "startTime": "10:00",
  "endTime": "10:30",
  "status": "scheduled",
  "bookedBy": "clinic"
}
```

**Errores:**
- `400 Bad Request` - Horario no disponible

---

### GET /appointments

Lista citas con filtros opcionales.

**Query params:**
- `doctorId` - Filtrar por doctor
- `patientId` - Filtrar por paciente
- `status` - Filtrar por estado
- `startDate` - Fecha inicio (YYYY-MM-DD)
- `endDate` - Fecha fin (YYYY-MM-DD)

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439020",
    "scheduledDate": "2025-01-20T00:00:00.000Z",
    "startTime": "10:00",
    "endTime": "10:30",
    "status": "scheduled",
    "patientId": {
      "_id": "...",
      "firstName": "María",
      "lastName": "López"
    },
    "doctorId": {
      "_id": "...",
      "firstName": "Carlos",
      "lastName": "Rodríguez",
      "specialty": "Cardiología"
    }
  }
]
```

---

### GET /appointments/today

Lista citas del día actual.

**Query params:**
- `doctorId` - Filtrar por doctor (opcional)

**Response (200):**
```json
[
  {
    "_id": "...",
    "startTime": "09:00",
    "endTime": "09:30",
    "status": "confirmed",
    "patientId": {...},
    "doctorId": {...}
  }
]
```

---

### GET /appointments/doctor/:doctorId

Lista citas de un doctor específico.

**Query params:**
- `date` - Fecha específica (YYYY-MM-DD)

---

### GET /appointments/patient/:patientId

Lista citas de un paciente específico.

---

### GET /appointments/available/:doctorId

Obtiene horarios disponibles de un doctor.

**Query params:**
- `date` - Fecha (YYYY-MM-DD) **requerido**

**Response (200):**
```json
[
  { "startTime": "09:00", "endTime": "09:30" },
  { "startTime": "09:30", "endTime": "10:00" },
  { "startTime": "10:30", "endTime": "11:00" },
  { "startTime": "11:00", "endTime": "11:30" }
]
```

*Nota: Excluye horarios ya reservados y hora de almuerzo (13:00-14:00).*

---

### GET /appointments/count

Retorna conteo de citas.

**Query params:**
- `status` - Filtrar por estado (opcional)

**Response (200):**
```json
{
  "count": 15
}
```

---

### GET /appointments/:id

Obtiene una cita por ID.

---

### PATCH /appointments/:id

Actualiza una cita.

**Body:**
```json
{
  "scheduledDate": "2025-01-21",
  "startTime": "11:00",
  "endTime": "11:30"
}
```

---

### PATCH /appointments/:id/status

Cambia el estado de una cita.

**Body:**
```json
{
  "status": "confirmed"
}
```

**Estados válidos:**
- `scheduled` - Agendada
- `confirmed` - Confirmada
- `in_progress` - En progreso
- `completed` - Completada
- `cancelled` - Cancelada
- `no_show` - No asistió

---

### PATCH /appointments/:id/cancel

Cancela una cita.

**Body:**
```json
{
  "cancellationReason": "Paciente solicitó reprogramar"
}
```

---

### DELETE /appointments/:id

Elimina una cita (soft delete).

**Roles permitidos:** `clinic_owner`

---

## Endpoints Públicos

Base URL: `/public/appointments`

### GET /public/appointments/available/:doctorId

Obtiene horarios disponibles (para reserva de pacientes).

**Query params:**
- `date` - Fecha (YYYY-MM-DD)
- `clinicId` - ID de la clínica

**Response (200):**
```json
[
  { "startTime": "09:00", "endTime": "09:30" },
  { "startTime": "09:30", "endTime": "10:00" }
]
```
