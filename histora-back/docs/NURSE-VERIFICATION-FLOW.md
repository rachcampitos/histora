# Flujo de Verificacion de Enfermeras - Histora Care

## Resumen Ejecutivo

El sistema de verificacion de enfermeras de Histora Care valida las credenciales profesionales directamente con el **Colegio de Enfermeros del Peru (CEP)**, obteniendo automaticamente:

- Nombre completo oficial
- Foto del registro CEP
- Estado de habilitacion (HABIL/INHABILITADO)
- Region/Consejo Regional

**Ventaja competitiva:** Es el unico sistema que valida en tiempo real con el CEP oficial.

---

## Flujo Completo

```
                    FLUJO DE REGISTRO Y VERIFICACION
                    ================================

     PASO 1: REGISTRO INICIAL
     ========================

     Enfermera ingresa:
     - Email
     - Contrasena
     - Nombre (temporal)
     - Numero CEP (6 digitos)

                    |
                    v

     PASO 2: VERIFICACION (3 sub-pasos)
     ===================================

     Sub-paso 2.1: Ingresar DNI
     --------------------------
     Enfermera ingresa solo su DNI (8 digitos)

                    |
                    v

     Sub-paso 2.2: Validacion Automatica con CEP
     -------------------------------------------
     Backend consulta: cep.org.pe/validar/pagina/view.php

     Obtiene:
     +----------------------------------+
     | Foto: cep.org.pe/fotos/DNI.jpg   |
     | Nombre: APELLIDO NOMBRE          |
     | Estado: HABIL o INHABILITADO     |
     | Region: CONSEJO REGIONAL III...  |
     +----------------------------------+

     Validaciones:
     1. DNI de foto URL == DNI ingresado?
     2. Estado == HABIL?

     Si INHABILITADO -> Rechazo automatico

                    |
                    v

     Sub-paso 2.3: Confirmacion de Identidad
     ---------------------------------------
     Frontend muestra:
     +----------------------------------+
     |     [Foto oficial CEP]           |
     |                                  |
     |     [HABIL] (badge verde)        |
     |                                  |
     | Nombre: LOPEZ GARCIA MARIA       |
     | DNI: 44119536                    |
     | CEP: 108887                      |
     | Region: LIMA METROPOLITANA       |
     +----------------------------------+

     Enfermera confirma: "Si, soy yo"

                    |
                    v

     PASO 3: DOCUMENTOS
     ==================

     Enfermera sube:
     - CEP frente/reverso
     - DNI frente/reverso
     - Selfie con DNI

                    |
                    v

     PASO 4: REVISION ADMIN
     ======================

     Admin revisa documentos vs datos CEP
     Aprueba o rechaza con motivo

                    |
                    v

     RESULTADO FINAL
     ===============

     Enfermera verificada:
     - Badge "VERIFICADA CEP - HABIL" en perfil
     - Foto oficial CEP como avatar
     - Puede ofrecer servicios
```

---

## Arquitectura Tecnica

### Backend (NestJS)

```
histora-back/
└── src/nurses/
    ├── cep-validation.service.ts      # Validacion con cep.org.pe
    ├── reniec-validation.service.ts   # Validacion RENIEC (opcional)
    ├── nurse-verification.service.ts  # Orquestador principal
    ├── nurse-verification.controller.ts
    └── schema/
        ├── nurse-verification.schema.ts
        └── reniec-usage.schema.ts
```

### Frontend (Angular/Ionic)

```
histora-care/
└── src/app/
    ├── nurse/verification/
    │   ├── verification.page.ts       # Logica de 3 pasos
    │   ├── verification.page.html     # UI con badge HABIL
    │   └── verification.page.scss     # Estilos con animaciones
    └── core/
        ├── services/nurse.service.ts  # API client
        └── models/nurse.model.ts      # Interfaces
```

---

## API Endpoints

### 1. Pre-validar CEP

```http
POST /nurses/:nurseId/verification/pre-validate-cep
Authorization: Bearer {token}
Content-Type: application/json

{
  "dniNumber": "44119536",
  "cepNumber": "108887"
}
```

**Respuesta:**

```json
{
  "isValid": true,
  "cepValidation": {
    "isValid": true,
    "cepNumber": "108887",
    "fullName": "CHAVEZ TORRES MARIA CLAUDIA",
    "dni": "44119536",
    "photoUrl": "https://www.cep.org.pe/fotos/44119536.jpg",
    "isPhotoVerified": true,
    "isNameVerified": true,
    "region": "CONSEJO REGIONAL III LIMA METROPOLITANA",
    "isHabil": true,
    "status": "HABIL",
    "validatedAt": "2026-01-15T..."
  },
  "message": "CEP validado exitosamente. Por favor confirma que la foto corresponde a tu identidad. Estado: HABIL"
}
```

### 2. Confirmar Identidad

```http
POST /nurses/:nurseId/verification/confirm-identity
Authorization: Bearer {token}
Content-Type: application/json

{
  "dniNumber": "44119536",
  "cepNumber": "108887",
  "fullName": "CHAVEZ TORRES MARIA CLAUDIA",
  "cepValidation": { ... },  // Objeto de pre-validacion
  "confirmed": true
}
```

### 3. Subir Documentos

```http
POST /nurses/:nurseId/verification
Authorization: Bearer {token}
Content-Type: application/json

{
  "dniNumber": "44119536",
  "fullNameOnDni": "CHAVEZ TORRES MARIA CLAUDIA",
  "documents": [
    {
      "imageData": "base64...",
      "documentType": "cep_front",
      "mimeType": "image/jpeg"
    },
    // ... mas documentos
  ]
}
```

---

## Integracion con CEP

### Endpoint Oficial

```
URL: https://www.cep.org.pe/validar/pagina/view.php
Metodo: POST
Headers:
  - Content-Type: application/x-www-form-urlencoded
  - Referer: https://www.cep.org.pe/validar/

Body: cep={CEP_NUMBER}&token={SESSION_TOKEN}
```

### Obtencion de Token

```bash
# El token se extrae del HTML de la pagina principal
curl -sk "https://www.cep.org.pe/validar/" | grep 'name="token"'
# Retorna: <input type="hidden" name="token" value="BASE64_TOKEN">
```

### Respuesta y Parsing

La respuesta es HTML que se parsea para extraer:

| Campo | Regex/Selector |
|-------|----------------|
| Foto URL | `/src="(https://www\.cep\.org\.pe/fotos/(\d+)\.jpg)"/` |
| Nombre | `/<h4 class="card-title[^"]*"><strong>([^<]+)<\/strong>/` |
| Region | `/<h6 class="card-subtitle">([^<]+)<\/h6>/` |
| Estado | `alert-success` + `HABIL` = HABIL |

### Estados Posibles

| Estado | Clase CSS | Descripcion |
|--------|-----------|-------------|
| HABIL | `alert-success` | Habilitada para ejercer |
| INHABILITADO | `alert-danger` | NO habilitada |

---

## Modelo de Datos

### CepValidationResult

```typescript
interface CepValidationResult {
  isValid: boolean;
  cepNumber?: string;
  fullName?: string;          // Nombre oficial del CEP
  dni?: string;               // Extraido de foto URL
  photoUrl?: string;          // URL de foto oficial
  isPhotoVerified?: boolean;
  isNameVerified?: boolean;
  region?: string;            // Consejo Regional
  isHabil?: boolean;          // Estado de habilitacion
  status?: 'HABIL' | 'INHABILITADO' | 'UNKNOWN';
  validatedAt?: Date;
  error?: string;
}
```

### NurseVerification (MongoDB)

```javascript
{
  nurseId: ObjectId,
  userId: ObjectId,
  dniNumber: "44119536",
  fullNameOnDni: "CHAVEZ TORRES MARIA CLAUDIA",
  cepValidation: {
    isValid: true,
    fullName: "CHAVEZ TORRES MARIA CLAUDIA",
    photoUrl: "https://www.cep.org.pe/fotos/44119536.jpg",
    region: "CONSEJO REGIONAL III LIMA METROPOLITANA",
    isHabil: true,
    status: "HABIL",
    validatedAt: Date
  },
  officialCepPhotoUrl: "https://www.cep.org.pe/fotos/44119536.jpg",
  cepIdentityConfirmed: true,
  cepIdentityConfirmedAt: Date,
  documents: [...],
  status: "pending" | "under_review" | "approved" | "rejected",
  attemptNumber: 1,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Consideraciones de Seguridad

### Validaciones

1. **DNI cruzado:** El DNI extraido de la foto URL debe coincidir con el DNI ingresado
2. **Estado HABIL:** Solo enfermeras habilitadas pueden registrarse
3. **Token de sesion:** El token del CEP es obligatorio y cambia periodicamente
4. **SSL:** El sitio del CEP tiene problemas de certificado (usar `rejectUnauthorized: false`)

### Rate Limiting

- No abusar de las consultas al CEP
- Cachear resultados por 24 horas si es necesario
- Implementar retry con backoff exponencial

---

## Recomendaciones UX (del agente UX/UI)

### Fase 1 (Actual)

1. Badge HABIL prominente con animacion verde
2. Nombre pre-llenado del CEP (read-only)
3. Guardado automatico de progreso
4. Indicador de pasos claro

### Fase 2 (Futuro)

1. Validacion en tiempo real del DNI (mientras escribe)
2. Upload guiado de documentos con camara
3. Pre-validacion de calidad de fotos

---

## Recomendaciones Marketing (del agente Marketing)

### Mensaje Principal

> "Solo enfermeras oficialmente habilitadas por el Colegio de Enfermeros del Peru pueden cuidar a tu familia"

### Badge Publico

```
VERIFICADA CEP - HABIL
CEP N° 123456
```

### Para Enfermeras

> "Tu colegiatura CEP es tu activo mas valioso. Validala una vez, consigue pacientes para siempre"

---

## Archivos Clave

### Backend

| Archivo | Descripcion |
|---------|-------------|
| `cep-validation.service.ts` | Validacion con cep.org.pe |
| `nurse-verification.service.ts` | Orquestador de verificacion |
| `nurse-verification.controller.ts` | Endpoints de API |
| `nurse-verification.schema.ts` | Modelo MongoDB |

### Frontend

| Archivo | Descripcion |
|---------|-------------|
| `verification.page.ts` | Logica de 3 pasos |
| `verification.page.html` | UI con badge HABIL |
| `verification.page.scss` | Estilos con animaciones |
| `nurse.service.ts` | API client |
| `nurse.model.ts` | Interfaces TypeScript |

### Documentacion

| Archivo | Descripcion |
|---------|-------------|
| `docs/CEP-API.md` | Documentacion de API CEP |
| `docs/NURSE-VERIFICATION-FLOW.md` | Este documento |

---

## Testing

### Datos de Prueba

```
CEP: 108887
DNI: 44119536
Nombre esperado: CHAVEZ TORRES MARIA CLAUDIA
Estado esperado: HABIL
Region esperada: CONSEJO REGIONAL III LIMA METROPOLITANA
Foto: https://www.cep.org.pe/fotos/44119536.jpg
```

### Comando de Test

```bash
# Validar CEP manualmente
TOKEN=$(curl -sk "https://www.cep.org.pe/validar/" | grep 'name="token"' | sed 's/.*value="\([^"]*\)".*/\1/')
curl -sk -X POST "https://www.cep.org.pe/validar/pagina/view.php" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Referer: https://www.cep.org.pe/validar/" \
  -d "cep=108887&token=$TOKEN"
```

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-01-15 | Implementacion inicial con endpoint view.php |
| 2026-01-15 | Agregado soporte para estado HABIL/INHABILITADO |
| 2026-01-15 | Agregado campo region del CEP |
| 2026-01-15 | Badge HABIL en frontend con animacion |

---

**Documentado por:** Claude Code
**Fecha:** 2026-01-15
**Version:** 1.0
