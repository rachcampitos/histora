# Histora Care - Flujos de Usuario

## Descripción General

Histora Care es una aplicación móvil que conecta pacientes con enfermeras profesionales para servicios de atención médica a domicilio en Perú.

---

## Roles de Usuario

### 1. Paciente
- Usuario que busca y solicita servicios de enfermería
- Puede ver perfiles de enfermeras, solicitar servicios y dejar reseñas

### 2. Enfermera
- Profesional de enfermería verificada (CEP)
- Ofrece servicios a domicilio y gestiona su disponibilidad

---

## Flujo del Paciente

### 1. Registro e Inicio de Sesión

```
[Pantalla de Login]
       |
       |-- Tiene cuenta? --> Ingresar email/password --> [Dashboard]
       |
       |-- No tiene cuenta? --> [Registro]
                                    |
                                    |-- Registro tradicional
                                    |   - Nombre
                                    |   - Email
                                    |   - Teléfono
                                    |   - Contraseña
                                    |   - Aceptar términos
                                    |
                                    |-- Registro con Google
                                        - Autenticación OAuth
                                        - Completar datos faltantes
                                        |
                                        v
                               [Dashboard/Mapa]
```

### 2. Navegación Principal (Tabs)

```
[Tab Bar]
    |
    |-- 🏠 Inicio (Home)     --> Dashboard principal (entrada después de login)
    |
    |-- 🗺️ Buscar (Mapa)     --> Búsqueda de enfermeras cercanas
    |
    |-- ⚙️ Ajustes           --> Configuración y perfil
```

### 2.1 Home del Paciente (Pantalla Principal)

```
┌─────────────────────────────────────┐
│  👋 Hola, [Nombre]                  │
│  ¿Qué necesitas hoy?                │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │  🗺️  BUSCAR ENFERMERA         │  │
│  │  Encuentra profesionales      │  │
│  │  cerca de ti                  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ 📋       │  │ ❤️       │        │
│  │ Historial│  │ Favoritas│        │
│  └──────────┘  └──────────┘        │
├─────────────────────────────────────┤
│  📌 Solicitud Activa (si hay)       │
│  ┌─────────────────────────────────┐│
│  │ 👩‍⚕️ María López                 ││
│  │ Inyección · En camino 🟢        ││
│  │ [Ver seguimiento →]             ││
│  └─────────────────────────────────┘│
├─────────────────────────────────────┤
│  🕐 Enfermeras Recientes            │
│  ○ ○ ○ ○  (avatars para rebooking) │
├─────────────────────────────────────┤
│  💡 Tip de Salud                   │
│  "Mantén tus vacunas al día..."    │
└─────────────────────────────────────┘
```

Elementos del Home:
- **Saludo personalizado**: Muestra el nombre del usuario
- **Card principal**: Acceso rápido al mapa de búsqueda
- **Acciones rápidas**: Historial y Favoritas
- **Solicitud activa**: Si hay una solicitud en progreso, se muestra con estado
- **Enfermeras recientes**: Para re-agendar fácilmente
- **Tip de salud**: Consejos rotativos de bienestar

### 3. Búsqueda de Enfermeras

```
[Mapa]
    |
    |-- Se obtiene ubicación del usuario (GPS)
    |
    |-- Se muestran enfermeras cercanas en el mapa
    |   - Marcadores con avatar
    |   - Indicador de disponibilidad (verde/gris)
    |
    |-- Filtros disponibles:
    |   - Tipo de servicio (Inyecciones, Curaciones, etc.)
    |   - Radio de búsqueda (5-20 km)
    |
    |-- Al tocar un marcador:
        |
        v
    [Tarjeta de Enfermera]
        - Nombre y avatar
        - Rating y reseñas
        - Especialidades
        - Servicios destacados
        - Botón "Ver Perfil"
        - Botón "Solicitar Servicio"
```

### 4. Ver Perfil de Enfermera

```
[Perfil de Enfermera]
    |
    |-- Cabecera
    |   - Avatar
    |   - Nombre
    |   - Rating
    |   - Verificación CEP
    |   - Disponibilidad
    |
    |-- Acerca de
    |   - Biografía
    |
    |-- Especialidades
    |   - Lista de chips
    |
    |-- Servicios disponibles
    |   - Nombre, categoría, duración, precio
    |
    |-- Zona de servicio
    |   - Ubicación
    |   - Radio
    |   - Horario
    |
    |-- Estadísticas
    |   - Servicios completados
    |   - Calificación promedio
    |   - Total de reseñas
    |
    |-- Reseñas de pacientes
    |   - Lista de reseñas con rating y comentario
    |
    |-- [Botón] Solicitar Servicio
```

### 5. Solicitar Servicio

```
[Formulario de Solicitud]
    |
    |-- Seleccionar servicio
    |
    |-- Indicar dirección
    |   - Usar ubicación actual
    |   - Ingresar manualmente
    |
    |-- Seleccionar fecha y hora
    |
    |-- Agregar notas/síntomas
    |
    |-- Confirmar solicitud
        |
        v
    [Solicitud Enviada]
        - Esperando confirmación de enfermera
        - Notificación push cuando responda
```

### 6. Seguimiento de Servicio

```
[Pantalla de Tracking]
    |
    |-- Estado de la solicitud:
    |   - Pendiente
    |   - Aceptada
    |   - En camino
    |   - En servicio
    |   - Completado
    |
    |-- Mapa con ubicación de enfermera (si aplica)
    |
    |-- Chat con enfermera
    |
    |-- [Al completar] --> Dejar reseña
```

### 7. Historial de Servicios

```
[Historial]
    |
    |-- Lista de servicios pasados
    |   - Fecha
    |   - Enfermera
    |   - Servicio
    |   - Estado
    |   - Precio
    |
    |-- Filtros por estado/fecha
    |
    |-- Ver detalle --> [Resumen del servicio]
```

---

## Flujo de la Enfermera

### 1. Registro e Inicio de Sesión

```
[Pantalla de Login]
       |
       |-- Tiene cuenta? --> Ingresar email/password --> [Dashboard]
       |
       |-- No tiene cuenta? --> [Registro Enfermera]
                                    |
                                    |-- Datos personales
                                    |   - Nombre
                                    |   - Email
                                    |   - Teléfono
                                    |   - Contraseña
                                    |
                                    |-- Datos profesionales
                                    |   - Número CEP
                                    |   - Años de experiencia
                                    |   - Especialidades
                                    |
                                    |-- Verificación CEP
                                    |   - Validación automática
                                    |
                                    v
                               [Dashboard]
```

### 2. Navegación Principal

```
[Menú/Navegación]
    |
    |-- 🏠 Dashboard         --> Vista general
    |
    |-- 📋 Solicitudes       --> Solicitudes de pacientes
    |
    |-- 💼 Mis Servicios     --> Gestión de servicios ofrecidos
    |
    |-- 👤 Perfil            --> Editar información profesional
    |
    |-- 💰 Ganancias         --> Historial de pagos
```

### 3. Dashboard

```
[Dashboard]
    |
    |-- Estado de disponibilidad (toggle)
    |
    |-- Solicitudes pendientes
    |   - Badge con cantidad
    |
    |-- Próximo servicio agendado
    |
    |-- Estadísticas del día/semana
    |   - Servicios completados
    |   - Ganancias
```

### 4. Gestión de Solicitudes

```
[Solicitudes]
    |
    |-- Tabs:
    |   - Pendientes
    |   - Aceptadas
    |   - Historial
    |
    |-- Cada solicitud muestra:
    |   - Paciente
    |   - Servicio solicitado
    |   - Fecha/hora
    |   - Ubicación
    |   - Notas
    |
    |-- Acciones:
        |-- Aceptar --> [Confirmar] --> Agregada a agenda
        |
        |-- Rechazar --> [Motivo] --> Notifica al paciente
        |
        |-- Ver detalle --> [Información completa]
```

### 5. Gestión de Servicios

```
[Mis Servicios]
    |
    |-- Lista de servicios ofrecidos
    |   - Nombre
    |   - Categoría
    |   - Precio
    |   - Duración
    |   - Activo/Inactivo
    |
    |-- [+] Agregar servicio
    |       |
    |       |-- Nombre del servicio
    |       |-- Categoría (Inyecciones, Curaciones, etc.)
    |       |-- Descripción
    |       |-- Precio (S/)
    |       |-- Duración estimada
    |       |-- Guardar
    |
    |-- Editar servicio existente
    |
    |-- Activar/Desactivar servicio
```

### 6. Perfil Profesional

```
[Perfil]
    |
    |-- Foto de perfil
    |
    |-- Información personal
    |   - Nombre
    |   - Teléfono
    |
    |-- Información profesional
    |   - Número CEP (no editable)
    |   - Años de experiencia
    |   - Biografía
    |   - Especialidades
    |
    |-- Ubicación y servicio
    |   - Zona de servicio
    |   - Radio de cobertura
    |   - Horario disponible
```

### 7. Ganancias

```
[Ganancias]
    |
    |-- Resumen del período
    |   - Total bruto
    |   - Comisión plataforma
    |   - Neto a recibir
    |
    |-- Filtros:
    |   - Hoy
    |   - Esta semana
    |   - Este mes
    |   - Personalizado
    |
    |-- Lista de servicios con pago
    |   - Fecha
    |   - Servicio
    |   - Paciente
    |   - Monto
```

---

## Estados de una Solicitud de Servicio

```
[PENDING] --> [ACCEPTED] --> [IN_PROGRESS] --> [COMPLETED]
    |              |
    |              |-- [CANCELLED] (por enfermera)
    |
    |-- [REJECTED] (por enfermera)
    |
    |-- [CANCELLED] (por paciente)
```

| Estado | Descripción |
|--------|-------------|
| `PENDING` | Solicitud enviada, esperando respuesta de enfermera |
| `ACCEPTED` | Enfermera aceptó, servicio agendado |
| `REJECTED` | Enfermera rechazó la solicitud |
| `IN_PROGRESS` | Enfermera en camino o realizando servicio |
| `COMPLETED` | Servicio finalizado exitosamente |
| `CANCELLED` | Cancelado por paciente o enfermera |

---

## Categorías de Servicios

| Código | Nombre | Descripción |
|--------|--------|-------------|
| `injection` | Inyecciones | Administración de medicamentos inyectables |
| `wound_care` | Curaciones | Limpieza y cuidado de heridas |
| `catheter` | Catéter/Sonda | Colocación y mantenimiento de catéteres |
| `vital_signs` | Signos Vitales | Control de presión, temperatura, etc. |
| `iv_therapy` | Terapia IV | Administración intravenosa |
| `blood_draw` | Toma de Sangre | Extracción de muestras |
| `medication` | Medicación | Administración de medicamentos |
| `elderly_care` | Cuidado Adulto Mayor | Atención especializada |
| `post_surgery` | Post-Operatorio | Cuidados post quirúrgicos |
| `other` | Otro | Otros servicios |

---

## Notificaciones

### Para Pacientes
- Solicitud aceptada/rechazada
- Enfermera en camino
- Servicio completado
- Recordatorio de reseña

### Para Enfermeras
- Nueva solicitud de servicio
- Paciente canceló solicitud
- Recordatorio de servicio próximo
- Nueva reseña recibida

---

## Rutas de la Aplicación

### Paciente
```
/patient/tabs/home       --> Home (pantalla principal, entrada después de login)
/patient/tabs/map        --> Mapa (búsqueda de enfermeras)
/patient/tabs/history    --> Historial de servicios
/patient/tabs/settings   --> Ajustes y configuración
/patient/search?nurseId= --> Perfil de enfermera (fuera de tabs)
/patient/request?nurseId= --> Solicitar servicio (fuera de tabs)
/patient/tracking/:id    --> Seguimiento de servicio (fuera de tabs)
```

### Enfermera
```
/nurse/dashboard         --> Dashboard principal
/nurse/requests          --> Solicitudes
/nurse/services          --> Mis servicios
/nurse/profile           --> Mi perfil
/nurse/earnings          --> Ganancias
```

---

## Tecnologías Utilizadas

- **Frontend**: Ionic 8 + Angular 20 + Capacitor 8
- **Backend**: NestJS + MongoDB
- **Mapas**: Mapbox GL JS
- **Autenticación**: JWT + Google OAuth
- **Notificaciones**: Push notifications (FCM)
- **Pagos**: Próximamente (integración con pasarela local)
