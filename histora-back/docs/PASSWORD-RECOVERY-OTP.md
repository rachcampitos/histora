# Sistema de Recuperación de Contraseña con OTP

## Descripción General

Sistema de recuperación de contraseña basado en códigos OTP (One-Time Password) de 6 dígitos enviados por email. Reemplaza el método tradicional de "magic link" por una experiencia más familiar para usuarios peruanos (similar a códigos de BCP, Yape, Plin).

## Flujo del Usuario

```
1. Usuario hace clic en "Olvidé mi contraseña"
   ↓
2. Ingresa su email
   ↓
3. Recibe código de 6 dígitos por email
   ↓
4. Ingresa el código en la app (10 minutos para expirar)
   ↓
5. Si es válido, puede crear nueva contraseña
   ↓
6. Contraseña actualizada, redirige a login
```

## Endpoints del Backend

### 1. Solicitar OTP
```http
POST /api/auth/password-reset/request-otp
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "platform": "histora-care"  // o "histora-front"
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Se ha enviado un código de verificación a tu correo electrónico"
}
```

**Errores:**
- `404`: Email no registrado
- `401`: Cuenta desactivada

### 2. Verificar OTP
```http
POST /api/auth/password-reset/verify-otp
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "otp": "123456"
}
```

**Respuesta exitosa (200):**
```json
{
  "valid": true,
  "message": "Código verificado correctamente"
}
```

**Errores:**
- `401`: Código inválido o expirado (incluye intentos restantes)

### 3. Restablecer Contraseña con OTP
```http
POST /api/auth/password-reset/reset-with-otp
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "otp": "123456",
  "newPassword": "NuevaPassword123!"
}
```

**Respuesta exitosa (200):**
```json
{
  "message": "Tu contraseña ha sido actualizada exitosamente"
}
```

## Configuración de Seguridad

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `OTP_EXPIRY_MINUTES` | 10 | Tiempo de vida del código |
| `MAX_OTP_ATTEMPTS` | 5 | Intentos antes de bloquear |
| `OTP_LENGTH` | 6 | Dígitos del código |

## Campos en Base de Datos (User Schema)

```typescript
// Campos agregados al User schema
passwordResetOtp?: string;           // Código OTP (plain text, corta vida)
passwordResetOtpExpires?: Date;      // Fecha de expiración
passwordResetOtpAttempts?: number;   // Contador de intentos fallidos
```

## Template de Email

El email enviado incluye:
- Nombre del usuario
- Código OTP en formato grande y legible
- Tiempo de expiración (10 minutos)
- Mensaje de seguridad si no solicitó el código
- Branding de la app (NurseLite o Histora según plataforma)

## Frontend (Histora Care)

### Ruta
```
/auth/forgot-password
```

### Componentes
- `ForgotPasswordPage` - Página principal con 3 pasos
- Step indicator visual (Email → Código → Nueva contraseña)

### Características UX
- Input de 6 dígitos separados con auto-advance
- Soporte para pegar código completo
- Temporizador de reenvío (60 segundos)
- Opción de volver atrás en cada paso
- Validación de contraseñas coincidentes
- Soporte dark mode

## Archivos Modificados/Creados

### Backend
- `src/auth/dto/reset-password.dto.ts` - DTOs para OTP
- `src/auth/auth.service.ts` - Métodos OTP
- `src/auth/auth.controller.ts` - Endpoints OTP
- `src/users/schema/user.schema.ts` - Campos OTP
- `src/users/users.service.ts` - Métodos para manejar OTP

### Frontend
- `src/app/auth/forgot-password/` - Página completa (ts, html, scss, module, routing)
- `src/app/core/services/auth.service.ts` - Métodos OTP
- `src/app/app-routing.module.ts` - Ruta agregada
- `src/app/auth/login/login.page.ts` - Navegación actualizada

## Pruebas

### Flujo Happy Path
1. Ir a `/auth/forgot-password`
2. Ingresar email válido
3. Verificar que llega el email con código
4. Ingresar código correcto
5. Crear nueva contraseña
6. Verificar login con nueva contraseña

### Casos de Error
- Email no registrado → Mensaje de error
- Código incorrecto → Muestra intentos restantes
- Código expirado → Solicitar nuevo código
- 5 intentos fallidos → Código invalidado, solicitar nuevo

## Métricas Recomendadas

```javascript
// Eventos a trackear
'password_reset_otp_requested'
'password_reset_otp_verified'
'password_reset_otp_failed'
'password_reset_completed'
```
