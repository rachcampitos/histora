# NurseLite - Documentacion de Plataforma

## Tabla de Contenidos
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura Tecnica](#arquitectura-tecnica)
3. [Flujos del Sistema](#flujos-del-sistema)
4. [Verificacion de Enfermeras](#verificacion-de-enfermeras)
5. [Sistema de Seguridad Bidireccional](#sistema-de-seguridad-bidireccional)
6. [Sistema de Reviews](#sistema-de-reviews)
7. [Estrategia de Pagos](#estrategia-de-pagos)
8. [Autenticacion](#autenticacion)
9. [Integraciones Externas](#integraciones-externas)
10. [Consideraciones Legales Peru](#consideraciones-legales-peru)

---

## Resumen Ejecutivo

NurseLite es una plataforma que conecta pacientes con enfermeras profesionales para servicios de salud a domicilio en Peru. La aplicacion se diferencia por:

- **Verificacion CEP obligatoria:** Solo enfermeras con CEP HABIL pueden registrarse
- **Seguridad bidireccional:** Proteccion tanto para pacientes como enfermeras
- **Modelo P2P:** Pago directo entre paciente y enfermera, sin intermediarios
- **Mercado objetivo:** NSE A/B en Lima metropolitana

### Stack Tecnologico

| Componente | Tecnologia | Hosting |
|------------|------------|---------|
| Backend | NestJS + MongoDB | Railway |
| App Movil | Angular + Ionic + Capacitor | Cloudflare Pages |
| Landing | Next.js 16 | Cloudflare Pages |
| Mapas | Mapbox GL | - |
| Pagos | Culqi | - |

### URLs de Produccion

| Servicio | URL |
|----------|-----|
| Landing | https://nurse-lite.com |
| App | https://app.nurse-lite.com |
| API | https://api.historahealth.com |

---

## Arquitectura Tecnica

### Estructura del Monorepo

```
histora/
├── histora-back/        # Backend NestJS
├── histora-care/        # App Ionic/Angular
├── histora-admin/       # Panel admin Next.js
├── nurselite-landing/   # Landing page Next.js
└── docs/                # Documentacion
```

### Backend (NestJS)

```
histora-back/src/
├── auth/                # Autenticacion JWT
├── users/               # Usuarios (pacientes + enfermeras)
├── nurses/              # Perfiles de enfermeras
│   ├── cep-validation.service.ts
│   ├── nurse-verification.service.ts
│   └── nurse-review.schema.ts
├── service-requests/    # Solicitudes de servicio
├── service-payments/    # Pagos (Culqi)
├── admin/               # Endpoints admin
└── notifications/       # Push + Email
```

### Frontend (Angular/Ionic)

```
histora-care/src/app/
├── auth/                # Login, registro, forgot-password
├── patient/             # Modulo paciente
│   ├── search-nurses/   # Busqueda por mapa
│   ├── nurse-profile/   # Perfil de enfermera
│   └── checkout/        # Solicitud de servicio
├── nurse/               # Modulo enfermera
│   ├── dashboard/       # Panel principal
│   ├── verification/    # Verificacion CEP
│   ├── profile/         # Mi perfil
│   └── onboarding/      # Onboarding 4 pantallas
├── shared/              # Componentes compartidos
└── core/                # Servicios, guards, interceptors
```

---

## Flujos del Sistema

### Flujo de Registro de Enfermera

```
1. Enfermera descarga app → Selecciona "Soy Profesional"
2. Completa formulario: nombre, email, telefono, contrasena, CEP
3. Crea cuenta (estado: PENDIENTE_VERIFICACION)
4. Pasa por flujo de verificacion CEP (ver seccion)
5. Admin revisa y aprueba
6. Enfermera puede empezar a recibir solicitudes
```

### Flujo de Onboarding de Enfermera

**4 pantallas obligatorias post-registro:**

1. **Bienvenida**: Saludo personalizado
2. **Modelo P2P**: Explicacion del modelo de pago directo
3. **Metodos de Pago**: Configurar Yape, Plin, efectivo
4. **Planes**: Ver planes de suscripcion (opcional)

**Estado persistido en localStorage:** `nurselite_nurse_onboarding`

### Flujo de Solicitud de Servicio (Paciente)

```
1. Paciente abre app → Ve mapa con enfermeras cercanas
2. Filtra por: servicio, distancia, disponibilidad
3. Selecciona enfermera → Ve perfil (rating, servicios, precios)
4. "Solicitar Servicio" → Selecciona servicio, fecha/hora
5. Ingresa direccion + notas
6. Confirma → Estado: PENDING
7. Enfermera acepta/rechaza
8. Si acepta → Estado: ACCEPTED
9. Enfermera llega → Estado: IN_PROGRESS
10. Servicio termina → Estado: COMPLETED
11. Ambos califican
```

### Estados de Solicitud

| Estado | Descripcion |
|--------|-------------|
| `pending` | Enviada, esperando respuesta |
| `accepted` | Enfermera acepto |
| `rejected` | Enfermera rechazo |
| `in_progress` | Servicio en curso |
| `completed` | Servicio terminado |
| `cancelled` | Cancelado |

---

## Verificacion de Enfermeras

### Resumen

El sistema valida credenciales profesionales con el **Colegio de Enfermeros del Peru (CEP)** en tiempo real. Esto es nuestro principal diferenciador.

### Flujo de Verificacion

```
PASO 1: Enfermera ingresa DNI (8 digitos)
           ↓
PASO 2: Backend consulta cep.org.pe
        → Obtiene: foto, nombre, estado, region
        → Valida: DNI coincide + Estado HABIL
           ↓
PASO 3: Enfermera confirma "Si, soy yo"
           ↓
PASO 4: Sube documentos (CEP, DNI, selfie)
           ↓
PASO 5: Admin revisa y aprueba/rechaza
           ↓
RESULTADO: Badge "CEP HABIL VERIFICADA"
```

### API del CEP

**Endpoint:** `POST https://www.cep.org.pe/validar/pagina/view.php`

**Datos extraidos:**
- Foto oficial: `https://www.cep.org.pe/fotos/{DNI}.jpg`
- Nombre completo
- Estado: HABIL / INHABILITADO
- Region: Consejo Regional

**Datos de prueba:**
```
CEP: 108887
DNI: 44119536
Nombre: CHAVEZ TORRES MARIA CLAUDIA
Estado: HABIL
Region: CONSEJO REGIONAL III LIMA METROPOLITANA
```

### Estados de Verificacion

| Estado | Descripcion |
|--------|-------------|
| `pending` | Documentos enviados, en espera |
| `under_review` | Admin revisando |
| `approved` | Aprobada, puede trabajar |
| `rejected` | Rechazada, puede reintentar |

---

## Sistema de Seguridad Bidireccional

### Filosofia: "Confianza, no Miedo"

El sistema protege a AMBOS: pacientes y enfermeras. Inspirado en InDrive, pero adaptado al contexto peruano de servicios de salud a domicilio.

### Para Enfermeras

#### 1. Virtual Escort (Red de Apoyo)

**Que es:** Hasta 3 contactos pueden seguir la ubicacion en tiempo real durante el servicio.

**Implementacion:**
```typescript
interface VirtualEscort {
  maxContacts: 3;
  shareMethod: 'whatsapp'; // Critico para Peru
  duration: 'service-only'; // Auto-expire
  permissions: {
    viewLocation: true,
    viewServiceDetails: true,
    receiveAlerts: true
  };
}
```

**UX de compartir:**
```
┌─────────────────────────────────────────┐
│  Activa tu Red de Apoyo                 │
│                                         │
│  Hasta 3 contactos podran:             │
│  ✓ Ver tu ubicacion en tiempo real     │
│  ✓ Recibir alertas de check-in         │
│  ✓ Ser notificados si activas SOS      │
│                                         │
│  [+ Agregar contacto]                   │
│                                         │
│  Compartir via:                         │
│  [📱 WhatsApp] [✉️ SMS] [🔗 Link]      │
│                                         │
│  [Activar Red de Apoyo]                 │
└─────────────────────────────────────────┘
```

**Mensaje de WhatsApp:**
```
🛡️ *NurseLite - Red de Apoyo*

María Claudia te agrego a su Red de Apoyo durante su servicio.

📍 *Seguimiento en tiempo real:*
https://nurse-lite.com/escort/abc123xyz

🏥 *Detalles del servicio:*
• Paciente: J. Perez (Miraflores)
• Inicio: 3:00 PM
• Duracion estimada: 1 hora

✓ Recibiras alertas si necesita ayuda.
```

#### 2. Boton SOS

**Metodo de activacion recomendado:** Triple tap rapido (1.5 segundos)

**Por que NO press & hold:**
- 3 segundos es demasiado en emergencia real
- Press & hold puede fallar con manos temblorosas
- Triple tap es deliberado (menos falsas alarmas)

**Niveles de alerta:**

| Nivel | Color | Accion |
|-------|-------|--------|
| 1 - Necesito Ayuda | Naranja | Llamada de verificacion en <2 min |
| 2 - EMERGENCIA | Rojo | Alerta a contactos + soporte + PNP (105) |

**Acciones automaticas en emergencia:**
- Grabacion de audio ambiente (si habilitado)
- GPS compartido en tiempo real
- No se puede cancelar (evita coercion)

#### 3. Sistema de Check-in

**Configuracion por tipo de servicio:**

| Duracion | Check-in | Rationale |
|----------|----------|-----------|
| <30 min | No requiere | Servicio muy corto |
| 30-60 min | 1x al finalizar | Confirmacion de termino |
| 60+ min | Cada 30 min | Servicios largos |
| Nocturnos | Cada 2 horas | Balance seguridad/descanso |

**Dead Man's Switch:**
```
1. Si no responde check-in en 2 min → Vibracion
2. Si no responde en 30 seg mas → Llamada automatica
3. Si no contesta llamada → Alerta a contactos de emergencia
```

### Para Pacientes

#### 1. Trust Badges (NO Score Numerico)

**Por que badges en lugar de score:**
- Score numerico genera discriminacion algoritmica
- En Peru, variables como distrito correlacionan con NSE
- Ley N° 31814 (IA responsable) prohibe discriminacion algoritmica

**Badges implementados:**

```typescript
const nurseProfile = {
  verification: [
    { type: 'CEP_HABIL', label: 'Colegiada HABIL', verified: true },
    { type: 'IDENTITY', label: 'Identidad verificada', verified: true },
    { type: 'SPECIALTY', label: 'Esp. Geriatria', verified: true }
  ],
  performance: [
    { type: 'EXPERIENCE', label: '50+ servicios', count: 73 },
    { type: 'RATING', label: '4.9★', value: 4.9 },
    { type: 'PUNCTUALITY', label: 'Puntual 95%', percentage: 95 }
  ]
};
```

**Diseño visual:**
```
┌─────────────────────────────────────────┐
│  ✓ VERIFICACIONES                       │
│  ✅ CEP N° 108887 HABIL                │
│  ✅ Identidad DNI verificada           │
│  ✅ Especialidad: Geriatria            │
│                                         │
│  📊 RENDIMIENTO                         │
│  🎯 Puntualidad: 95%                   │
│  💬 Responde en ~10 min                │
│  🚫 Cancelaciones: <2%                 │
└─────────────────────────────────────────┘
```

#### 2. Compartir Servicio via WhatsApp

Paciente puede compartir datos de la enfermera asignada con familiares.

### Para Ambos

#### Calificacion Bidireccional

**Timing:**
- Ambos califican inmediatamente al finalizar
- Double-blind: No ven la calificacion del otro hasta enviar la propia
- Requerido: Bloquea nuevo servicio hasta calificar
- Ventana: 48 horas

**Aspectos a calificar:**

**Paciente → Enfermera:**
```typescript
const nurseRatingAspects = [
  { key: 'professionalism', label: 'Profesionalismo' },
  { key: 'punctuality', label: 'Puntualidad' },
  { key: 'communication', label: 'Comunicacion' },
  { key: 'care_quality', label: 'Calidad de atencion' }
];
```

**Enfermera → Paciente:**
```typescript
const patientRatingAspects = [
  { key: 'respect', label: 'Trato respetuoso' },
  { key: 'environment', label: 'Ambiente seguro' },
  { key: 'communication', label: 'Comunicacion clara' },
  { key: 'payment', label: 'Pago sin problemas' }
];
```

#### Sistema de Flags

| Severidad | Color | Consecuencia |
|-----------|-------|--------------|
| Amarilla | 🟡 | Advertencia, 3 = revision manual |
| Roja | 🔴 | Suspension inmediata, investigacion |

**Categorias de flags:**
- `unsafe_environment` - Domicilio inseguro
- `inappropriate_behavior` - Acoso, insinuaciones
- `payment_issue` - Problemas de pago
- `false_information` - Direccion incorrecta

### Iconografia de Seguridad

**Colores:**
- Verde #059669 - Confianza (check-ins, badges)
- Azul #0284C7 - Seguridad (Virtual Escort)
- Rojo #DC2626 - SOLO para boton SOS

**Iconos:**
- ✓ Escudo, candado, check
- ✗ Alarmas, armas, policias

**Lenguaje:**
- ✓ "Tu red de apoyo", "Estas protegida", "Verificacion completa"
- ✗ "PELIGRO", "CUIDADO", "Evita robos"

---

## Sistema de Reviews

### Modelo de Datos

```typescript
interface NurseReview {
  nurse: ObjectId;
  patient: ObjectId;
  serviceRequest?: ObjectId;
  rating: number; // 1-5
  comment?: string; // Max 1000 chars
  isVerified: boolean; // Si viene de servicio completado
  createdAt: Date;
}
```

### Reglas de Negocio

- Solo usuarios con rol `PATIENT` pueden crear reviews
- Un paciente solo puede dejar UN review por enfermera
- Review es `isVerified: true` si viene de servicio completado
- Rating promedio se recalcula automaticamente

### Endpoints

```http
GET  /nurses/:nurseId/reviews?page=1&limit=10  # Listar reviews
POST /nurses/:nurseId/reviews                   # Crear review
```

---

## Estrategia de Pagos

### Modelo de Suscripcion

**Enfermera recibe 100% del pago del servicio. Solo paga suscripcion mensual.**

Este modelo:
- Elimina friccion en cada transaccion
- Permite a enfermeras cobrar directamente via Yape/Plin/efectivo
- Genera ingresos predecibles para la plataforma
- Alinea incentivos: mas servicios = mas valor para enfermera

### Planes de Suscripcion

| Plan | Precio | Solicitudes | Visibilidad | Features Clave |
|------|--------|-------------|-------------|----------------|
| **Basico** | Gratis | 10/mes | 1x (estandar) | CEP verificado, notificaciones, soporte 48h |
| **Pro** | S/ 39/mes | Ilimitadas | 2x | Badge Profesional, estadisticas avanzadas, soporte 4h |
| **Premium** | S/ 79/mes | Ilimitadas | 5x + Destacadas | Badge Elite dorado, WhatsApp directo, agenda integrada |

### Justificacion de Precios

**Plan Basico (10 solicitudes gratis):**
- Suficiente para validar la plataforma (2-3 servicios/semana)
- Genera urgencia de upgrade en semana 3
- 10 servicios x S/ 80 = S/ 800/mes potencial

**Plan Pro (S/ 39/mes):**
- Se paga solo con 1 servicio al mes
- ROI: 2,877% (por cada S/ 1 invertido, gana S/ 28.77)
- Precio en rango "herramienta de trabajo" (no gasto hormiga)

**Plan Premium (S/ 79/mes):**
- Salto 2x desde Pro crea diferenciacion clara
- Solo 3% de ingresos si genera S/ 2,500/mes
- Enfermeras Premium generan S/ 2,500-3,500/mes promedio

### Ejemplo de Transaccion

```
Tarifa enfermera:       S/. 80/servicio
Servicio realizado:     1

Paciente paga:          S/. 80 (directo a enfermera)
├─ Comision app:        S/. 0 (modelo suscripcion)
└─ Enfermera recibe:    S/. 80 (100%)

Enfermera paga:         S/. 39/mes (Plan Pro)
Si hace 15 servicios:   S/. 1,200/mes
Costo suscripcion:      3.25% de ingresos
```

### Metodos de Pago (Paciente → Enfermera)

| Metodo | Estado | Notas |
|--------|--------|-------|
| Yape | Recomendado | Mas usado en Peru, instantaneo |
| Plin | Disponible | Alternativa popular |
| Efectivo | Disponible | Al finalizar servicio |
| Tarjeta | Futuro | Requiere integracion Culqi |

### Flujo de Pago

```
1. Paciente solicita servicio → Ve precio total
2. Paciente confirma solicitud
3. Enfermera acepta
4. Servicio se realiza
5. Paciente paga directamente (Yape/Plin/efectivo)
6. Enfermera confirma pago recibido
7. Ambos marcan "completado"
8. Solicitud de resena a ambas partes
```

### Politica de Cancelaciones

| Escenario | Tiempo | Accion |
|-----------|--------|--------|
| Paciente cancela | >24h antes | Sin penalidad |
| Paciente cancela | 2-24h antes | Advertencia en perfil |
| Paciente cancela | <2h antes | Flag amarilla (3 = revision) |
| Enfermera cancela | Cualquier | Afecta % aceptacion |

### Suscripciones - Pago via Yape

**Proceso actual (manual con verificacion):**
1. Enfermera selecciona plan (Pro o Premium)
2. Realiza pago por Yape a numero de la empresa
3. Sube comprobante de pago
4. Admin verifica y activa plan (max. 24h)
5. Notificacion de activacion por email y push

**Datos de pago:**
- Yape: 923018997 (Code Media EIRL)
- Verificacion: Manual por admin

---

## Autenticacion

### Metodos Soportados

- Email + Contrasena
- Google OAuth
- Refresh token automatico
- Remember me (sesiones extendidas)

### Recuperacion de Contrasena (OTP)

**Flujo:**
```
1. Usuario ingresa email
2. Recibe codigo de 6 digitos por email
3. Ingresa codigo (10 min para expirar, max 5 intentos)
4. Si valido, puede crear nueva contrasena
5. Redirige a login
```

**Configuracion:**
```typescript
OTP_EXPIRY_MINUTES = 10;
MAX_OTP_ATTEMPTS = 5;
OTP_LENGTH = 6;
```

### JWT

- Access token: 15 min
- Refresh token: 7 dias (30 dias si "remember me")
- Secretos en variables de entorno

---

## Integraciones Externas

### CEP (Colegio de Enfermeros del Peru)

- **URL:** `https://www.cep.org.pe/validar/`
- **Uso:** Validar numero CEP, obtener foto/nombre/estado
- **Notas:** SSL con problemas, usar `rejectUnauthorized: false`

Ver detalles en: `docs/CEP-API.md`

### RENIEC (via decolecta)

- **Limite:** 100 consultas/mes (gratis)
- **Token:** Variable `RENIEC_API_TOKEN`
- **Uso:** Backup para validacion de DNI

### Culqi (Pagos)

- **Uso:** Tarjetas de credito/debito + Yape
- **Comisiones:** 3.44% + IGV (tarjetas nacionales)
- **Estado:** En modo simulacion durante beta

### Cloudinary

- **Uso:** Almacenamiento de imagenes (fotos perfil, documentos)
- **Tier:** Free tier suficiente para MVP

### Mapbox

- **Uso:** Mapas, geocoding, busqueda de enfermeras cercanas
- **Comisiones:** $0.50/1000 requests

### SendGrid

- **Uso:** Emails transaccionales (OTP, confirmaciones)
- **Tier:** Free tier hasta 100 emails/dia

---

## Consideraciones Legales Peru

### Ley de Proteccion de Datos (Ley N° 29733)

**Consentimientos requeridos:**
- Verificacion de identidad con DNI
- Validacion de datos con RENIEC
- Uso de biometria facial
- Compartir ubicacion durante servicios
- Calificacion por profesionales de salud
- Grabacion de audio (opcional, explicito)

**Datos sensibles:**
- DNI y datos personales → Encriptados en reposo
- Datos biometricos → No almacenados despues de verificacion
- Ubicaciones GPS → Retenidas 30 dias, luego anonimizadas
- Grabaciones de audio → Retenidas 90 dias

### Ley N° 31814 (IA responsable)

- Prohibe discriminacion algoritmica
- Por esto usamos badges transparentes, NO score numerico
- Explicabilidad: usuario puede saber por que aparece cierto resultado

### INDECOPI

- Transparencia en precios y comisiones
- Politica de cancelaciones clara
- Derecho a replica ante calificaciones

### Contratos Requeridos

- Terminos y condiciones para usuarios
- Politica de privacidad
- Contrato de servicios enfermera-plataforma

---

## Metricas Clave

### KPIs de Producto

| Metrica | Meta Beta | Meta Ano 1 |
|---------|-----------|------------|
| Enfermeras registradas | 100 | 500 |
| Enfermeras verificadas | 50 | 300 |
| Servicios/mes | 100 | 1,000 |
| Rating promedio | >4.5 | >4.5 |

### KPIs de Seguridad

| Metrica | Meta |
|---------|------|
| Tasa de incidentes | <1% |
| Tiempo respuesta SOS | <2 min |
| % enfermeras con Virtual Escort | >30% |
| % servicios sin incidentes | >99% |

### KPIs Financieros

| Metrica | Meta Mes 6 | Meta Ano 1 |
|---------|------------|------------|
| GMV | S/. 70,000 | S/. 200,000 |
| Take rate | 15% | 18% |
| Ingresos netos | S/. 8,000 | S/. 30,000 |

---

## Changelog

| Version | Fecha | Cambios |
|---------|-------|---------|
| 1.0.0 | 2026-02 | Documento inicial consolidado |

---

*Documento generado para NurseLite - Plataforma de Enfermeria a Domicilio*
*Peru, Febrero 2026*
