# API: Autenticación

Base URL: `/auth`

## Endpoints

### POST /auth/register

Registra un nuevo dueño de clínica con su consultorio.

**Body:**
```json
{
  "email": "doctor@email.com",
  "password": "securePassword123",
  "firstName": "Juan",
  "lastName": "García",
  "phone": "+51987654321",
  "clinicName": "Consultorio García"
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "doctor@email.com",
    "firstName": "Juan",
    "lastName": "García",
    "role": "clinic_owner",
    "clinicId": "507f1f77bcf86cd799439012"
  }
}
```

---

### POST /auth/register/patient

Registra un nuevo paciente.

**Body:**
```json
{
  "email": "paciente@email.com",
  "password": "securePassword123",
  "firstName": "María",
  "lastName": "López"
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439013",
    "email": "paciente@email.com",
    "firstName": "María",
    "lastName": "López",
    "role": "patient"
  }
}
```

---

### POST /auth/login

Inicia sesión y obtiene token JWT.

**Body:**
```json
{
  "email": "doctor@email.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "doctor@email.com",
    "firstName": "Juan",
    "lastName": "García",
    "role": "clinic_owner",
    "clinicId": "507f1f77bcf86cd799439012"
  }
}
```

**Errores:**
- `401 Unauthorized` - Credenciales inválidas

---

### GET /auth/profile

Obtiene el perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "doctor@email.com",
  "firstName": "Juan",
  "lastName": "García",
  "role": "clinic_owner",
  "clinicId": "507f1f77bcf86cd799439012",
  "isEmailVerified": false
}
```

---

## Uso del Token

Incluir en todas las requests protegidas:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Roles y Permisos

| Rol | Descripción |
|-----|-------------|
| `platform_admin` | Acceso total al sistema |
| `clinic_owner` | Gestión completa de su clínica |
| `clinic_doctor` | Acceso a sus pacientes y citas |
| `clinic_staff` | Agendar citas, registrar pacientes |
| `patient` | Portal de paciente |
