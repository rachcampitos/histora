# API: Pacientes

Base URL: `/patients`

**Autenticación:** Requerida (JWT)
**Roles permitidos:** `clinic_owner`, `clinic_doctor`, `clinic_staff`

## Endpoints

### POST /patients

Crea un nuevo paciente.

**Body:**
```json
{
  "firstName": "María",
  "lastName": "López",
  "birthDate": "1990-05-15",
  "gender": "female",
  "documentType": "DNI",
  "documentNumber": "12345678",
  "email": "maria@email.com",
  "phone": "+51987654321",
  "address": {
    "street": "Av. Principal 123",
    "city": "Lima",
    "country": "Perú"
  },
  "allergies": ["Penicilina"],
  "chronicConditions": ["Diabetes tipo 2"],
  "bloodType": "O+"
}
```

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "clinicId": "507f1f77bcf86cd799439012",
  "firstName": "María",
  "lastName": "López",
  ...
}
```

---

### GET /patients

Lista todos los pacientes de la clínica.

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "María",
    "lastName": "López",
    "email": "maria@email.com",
    "phone": "+51987654321"
  }
]
```

---

### GET /patients/search?q={query}

Busca pacientes por nombre, email, teléfono o documento.

**Query params:**
- `q` - Texto de búsqueda

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "María",
    "lastName": "López",
    ...
  }
]
```

---

### GET /patients/count

Retorna el conteo de pacientes activos.

**Response (200):**
```json
{
  "count": 42
}
```

---

### GET /patients/:id

Obtiene un paciente por ID.

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "clinicId": "507f1f77bcf86cd799439012",
  "firstName": "María",
  "lastName": "López",
  ...
}
```

**Errores:**
- `404 Not Found` - Paciente no encontrado

---

### PATCH /patients/:id

Actualiza un paciente.

**Body:**
```json
{
  "phone": "+51999888777",
  "address": {
    "city": "Arequipa"
  }
}
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "phone": "+51999888777",
  ...
}
```

---

### DELETE /patients/:id

Elimina un paciente (soft delete).

**Response (200):**
```json
{
  "message": "Patient with ID 507f1f77bcf86cd799439011 deleted successfully"
}
```

---

### PATCH /patients/:id/restore

Restaura un paciente eliminado.

**Roles permitidos:** `clinic_owner`, `clinic_doctor`

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "isDeleted": false,
  ...
}
```
