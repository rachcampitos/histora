# API: Doctores

Base URL: `/doctors`

**Autenticación:** Requerida (JWT)

## Endpoints Protegidos

### POST /doctors

Crea un nuevo doctor en la clínica.

**Roles permitidos:** `clinic_owner`

**Body:**
```json
{
  "userId": "507f1f77bcf86cd799439099",
  "firstName": "Carlos",
  "lastName": "Rodríguez",
  "specialty": "Cardiología",
  "subspecialties": ["Ecocardiografía"],
  "licenseNumber": "CMP-12345",
  "phone": "+51987654321",
  "email": "carlos@email.com",
  "bio": "Cardiólogo con 10 años de experiencia...",
  "education": [
    {
      "institution": "Universidad Nacional",
      "degree": "Medicina",
      "year": 2010,
      "country": "Perú"
    }
  ],
  "isPublicProfile": true
}
```

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "clinicId": "507f1f77bcf86cd799439012",
  "firstName": "Carlos",
  ...
}
```

---

### GET /doctors

Lista todos los doctores de la clínica.

**Roles permitidos:** `clinic_owner`, `clinic_doctor`, `clinic_staff`

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "Carlos",
    "lastName": "Rodríguez",
    "specialty": "Cardiología",
    "averageRating": 4.5,
    "totalReviews": 23
  }
]
```

---

### GET /doctors/count

Retorna el conteo de doctores activos.

**Roles permitidos:** `clinic_owner`

**Response (200):**
```json
{
  "count": 5
}
```

---

### GET /doctors/:id

Obtiene un doctor por ID.

**Roles permitidos:** `clinic_owner`, `clinic_doctor`, `clinic_staff`

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "firstName": "Carlos",
  "lastName": "Rodríguez",
  "specialty": "Cardiología",
  ...
}
```

---

### PATCH /doctors/:id

Actualiza un doctor.

**Roles permitidos:** `clinic_owner`, `clinic_doctor`

**Body:**
```json
{
  "bio": "Actualizado...",
  "isPublicProfile": true
}
```

---

### DELETE /doctors/:id

Elimina un doctor (soft delete).

**Roles permitidos:** `clinic_owner`

---

### PATCH /doctors/:id/restore

Restaura un doctor eliminado.

**Roles permitidos:** `clinic_owner`

---

## Endpoints Públicos

Base URL: `/public/doctors`

**Autenticación:** No requerida

### GET /public/doctors

Lista doctores con perfil público.

**Query params:**
- `specialty` - Filtrar por especialidad
- `minRating` - Rating mínimo (1-5)

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "Carlos",
    "lastName": "Rodríguez",
    "specialty": "Cardiología",
    "bio": "...",
    "averageRating": 4.5,
    "totalReviews": 23
  }
]
```

*Nota: No incluye email, phone ni userId por privacidad.*

---

### GET /public/doctors/:id

Obtiene perfil público de un doctor.

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "firstName": "Carlos",
  "lastName": "Rodríguez",
  "specialty": "Cardiología",
  "subspecialties": ["Ecocardiografía"],
  "bio": "...",
  "education": [...],
  "averageRating": 4.5,
  "totalReviews": 23
}
```
