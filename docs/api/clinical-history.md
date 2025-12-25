# API: Historia Clínica

Base URL: `/clinical-history`

**Autenticación:** Requerida (JWT)
**Roles permitidos:** `clinic_owner`, `clinic_doctor`

## Endpoints

### POST /clinical-history

Crea una nueva entrada en la historia clínica.

**Body:**
```json
{
  "patientId": "507f1f77bcf86cd799439011",
  "doctorId": "507f1f77bcf86cd799439012",
  "date": "2025-01-15",
  "notes": "Paciente refiere dolor de cabeza...",
  "diagnosis": "Migraña tensional",
  "treatment": "Ibuprofeno 400mg cada 8 horas por 3 días"
}
```

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439030",
  "clinicId": "507f1f77bcf86cd799439001",
  "patientId": "507f1f77bcf86cd799439011",
  "doctorId": "507f1f77bcf86cd799439012",
  "date": "2025-01-15T00:00:00.000Z",
  "notes": "Paciente refiere dolor de cabeza...",
  "diagnosis": "Migraña tensional",
  "treatment": "Ibuprofeno 400mg cada 8 horas por 3 días",
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

---

### GET /clinical-history

Lista todas las entradas de historia clínica.

**Query params:**
- `patientId` - Filtrar por paciente
- `doctorId` - Filtrar por doctor

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439030",
    "patientId": {
      "_id": "...",
      "firstName": "María",
      "lastName": "López"
    },
    "doctorId": {
      "_id": "...",
      "firstName": "Carlos",
      "lastName": "Rodríguez"
    },
    "date": "2025-01-15T00:00:00.000Z",
    "diagnosis": "Migraña tensional"
  }
]
```

---

### GET /clinical-history/patient/:patientId

Obtiene toda la historia clínica de un paciente.

**Response (200):**
```json
[
  {
    "_id": "...",
    "date": "2025-01-15T00:00:00.000Z",
    "notes": "...",
    "diagnosis": "Migraña tensional",
    "treatment": "...",
    "doctorId": {
      "firstName": "Carlos",
      "lastName": "Rodríguez",
      "specialty": "Medicina General"
    }
  },
  {
    "_id": "...",
    "date": "2024-12-01T00:00:00.000Z",
    "notes": "...",
    "diagnosis": "Resfriado común",
    "treatment": "..."
  }
]
```

*Ordenado por fecha descendente (más reciente primero).*

---

### GET /clinical-history/:id

Obtiene una entrada específica.

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439030",
  "patientId": {...},
  "doctorId": {...},
  "date": "2025-01-15T00:00:00.000Z",
  "notes": "Paciente refiere dolor de cabeza persistente desde hace 3 días...",
  "diagnosis": "Migraña tensional",
  "treatment": "Ibuprofeno 400mg cada 8 horas por 3 días. Reposo.",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

---

### PATCH /clinical-history/:id

Actualiza una entrada.

**Body:**
```json
{
  "notes": "Actualización: Paciente mejoró con el tratamiento",
  "treatment": "Continuar con ibuprofeno 2 días más"
}
```

---

### DELETE /clinical-history/:id

Elimina una entrada (soft delete).

**Roles permitidos:** `clinic_owner`

---

## Próximas Funcionalidades (Sprint 3)

- Signos vitales asociados
- Archivos adjuntos (laboratorios, imágenes)
- Recetas médicas
- Códigos CIE-10 para diagnósticos
