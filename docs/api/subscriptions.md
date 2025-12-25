# API: Suscripciones

Base URL: `/subscriptions`

## Endpoints Públicos

### GET /subscriptions/plans

Lista todos los planes disponibles.

**Autenticación:** No requerida

**Response (200):**
```json
[
  {
    "_id": "...",
    "name": "basic",
    "displayName": "Plan Básico",
    "priceMonthly": 2900,
    "priceSemiannual": 15660,
    "priceAnnual": 27840,
    "maxDoctors": 1,
    "maxPatients": 100,
    "features": [
      "1 médico",
      "Hasta 100 pacientes",
      "Citas ilimitadas",
      "Historia clínica básica"
    ]
  },
  {
    "_id": "...",
    "name": "professional",
    "displayName": "Plan Profesional",
    "priceMonthly": 5900,
    "priceSemiannual": 31860,
    "priceAnnual": 56640,
    "maxDoctors": 3,
    "maxPatients": 500,
    "features": [
      "Hasta 3 médicos",
      "Hasta 500 pacientes",
      "Portal de pacientes",
      "Reportes avanzados"
    ]
  },
  {
    "_id": "...",
    "name": "clinic",
    "displayName": "Plan Clínica",
    "priceMonthly": 9900,
    "priceSemiannual": 53460,
    "priceAnnual": 95040,
    "maxDoctors": 10,
    "maxPatients": -1,
    "features": [
      "Hasta 10 médicos",
      "Pacientes ilimitados",
      "Todas las funciones",
      "Soporte prioritario"
    ]
  }
]
```

*Nota: Precios en centavos. -1 significa ilimitado.*

---

## Endpoints Protegidos

**Autenticación:** Requerida (JWT)

### GET /subscriptions/current

Obtiene la suscripción actual de la clínica.

**Roles permitidos:** `clinic_owner`, `clinic_doctor`, `clinic_staff`

**Response (200):**
```json
{
  "_id": "...",
  "clinicId": "...",
  "plan": "professional",
  "billingCycle": "monthly",
  "status": "active",
  "currentPeriodStart": "2025-01-01T00:00:00.000Z",
  "currentPeriodEnd": "2025-02-01T00:00:00.000Z",
  "trialEndsAt": null
}
```

**Estados posibles:**
- `trial` - Período de prueba (14 días)
- `active` - Activa
- `past_due` - Pago pendiente
- `cancelled` - Cancelada
- `expired` - Expirada

---

### GET /subscriptions/usage

Obtiene el uso actual vs límites del plan.

**Roles permitidos:** `clinic_owner`

**Response (200):**
```json
{
  "plan": "professional",
  "doctors": {
    "current": 2,
    "limit": 3
  },
  "patients": {
    "current": 156,
    "limit": 500
  }
}
```

---

### POST /subscriptions/upgrade

Cambia a un plan superior.

**Roles permitidos:** `clinic_owner`

**Body:**
```json
{
  "plan": "clinic",
  "billingCycle": "annual"
}
```

**Response (200):**
```json
{
  "_id": "...",
  "plan": "clinic",
  "billingCycle": "annual",
  "status": "active",
  ...
}
```

---

### POST /subscriptions/cancel

Cancela la suscripción.

**Roles permitidos:** `clinic_owner`

**Body:**
```json
{
  "reason": "Ya no necesito el servicio"
}
```

**Response (200):**
```json
{
  "_id": "...",
  "status": "cancelled",
  "cancelledAt": "2025-01-15T10:30:00.000Z",
  "cancellationReason": "Ya no necesito el servicio"
}
```

*Nota: La suscripción sigue activa hasta el fin del período actual.*

---

## Trial

Al registrarse, cada clínica recibe automáticamente:
- 14 días de prueba gratis
- Acceso al plan Professional
- Sin tarjeta de crédito requerida

```json
{
  "status": "trial",
  "plan": "professional",
  "trialEndsAt": "2025-01-29T00:00:00.000Z"
}
```
