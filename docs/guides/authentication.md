# Autenticación y Autorización

## Overview

Histora usa JWT (JSON Web Tokens) para autenticación y un sistema de roles para autorización.

## Flujo de Autenticación

```
┌─────────┐     POST /auth/login      ┌─────────┐
│ Cliente │ ───────────────────────▶ │ Backend │
└─────────┘   email + password        └─────────┘
                                           │
                                           ▼
                                    Valida credenciales
                                           │
                                           ▼
┌─────────┐     { access_token }      ┌─────────┐
│ Cliente │ ◀─────────────────────── │ Backend │
└─────────┘                           └─────────┘
     │
     │ Guarda token
     ▼
┌─────────┐  Authorization: Bearer    ┌─────────┐
│ Cliente │ ───────────────────────▶ │ Backend │
└─────────┘        <token>            └─────────┘
```

## JWT Payload

```json
{
  "sub": "507f1f77bcf86cd799439011",
  "email": "doctor@email.com",
  "role": "clinic_owner",
  "clinicId": "507f1f77bcf86cd799439012",
  "iat": 1704067200,
  "exp": 1704672000
}
```

## Guards

### JwtAuthGuard

Valida que el token JWT sea válido:

```typescript
@Controller('patients')
@UseGuards(JwtAuthGuard)  // Requiere autenticación
export class PatientsController {
  // ...
}
```

### RolesGuard

Verifica que el usuario tenga el rol requerido:

```typescript
@Post()
@Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
create(@Body() dto: CreatePatientDto) {
  // Solo clinic_owner y clinic_doctor pueden crear
}
```

### ClinicAccessGuard

Verifica acceso al tenant:

```typescript
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard, ClinicAccessGuard)
export class PatientsController {
  // Todas las operaciones filtradas por clinicId
}
```

## Decorators

### @Public()

Marca endpoint como público (sin autenticación):

```typescript
@Get('plans')
@Public()
getAllPlans() {
  // Cualquiera puede ver los planes
}
```

### @Roles()

Define roles permitidos:

```typescript
@Delete(':id')
@Roles(UserRole.CLINIC_OWNER)  // Solo el dueño puede eliminar
remove(@Param('id') id: string) {
  // ...
}
```

### @CurrentUser()

Obtiene el usuario autenticado:

```typescript
@Get('profile')
getProfile(@CurrentUser() user: CurrentUserData) {
  return {
    userId: user.userId,
    email: user.email,
    role: user.role,
    clinicId: user.clinicId
  };
}

// O extraer solo un campo
@Get('my-clinic')
getMyClinic(@CurrentUser('clinicId') clinicId: string) {
  return this.clinicsService.findById(clinicId);
}
```

## Roles del Sistema

| Rol | Código | Permisos |
|-----|--------|----------|
| Platform Admin | `platform_admin` | Acceso total, cualquier clínica |
| Clinic Owner | `clinic_owner` | Gestión completa de su clínica |
| Clinic Doctor | `clinic_doctor` | CRUD pacientes, citas, historias |
| Clinic Staff | `clinic_staff` | Agendar citas, registrar pacientes |
| Patient | `patient` | Ver su historial, agendar citas |

## Matriz de Permisos

| Recurso | Owner | Doctor | Staff | Patient |
|---------|-------|--------|-------|---------|
| Crear paciente | ✅ | ✅ | ✅ | ❌ |
| Ver pacientes | ✅ | ✅ | ✅ | ❌ |
| Crear doctor | ✅ | ❌ | ❌ | ❌ |
| Ver doctores | ✅ | ✅ | ✅ | ❌ |
| Crear cita | ✅ | ✅ | ✅ | ✅* |
| Cancelar cita | ✅ | ✅ | ✅ | ✅* |
| Historia clínica | ✅ | ✅ | ❌ | ✅* |
| Gestionar suscripción | ✅ | ❌ | ❌ | ❌ |

*Solo sus propios recursos

## Configuración

### Variables de Entorno

```env
JWT_SECRET=clave-secreta-muy-segura-cambiar-en-produccion
JWT_EXPIRES_IN=7d
```

### JwtStrategy

```typescript
// src/auth/strategies/jwt.strategy.ts

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findByEmail(payload.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      clinicId: payload.clinicId,
    };
  }
}
```

## Manejo de Errores

| Código | Situación |
|--------|-----------|
| 401 Unauthorized | Token inválido o expirado |
| 403 Forbidden | Rol sin permisos suficientes |
| 403 Forbidden | Acceso a otra clínica |

## Seguridad

1. **Tokens cortos**: 7 días por defecto
2. **Refresh tokens**: Pendiente de implementar
3. **Password hashing**: bcrypt con salt
4. **HTTPS**: Requerido en producción
5. **Rate limiting**: Pendiente de implementar
