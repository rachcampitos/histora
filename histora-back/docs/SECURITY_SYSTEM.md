# Sistema de Seguridad de Histora Care

## Tabla de Contenidos
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Verificación de Pacientes](#verificación-de-pacientes)
3. [Sistema de Direcciones](#sistema-de-direcciones)
4. [Sistema de Confianza (Trust Score)](#sistema-de-confianza-trust-score)
5. [Seguridad Durante el Servicio](#seguridad-durante-el-servicio)
6. [Sistema de Calificaciones](#sistema-de-calificaciones)
7. [Gestión de Incidentes](#gestión-de-incidentes)
8. [Flujos de Usuario](#flujos-de-usuario)
9. [APIs y Endpoints](#apis-y-endpoints)
10. [Integraciones Externas](#integraciones-externas)

---

## Resumen Ejecutivo

El Sistema de Seguridad de Histora Care está diseñado para proteger a las enfermeras que realizan servicios a domicilio. Incluye:

- **Verificación de identidad multinivel** para pacientes
- **Sistema de direcciones verificadas** con zonas de seguridad
- **Tracking GPS en tiempo real** durante servicios
- **Botón de pánico multinivel** con respuesta automática
- **Sistema de calificación bidireccional** (pacientes califican enfermeras Y viceversa)
- **Trust Score dinámico** basado en comportamiento
- **Sistema de flags y suspensión automática**

### Principios de Diseño
1. **Seguridad primero**: La enfermera siempre puede rechazar un servicio sin penalización
2. **Transparencia**: La enfermera ve toda la información del paciente antes de aceptar
3. **Respuesta rápida**: Máximo 2 minutos de respuesta a alertas de pánico
4. **Evidencia**: Todo queda registrado para auditoría

---

## Verificación de Pacientes

### Niveles de Verificación

| Nivel | Requisitos | Beneficios |
|-------|------------|------------|
| **0 - Básico** | Registro + SMS | No puede solicitar servicios |
| **1 - Verificado** | DNI + Selfie + Pago | Puede solicitar servicios diurnos |
| **2 - Premium** | Nivel 1 + Videollamada + Referencias | Servicios 24/7, prioridad |

### Proceso de Verificación Nivel 1

```
1. Verificación de teléfono (SMS con código 6 dígitos)
2. Datos personales (nombre, fecha nacimiento, género)
3. Foto DNI anverso
4. Foto DNI reverso
5. Validación con RENIEC (automática)
6. Selfie sosteniendo DNI
7. Comparación biométrica (opcional en MVP)
8. Método de pago verificado
9. Primera dirección
10. Contactos de emergencia (mínimo 2)
```

### Esquema de Base de Datos

```typescript
PatientVerification {
  patientId: ObjectId,
  verificationLevel: 0 | 1 | 2,
  dni: {
    number: string,
    frontPhotoUrl: string,
    backPhotoUrl: string,
    verifiedWithReniec: boolean,
    reniecData: object
  },
  selfie: {
    photoUrl: string,
    biometricMatchScore: number (0-100),
    verified: boolean
  },
  paymentMethod: {
    verified: boolean,
    type: 'card' | 'yape' | 'plin',
    last4: string
  },
  emergencyContacts: [{
    name: string,
    phone: string,
    relationship: string,
    verified: boolean
  }],
  trustScore: number (0-100),
  flags: [{
    type: 'yellow' | 'red',
    reason: string,
    reportedBy: ObjectId,
    createdAt: Date
  }],
  status: 'pending' | 'level1' | 'level2' | 'suspended'
}
```

---

## Sistema de Direcciones

### Reglas de Direcciones
- Máximo 5 direcciones activas por paciente
- Primera dirección requiere 24h de espera antes de estar disponible
- Cada dirección tiene una zona de seguridad asignada
- No se permite GPS inmediato para nuevos pacientes

### Zonas de Seguridad

| Zona | Color | Restricciones |
|------|-------|---------------|
| **Verde** | 🟢 | Operación normal |
| **Amarilla** | 🟡 | Solo enfermeras senior, check-in cada 15 min |
| **Roja** | 🔴 | Solo diurno, 2 enfermeras, aprobación manual |

### Esquema de Base de Datos

```typescript
PatientAddress {
  patientId: ObjectId,
  alias: string, // 'Mi casa'
  addressLine: string,
  district: string,
  city: string,
  latitude: number,
  longitude: number,
  addressType: 'home' | 'family' | 'hospital' | 'work' | 'other',
  facadePhotoUrl: string,
  safetyZone: 'green' | 'yellow' | 'red',
  references: string,
  floor: string,
  hasElevator: boolean,
  hasPets: boolean,
  petDetails: string,
  isVerified: boolean,
  isPrimary: boolean,
  mapboxData: {
    placeId: string,
    placeName: string,
    relevance: number
  }
}
```

---

## Sistema de Confianza (Trust Score)

### Cálculo del Score

El Trust Score va de 0 a 100 puntos:

| Evento | Puntos |
|--------|--------|
| Score inicial (paciente nuevo verificado) | +50 |
| Servicio completado con 5 estrellas | +5 |
| Verificación nivel 2 completada | +10 |
| Método de pago verificado | +5 |
| 10 servicios sin incidentes | +10 |
| 20+ servicios (paciente frecuente) | +15 |
| Calificación de 3 estrellas o menos | -10 |
| Flag amarilla | -20 |
| Flag roja | -50 |
| Cancelación tardía | -15 |
| No calificar a la enfermera | -5 |

### Restricciones por Score

| Score | Estado | Restricciones |
|-------|--------|---------------|
| 0-30 | Suspendido | Cuenta bloqueada |
| 31-50 | Alto Riesgo | Solo enfermeras senior + supervisión |
| 51-70 | Normal | Operación estándar |
| 71-100 | Confiable | Prioridad en agenda, servicios 24/7 |

### Recálculo Automático
El Trust Score se recalcula automáticamente después de:
- Cada servicio completado
- Cada calificación recibida
- Cada flag agregada
- Cada verificación completada

---

## Seguridad Durante el Servicio

### Sistema de Tracking

```typescript
ServiceTracking {
  serviceRequestId: ObjectId,
  nurseId: ObjectId,
  patientId: ObjectId,
  events: [{
    type: 'check_in' | 'check_out' | 'location_update' | 'panic_button',
    latitude: number,
    longitude: number,
    timestamp: Date,
    batteryLevel: number,
    accuracy: number
  }],
  panicAlerts: [{
    level: 'help_needed' | 'emergency',
    activatedAt: Date,
    status: 'active' | 'responded' | 'resolved',
    respondedAt: Date,
    audioRecordingUrl: string
  }],
  sharedWith: [{
    name: string,
    phone: string,
    relationship: string,
    trackingUrl: string
  }],
  isActive: boolean,
  checkInIntervalMinutes: number,
  nextCheckInDue: Date
}
```

### Sistema de Check-in

1. **Check-in de llegada**: Al llegar al domicilio
   - Foto de fachada (opcional)
   - GPS debe coincidir con dirección registrada (±100m)
   - Confirmar "He llegado, todo bien"

2. **Check-in automático**: Durante el servicio
   - Cada 30 minutos (normal) o 15 minutos (zona amarilla)
   - Si no responde en 2 minutos: llamada automática
   - Si no contesta llamada: alerta a contactos de emergencia

3. **Check-out de salida**: Al terminar
   - Confirmar "Servicio completado"
   - Calificación obligatoria del paciente
   - Foto final (opcional)

### Botón de Pánico

#### Nivel 1: "Necesito Ayuda" (Naranja)
- Activa alerta en central de monitoreo
- Llamada de verificación en <2 minutos
- No alerta al paciente
- Graba audio ambiente (si está habilitado)

#### Nivel 2: "EMERGENCIA" (Rojo)
- **Activación silenciosa** (para no alertar al agresor)
- Alerta inmediata a:
  - Central de monitoreo de Histora Care
  - Contactos de emergencia de la enfermera
  - PNP (Policía Nacional del Perú) - 105
- Grabación de audio automática
- GPS compartido en tiempo real
- **No se puede cancelar una vez activado** (evita coerción)

#### Formas de Activación
- Botón visible en pantalla de servicio
- Triple tap rápido (activación silenciosa)
- Comando de voz (futuro)

### Virtual Escort
La enfermera puede compartir su ubicación en tiempo real con:
- Hasta 3 contactos de confianza
- Cada contacto recibe un link único
- Pueden ver: GPS, tiempo estimado, datos del paciente
- Pueden activar alerta si detectan algo anormal

---

## Sistema de Calificaciones

### Calificación de Pacientes por Enfermeras

Después de cada servicio, la enfermera DEBE calificar al paciente:

```typescript
PatientRating {
  serviceRequestId: ObjectId,
  patientId: ObjectId,
  nurseId: ObjectId,
  ratings: {
    safety: number (1-5),      // ¿Te sentiste segura?
    respect: number (1-5),      // ¿El paciente fue respetuoso?
    environment: number (1-5),  // ¿Entorno limpio y adecuado?
    compliance: number (1-5)    // ¿Siguió instrucciones?
  },
  overallRating: number (1-5),
  positiveTags: string[],
  negativeTags: string[],
  privateComment: string,
  hasIncident: boolean,
  isAnonymous: boolean
}
```

### Tags Predefinidos

**Positivos:**
- `respectful` - Respetuoso
- `clean_environment` - Entorno limpio
- `safe_environment` - Entorno seguro
- `punctual` - Puntual
- `collaborative` - Colaborador
- `friendly` - Amigable
- `clear_communication` - Buena comunicación
- `proper_preparation` - Bien preparado

**Negativos:**
- `disrespectful` - Irrespetuoso
- `unsafe_environment` - Entorno inseguro
- `dirty_environment` - Entorno sucio
- `aggressive` - Agresivo
- `intoxicated` - Intoxicado/drogado
- `harassment` - Acoso
- `poor_communication` - Mala comunicación
- `unprepared` - No preparado

### Sistema de Flags

#### Flag Amarilla (Warning)
- Comportamiento inapropiado menor
- Primera vez: Advertencia al paciente
- Segunda vez: Revisión manual + videollamada obligatoria
- Tercera vez: Suspensión temporal

#### Flag Roja (Grave)
- Acoso, agresión, entorno peligroso
- **Suspensión inmediata** de la cuenta
- Investigación obligatoria en <48h
- Posible banneo permanente

---

## Gestión de Incidentes

### Tipos de Incidentes

| Tipo | Severidad | Acción |
|------|-----------|--------|
| Acoso verbal | Amarilla/Roja | Advertencia/Suspensión |
| Acoso físico | Roja | Suspensión + Policía |
| Acoso sexual | Roja | Suspensión + Policía |
| Entorno inseguro | Amarilla | Revisión de dirección |
| Amenazas | Roja | Suspensión + Policía |
| Intoxicación | Amarilla/Roja | Según gravedad |
| Dirección falsa | Roja | Suspensión inmediata |

### Proceso de Investigación

```
1. Reporte recibido → Suspensión preventiva inmediata
2. Entrevista con enfermera (24h máximo)
3. Revisión de evidencias (GPS, fotos, audio)
4. Entrevista con paciente (derecho a defensa)
5. Decisión: Advertencia / Suspensión temporal / Ban permanente
6. Seguimiento con enfermera (soporte psicológico si necesario)
```

### Esquema de Incidente

```typescript
SafetyIncident {
  serviceRequestId: ObjectId,
  reporterId: ObjectId, // Enfermera
  reportedUserId: ObjectId, // Paciente
  incidentType: 'verbal_harassment' | 'physical_harassment' | ...,
  severity: 'yellow_flag' | 'red_flag',
  description: string,
  evidenceUrls: string[],
  locationAtIncident: {
    latitude: number,
    longitude: number,
    address: string
  },
  status: 'pending' | 'investigating' | 'resolved',
  actionTaken: 'warning' | 'suspension' | 'permanent_ban' | 'no_action',
  policeReportFiled: boolean,
  timeline: [{
    action: string,
    performedBy: ObjectId,
    timestamp: Date
  }]
}
```

---

## Flujos de Usuario

### Flujo de Registro de Paciente

```
┌─────────────────────────────────────────┐
│  1. Bienvenida + Explicación            │
│     "Tu seguridad y la de nuestras      │
│      enfermeras es prioridad"           │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  2. Verificación de Teléfono            │
│     - Input número                      │
│     - Código SMS (6 dígitos)            │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  3. Datos Personales                    │
│     - Nombre completo                   │
│     - Fecha nacimiento                  │
│     - Género                            │
│     - Email                             │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  4. Foto DNI (Anverso)                  │
│     - Instrucciones visuales            │
│     - Captura                           │
│     - Preview + confirmación            │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  5. Foto DNI (Reverso)                  │
│     - Captura                           │
│     - Validación automática RENIEC      │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  6. Selfie con DNI                      │
│     - Guía de posición                  │
│     - Captura                           │
│     - Comparación biométrica            │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  7. Método de Pago                      │
│     - Tarjeta crédito/débito            │
│     - O Yape/Plin verificado            │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  8. Primera Dirección                   │
│     - Mapa interactivo                  │
│     - Dirección completa                │
│     - Referencias                       │
│     - Foto fachada (opcional)           │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  9. Contactos de Emergencia (2 min)     │
│     - Nombre + Teléfono + Parentesco    │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  10. Verificación Completada            │
│      ✓ Cuenta verificada                │
│      Score inicial: 50/100              │
│      "Puedes agendar tu primer servicio"│
└─────────────────────────────────────────┘
```

### Vista de Solicitud para Enfermera

```
┌─────────────────────────────────────────────────┐
│  Nueva Solicitud de Servicio                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  👤 Carlos Méndez Ríos                         │
│     34 años • Hombre                            │
│                                                 │
│  🛡️ NIVEL DE VERIFICACIÓN                      │
│     [████████░░] 80/100 - Paciente Confiable   │
│                                                 │
│     ✓ DNI verificado con RENIEC                │
│     ✓ Biometría validada                       │
│     ✓ Método de pago verificado                │
│     ✓ 12 servicios completados                 │
│                                                 │
│  ⭐ CALIFICACIONES                              │
│     ⭐⭐⭐⭐⭐ 5.0 (12 valoraciones)             │
│     "Paciente muy respetuoso"                  │
│     "Entorno seguro y limpio"                  │
│                                                 │
│  📍 UBICACIÓN                                   │
│     Jr. Las Flores 123, San Isidro             │
│     Zona: 🟢 Segura                            │
│     [Ver en mapa] [Ver imagen]                 │
│                                                 │
│  🩺 SERVICIO                                    │
│     Curación de herida post-operatoria         │
│     📅 15 enero, 10:00am • 45 min              │
│                                                 │
│  💰 PAGO: S/ 95.00                             │
│                                                 │
│  ⚠️ INFO ADICIONAL                             │
│     • Paciente vive solo                       │
│     • Segunda planta, sin ascensor             │
│     • Mascota: gato                            │
│                                                 │
│  [❌ Rechazar]        [✓ Aceptar]              │
│                                                 │
│  ℹ️ Puedes rechazar sin penalización           │
└─────────────────────────────────────────────────┘
```

---

## APIs y Endpoints

### Verificación de Pacientes

```
POST   /patient-verification/start           # Iniciar verificación
POST   /patient-verification/phone/send      # Enviar código SMS
POST   /patient-verification/phone/verify    # Verificar código SMS
POST   /patient-verification/dni/front       # Subir foto DNI anverso
POST   /patient-verification/dni/back        # Subir foto DNI reverso
POST   /patient-verification/selfie          # Subir selfie con DNI
POST   /patient-verification/payment         # Verificar método de pago
GET    /patient-verification/status          # Estado de verificación
GET    /patient-verification/:patientId      # Info verificación (para enfermera)
```

### Direcciones

```
GET    /patient-addresses                    # Listar direcciones del paciente
POST   /patient-addresses                    # Crear nueva dirección
PATCH  /patient-addresses/:id                # Actualizar dirección
DELETE /patient-addresses/:id                # Eliminar dirección
POST   /patient-addresses/:id/set-primary    # Establecer como principal
GET    /patient-addresses/:id/safety-zone    # Obtener zona de seguridad
```

### Calificaciones

```
POST   /patient-ratings                      # Crear calificación (enfermera → paciente)
GET    /patient-ratings/patient/:patientId   # Historial de calificaciones
GET    /patient-ratings/summary/:patientId   # Resumen (promedio, total, tags)
```

### Seguridad y Tracking

```
POST   /tracking/start                       # Iniciar tracking de servicio
POST   /tracking/check-in                    # Check-in (llegada o periódico)
POST   /tracking/check-out                   # Check-out (fin de servicio)
POST   /tracking/location                    # Actualizar ubicación
POST   /tracking/panic                       # Activar botón de pánico
GET    /tracking/:serviceId                  # Estado del tracking
POST   /tracking/share                       # Compartir con contacto
```

### Incidentes

```
POST   /safety/incidents                     # Reportar incidente
GET    /safety/incidents/:id                 # Detalle de incidente
PATCH  /safety/incidents/:id                 # Actualizar incidente (admin)
GET    /safety/incidents/patient/:patientId  # Historial de incidentes
```

---

## Integraciones Externas

### MVP (Obligatorias)

| Servicio | Uso | Costo Estimado |
|----------|-----|----------------|
| Twilio Verify | SMS de verificación | $0.05/SMS |
| Cloudinary | Almacenamiento de fotos | $0/mes (free tier) |
| Mapbox | Geocoding y mapas | $0.50/1000 requests |

### Post-MVP (Recomendadas)

| Servicio | Uso | Costo Estimado |
|----------|-----|----------------|
| RENIEC API | Validación de DNI | S/. 0.50/consulta |
| AWS Rekognition | Biometría facial | $0.001/imagen |
| Twilio Voice | Llamadas de emergencia | $0.013/min |
| Socket.io | Tracking tiempo real | Incluido en servidor |

### Configuración de Mapbox

```typescript
// environment.ts
export const environment = {
  mapboxToken: 'pk.eyJ1...',  // Ya configurado
  mapboxGeocoding: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
  mapboxStaticImages: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/static'
};
```

---

## Métricas de Éxito

### KPIs de Seguridad
- Tasa de incidentes: < 1% de servicios
- Tiempo de respuesta a alertas: < 2 minutos
- Tasa de activación de pánico: Monitorear (ideal < 0.5%)
- % de pacientes verificados nivel 1: 100%
- % de servicios completados sin incidentes: > 99%

### KPIs de UX
- Tasa de abandono en onboarding: < 30%
- Tiempo promedio de verificación: < 10 minutos
- % de enfermeras que revisan perfil completo: > 80%
- NPS de enfermeras respecto a seguridad: > 70

---

## Consideraciones Legales (Perú)

### Ley de Protección de Datos Personales (Ley N° 29733)

**Consentimientos requeridos:**
- ✅ Verificación de identidad con DNI
- ✅ Validación de datos con RENIEC
- ✅ Uso de biometría facial
- ✅ Compartir ubicación durante servicios
- ✅ Calificación por profesionales de salud
- ✅ Grabación de audio (opcional, explícito)

**Datos sensibles:**
- DNI y datos personales → Encriptados en reposo
- Datos biométricos → No almacenados después de verificación
- Ubicaciones GPS → Retenidas 30 días, luego anonimizadas
- Grabaciones de audio → Retenidas 90 días

---

## Arquitectura de Módulos

```
/src
├── /patient-verification
│   ├── schema/
│   │   └── patient-verification.schema.ts
│   ├── dto/
│   │   ├── start-verification.dto.ts
│   │   ├── verify-phone.dto.ts
│   │   ├── upload-dni.dto.ts
│   │   └── upload-selfie.dto.ts
│   ├── patient-verification.service.ts
│   ├── patient-verification.controller.ts
│   └── patient-verification.module.ts
│
├── /patient-addresses
│   ├── schema/
│   │   └── patient-address.schema.ts
│   ├── dto/
│   │   ├── create-address.dto.ts
│   │   └── update-address.dto.ts
│   ├── patient-addresses.service.ts
│   ├── patient-addresses.controller.ts
│   └── patient-addresses.module.ts
│
├── /patient-ratings
│   ├── schema/
│   │   └── patient-rating.schema.ts
│   ├── dto/
│   │   └── create-rating.dto.ts
│   ├── patient-ratings.service.ts
│   ├── patient-ratings.controller.ts
│   └── patient-ratings.module.ts
│
├── /safety
│   ├── schema/
│   │   └── safety-incident.schema.ts
│   ├── dto/
│   │   ├── report-incident.dto.ts
│   │   └── update-incident.dto.ts
│   ├── safety.service.ts
│   ├── safety.controller.ts
│   └── safety.module.ts
│
└── /tracking
    ├── schema/
    │   └── service-tracking.schema.ts
    ├── dto/
    │   ├── start-tracking.dto.ts
    │   ├── check-in.dto.ts
    │   └── panic-alert.dto.ts
    ├── tracking.service.ts
    ├── tracking.controller.ts
    ├── tracking.gateway.ts (WebSocket)
    └── tracking.module.ts
```

---

## Changelog

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0.0 | 2026-01-12 | Documento inicial |

---

*Documento generado para Histora Care - Sistema de Enfermería a Domicilio*
*Última actualización: Enero 2026*
