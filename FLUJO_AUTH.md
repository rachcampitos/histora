# Flujo de Autenticación - Histora

## Resumen

Este documento describe el flujo de autenticación de la plataforma Histora, incluyendo los diferentes tipos de usuarios y cómo cada uno se registra y accede al sistema.

## Tipos de Usuarios

### 1. Médico / Dueño de Consultorio (`clinic_owner`)
- **Cómo se registra**: Desde la página de registro (`/authentication/signup`)
- **Selecciona**: "Soy Médico"
- **Datos requeridos**:
  - Nombre y apellido
  - Correo electrónico
  - Teléfono (opcional)
  - Contraseña (mínimo 8 caracteres)
  - Nombre del consultorio
  - Teléfono del consultorio (opcional)
- **Qué sucede al registrarse**:
  1. Se crea un usuario con rol `clinic_owner`
  2. Se crea una clínica asociada al usuario
  3. Se inicia un período de prueba de 14 días
  4. Recibe tokens de acceso y es redirigido a `/doctor/dashboard`
- **Endpoint**: `POST /auth/register`

### 2. Médico Empleado (`clinic_doctor`)
- **Cómo se registra**: NO se auto-registra
- **Flujo**:
  1. El dueño del consultorio lo invita desde el panel de administración
  2. Recibe un correo con un enlace para completar su cuenta
  3. Establece su contraseña y completa su perfil
- **Permisos**: Puede ver y gestionar pacientes, citas y consultas de su clínica

### 3. Personal Administrativo (`clinic_staff`)
- **Cómo se registra**: NO se auto-registra
- **Flujo**: Similar al médico empleado, es invitado por el dueño del consultorio
- **Permisos**: Limitados según configuración de la clínica

### 4. Paciente (`patient`)
- **Cómo se registra**: Desde la página de registro (`/authentication/signup`)
- **Selecciona**: "Soy Paciente"
- **Datos requeridos**:
  - Nombre y apellido
  - Correo electrónico
  - Teléfono (opcional)
  - Contraseña (mínimo 8 caracteres)
- **Qué sucede al registrarse**:
  1. Se crea un usuario con rol `patient`
  2. Recibe tokens de acceso y es redirigido a `/patient/dashboard`
- **Endpoint**: `POST /auth/register/patient`

### 5. Administrador de Plataforma (`platform_admin`)
- **Cómo se registra**: NO se auto-registra
- **Creación**: Solo mediante acceso directo a la base de datos o scripts de administración
- **Acceso**: `/admin/dashboard`

## Flujo de Login

1. Usuario accede a `/authentication/signin`
2. Ingresa correo electrónico y contraseña
3. Opcionalmente marca "Recordarme" para sesión extendida
4. El sistema valida credenciales con `POST /auth/login`
5. Al éxito, recibe:
   - `access_token`: JWT para autenticación (expira en 15 min o 7 días si "Recordarme")
   - `refresh_token`: Para renovar el access_token
   - `user`: Datos del usuario incluyendo rol
6. Según el rol, se redirige a:
   - `platform_admin` → `/admin/dashboard`
   - `clinic_owner` / `clinic_doctor` → `/doctor/dashboard`
   - `patient` → `/patient/dashboard`

## Recuperación de Contraseña

1. Usuario accede a `/authentication/forgot-password`
2. Ingresa su correo electrónico
3. Sistema envía email con enlace de recuperación (válido por 1 hora)
4. Usuario accede al enlace → `/authentication/reset-password?token=xxx`
5. Ingresa nueva contraseña
6. Sistema actualiza la contraseña y redirige al login

## Login con Google (OAuth)

1. Usuario hace clic en "Continuar con Google"
2. Se redirige a `GET /auth/google` → Google OAuth
3. Usuario autoriza en Google
4. Google redirige a `GET /auth/google/callback`
5. Backend procesa la autenticación:
   - Si el email existe → login
   - Si el email no existe → registro automático como paciente
6. Redirige al frontend con tokens en URL: `/#/auth/google/callback?access_token=...`
7. Frontend almacena tokens y redirige según rol

## Tokens y Sesiones

### Access Token
- Tipo: JWT
- Duración normal: 15 minutos
- Duración con "Recordarme": 7 días
- Uso: Header `Authorization: Bearer <token>`

### Refresh Token
- Tipo: String único
- Duración: 30 días
- Uso: `POST /auth/refresh` para obtener nuevo access_token
- Rotación: Cada refresh genera un nuevo refresh_token

## Roles y Permisos

| Rol | Código | Permisos |
|-----|--------|----------|
| Platform Admin | `platform_admin` | Acceso total a la plataforma |
| Clinic Owner | `clinic_owner` | Gestión completa de su clínica |
| Clinic Doctor | `clinic_doctor` | Ver/editar pacientes y citas de su clínica |
| Clinic Staff | `clinic_staff` | Permisos limitados según configuración |
| Patient | `patient` | Ver su historial y agendar citas |

## Endpoints de Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registro de médico/clínica |
| POST | `/auth/register/patient` | Registro de paciente |
| POST | `/auth/login` | Inicio de sesión |
| POST | `/auth/refresh` | Renovar access token |
| GET | `/auth/me` | Obtener perfil actual |
| POST | `/auth/forgot-password` | Solicitar recuperación |
| POST | `/auth/reset-password` | Restablecer contraseña |
| GET | `/auth/google` | Iniciar OAuth con Google |
| GET | `/auth/google/callback` | Callback de Google OAuth |

## Seguridad

- Contraseñas hasheadas con bcrypt (10 rounds)
- Tokens JWT firmados con secret
- Refresh tokens almacenados en base de datos
- Rate limiting en endpoints de autenticación
- HTTPS obligatorio en producción
- CORS configurado para dominios permitidos

## Archivos Relevantes

### Backend (NestJS)
- `src/auth/auth.controller.ts` - Controlador de endpoints
- `src/auth/auth.service.ts` - Lógica de autenticación
- `src/auth/dto/register.dto.ts` - DTOs de registro
- `src/auth/strategies/` - Estrategias de Passport (JWT, Google)
- `src/common/guards/` - Guards de autenticación

### Frontend (Angular)
- `src/app/authentication/signin/` - Página de login
- `src/app/authentication/signup/` - Página de registro
- `src/app/authentication/forgot-password/` - Recuperar contraseña
- `src/app/authentication/reset-password/` - Restablecer contraseña
- `src/app/auth/google-callback/` - Callback de Google OAuth
- `src/app/core/service/auth.service.ts` - Servicio de autenticación
- `src/app/core/service/login.service.ts` - Servicio de login/registro
