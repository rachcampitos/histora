# Sistema de Disponibilidad de Médicos

## Descripción General

El sistema de disponibilidad permite a los médicos configurar sus horarios de trabajo y a los pacientes ver los slots disponibles para agendar citas.

## Arquitectura

### Backend (NestJS)

#### Schema del Médico (`doctor.schema.ts`)

```typescript
// Días de la semana
enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

// Rango de tiempo (ej: 09:00 - 13:00)
class TimeSlot {
  start: string;  // Formato HH:MM (ej: "09:00")
  end: string;    // Formato HH:MM (ej: "13:00")
}

// Configuración de un día específico
class DaySchedule {
  day: DayOfWeek;           // Día de la semana
  isWorking: boolean;        // Si trabaja ese día
  slots: TimeSlot[];         // Horarios de trabajo (ej: mañana y tarde)
  breaks: TimeSlot[];        // Descansos (ej: almuerzo)
}

// Campos en el Doctor Schema
{
  workingHours: DaySchedule[];     // Configuración de horarios
  appointmentDuration: number;      // Duración de cita en minutos (default: 30)
}
```

#### Endpoints Disponibles

##### 1. Obtener Slots Disponibles
```
GET /appointments/available-slots
```

**Query Parameters:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| doctorId | string | Sí | ID del médico |
| date | string | Sí | Fecha en formato YYYY-MM-DD |

**Respuesta:**
```json
{
  "availableSlots": [
    { "startTime": "09:00", "endTime": "09:30" },
    { "startTime": "09:30", "endTime": "10:00" },
    { "startTime": "10:00", "endTime": "10:30" }
  ]
}
```

**Lógica de cálculo:**
1. Obtiene el día de la semana de la fecha solicitada
2. Busca la configuración `DaySchedule` para ese día
3. Genera slots basándose en `appointmentDuration`
4. Resta los horarios de `breaks`
5. Resta las citas ya reservadas para esa fecha
6. Retorna solo los slots disponibles

##### 2. Actualizar Horarios del Médico
```
PATCH /doctors/me
```

**Body:**
```json
{
  "workingHours": [
    {
      "day": "monday",
      "isWorking": true,
      "slots": [
        { "start": "09:00", "end": "13:00" },
        { "start": "15:00", "end": "19:00" }
      ],
      "breaks": [
        { "start": "13:00", "end": "15:00" }
      ]
    }
  ],
  "appointmentDuration": 30
}
```

### Frontend (Angular)

#### Componentes

##### 1. Configuración de Horarios (Médico)
**Ubicación:** `/doctor/profile`

El médico puede:
- Seleccionar qué días trabaja
- Configurar horarios de mañana y tarde
- Definir hora de almuerzo/descanso
- Establecer duración de cita

##### 2. Reserva de Cita (Paciente)
**Ubicación:** `/patient/appointments/book`

Flujo:
1. Paciente selecciona un médico
2. Paciente selecciona una fecha
3. Sistema llama a `GET /appointments/available-slots`
4. Se muestran solo los slots disponibles
5. Paciente selecciona un slot y completa la reserva

#### Servicios

##### AppointmentsService
```typescript
// Obtener slots disponibles
getAvailableSlots(doctorId: string, date: string): Observable<TimeSlot[]>
```

##### DoctorsService
```typescript
// Actualizar horarios de trabajo
updateWorkingHours(workingHours: DaySchedule[]): Observable<Doctor>
```

## Ejemplo de Uso

### Configuración Típica de un Médico

```json
{
  "workingHours": [
    {
      "day": "monday",
      "isWorking": true,
      "slots": [
        { "start": "09:00", "end": "13:00" },
        { "start": "15:00", "end": "19:00" }
      ],
      "breaks": []
    },
    {
      "day": "tuesday",
      "isWorking": true,
      "slots": [
        { "start": "09:00", "end": "13:00" },
        { "start": "15:00", "end": "19:00" }
      ],
      "breaks": []
    },
    {
      "day": "wednesday",
      "isWorking": true,
      "slots": [
        { "start": "09:00", "end": "14:00" }
      ],
      "breaks": []
    },
    {
      "day": "thursday",
      "isWorking": true,
      "slots": [
        { "start": "09:00", "end": "13:00" },
        { "start": "15:00", "end": "19:00" }
      ],
      "breaks": []
    },
    {
      "day": "friday",
      "isWorking": true,
      "slots": [
        { "start": "09:00", "end": "13:00" }
      ],
      "breaks": []
    },
    {
      "day": "saturday",
      "isWorking": false,
      "slots": [],
      "breaks": []
    },
    {
      "day": "sunday",
      "isWorking": false,
      "slots": [],
      "breaks": []
    }
  ],
  "appointmentDuration": 30
}
```

### Cálculo de Slots

Para el lunes con la configuración anterior y `appointmentDuration: 30`:

**Mañana (09:00 - 13:00):**
- 09:00 - 09:30
- 09:30 - 10:00
- 10:00 - 10:30
- 10:30 - 11:00
- 11:00 - 11:30
- 11:30 - 12:00
- 12:00 - 12:30
- 12:30 - 13:00

**Tarde (15:00 - 19:00):**
- 15:00 - 15:30
- 15:30 - 16:00
- 16:00 - 16:30
- 16:30 - 17:00
- 17:00 - 17:30
- 17:30 - 18:00
- 18:00 - 18:30
- 18:30 - 19:00

**Total: 16 slots disponibles** (si no hay citas previas)

## Consideraciones

1. **Zona horaria:** Los horarios se almacenan en hora local del consultorio
2. **Citas existentes:** El sistema automáticamente excluye slots con citas reservadas
3. **Duración flexible:** Cada médico puede tener diferente duración de cita
4. **Múltiples turnos:** Un día puede tener múltiples rangos (mañana/tarde)
5. **Días no laborables:** Se marca `isWorking: false` para fines de semana o días libres
