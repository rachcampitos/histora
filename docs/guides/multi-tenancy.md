# Multi-Tenancy

Histora implementa multi-tenancy a nivel de base de datos para aislar los datos de cada clínica.

## Concepto

Cada clínica (tenant) tiene sus propios:
- Pacientes
- Doctores
- Citas
- Historias clínicas
- Suscripción

Los datos están en la misma base de datos pero separados por `clinicId`.

## Implementación

### 1. Campo clinicId

Todos los modelos de negocio incluyen:

```typescript
@Prop({ type: Types.ObjectId, ref: 'Clinic', required: true })
clinicId: Types.ObjectId;
```

### 2. ClinicAccessGuard

Guard que verifica acceso al tenant:

```typescript
// src/auth/guards/clinic-access.guard.ts

@Injectable()
export class ClinicAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Platform admins pueden acceder a todo
    if (user.role === UserRole.PLATFORM_ADMIN) {
      return true;
    }

    // Usuarios deben tener clinicId
    if (!user.clinicId) {
      throw new ForbiddenException('User not associated with clinic');
    }

    return true;
  }
}
```

### 3. Decorator @CurrentUser

Obtiene el usuario actual con su clinicId:

```typescript
// En controllers
@Get()
findAll(@CurrentUser() user: CurrentUserData) {
  // user.clinicId está disponible
  return this.service.findAll(user.clinicId);
}
```

### 4. Queries con clinicId

Todos los servicios filtran por clinicId:

```typescript
// En services
async findAll(clinicId: string): Promise<Patient[]> {
  return this.patientModel
    .find({ clinicId, isDeleted: false })
    .exec();
}

async findOne(id: string, clinicId: string): Promise<Patient> {
  const patient = await this.patientModel
    .findOne({ _id: id, clinicId, isDeleted: false })
    .exec();

  if (!patient) {
    throw new NotFoundException('Patient not found');
  }
  return patient;
}
```

## Flujo de Request

```
1. Request llega con JWT token
2. JwtAuthGuard valida token
3. JwtStrategy extrae clinicId del payload
4. RolesGuard verifica permisos
5. ClinicAccessGuard verifica tenant
6. Controller recibe user con clinicId
7. Service filtra por clinicId
8. Solo datos del tenant son retornados
```

## Seguridad

### Lo que se previene:

1. **Acceso cruzado**: Usuario de Clínica A no puede ver datos de Clínica B
2. **Escalación**: Staff no puede acceder a recursos de otra clínica
3. **Fuga de datos**: Queries siempre filtran por clinicId

### Indexes

Todos los modelos tienen index en clinicId:

```typescript
PatientSchema.index({ clinicId: 1 });
PatientSchema.index({ clinicId: 1, email: 1 });
```

## Excepciones

### Endpoints Públicos

Algunos endpoints no requieren clinicId:

```typescript
@Controller('public/doctors')
export class PublicDoctorsController {
  @Get()
  @Public()  // Sin autenticación
  findPublicDoctors() {
    return this.doctorsService.findPublicDoctors();
  }
}
```

### Platform Admin

Administradores pueden acceder a cualquier clínica:

```typescript
if (user.role === UserRole.PLATFORM_ADMIN) {
  // Puede pasar cualquier clinicId
  return true;
}
```

## Testing

Mock del usuario con clinicId:

```typescript
const mockUser = {
  userId: 'user-123',
  email: 'test@test.com',
  role: UserRole.CLINIC_OWNER,
  clinicId: 'clinic-123'  // Importante!
};
```

Test de aislamiento:

```typescript
it('should not find patient from different clinic', async () => {
  // Paciente de clinic-A
  await service.create('clinic-A', patientDto);

  // Buscar desde clinic-B
  await expect(
    service.findOne('patient-id', 'clinic-B')
  ).rejects.toThrow(NotFoundException);
});
```
