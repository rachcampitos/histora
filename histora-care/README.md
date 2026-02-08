# NurseLite

Aplicacion movil para servicios de enfermeria a domicilio, construida con **Ionic 8**, **Angular 20** y **Capacitor**.

## Descripcion

NurseLite conecta pacientes con enfermeras profesionales para servicios de salud a domicilio. La app incluye:

- **Para Pacientes**: Busqueda de enfermeras cercanas en mapa, solicitud de servicios, seguimiento en tiempo real
- **Para Enfermeras**: Dashboard con solicitudes, gestion de disponibilidad, ganancias y perfil profesional

## Tecnologias

| Tecnologia | Version | Uso |
|------------|---------|-----|
| Angular | 20.x | Framework frontend |
| Ionic | 8.x | Componentes UI mobile |
| Capacitor | 8.x | Acceso a APIs nativas |
| Mapbox GL | 3.x | Mapas y rutas |
| Socket.IO | 4.x | Tiempo real |
| TypeScript | 5.9 | Tipado estatico |

## Requisitos

- Node.js 22+
- npm 10+
- Xcode (para iOS)
- Android Studio (para Android)
- Cuenta de Mapbox (API key)

## Instalacion

```bash
# Clonar repositorio
git clone <repo-url>
cd histora-care

# Instalar dependencias
npm install

# Copiar variables de entorno
cp src/environments/environment.example.ts src/environments/environment.ts
# Editar environment.ts con tu API key de Mapbox
```

## Desarrollo

### En navegador (recomendado para desarrollo rapido)

```bash
ionic serve
# Abre en http://localhost:8100
```

Usa las DevTools del navegador (F12) > Toggle Device Toolbar para simular movil.

### En simulador iOS

```bash
ionic capacitor run ios --livereload
```

### En emulador Android

```bash
ionic capacitor run android --livereload
```

### Sincronizar cambios nativos

```bash
ionic capacitor sync
```

## Build de Produccion

```bash
# Build web
ionic build --prod

# Preparar para iOS
ionic capacitor copy ios
ionic capacitor open ios

# Preparar para Android
ionic capacitor copy android
ionic capacitor open android
```

## Estructura del Proyecto

```
src/
├── app/
│   ├── auth/                    # Autenticacion
│   │   ├── login/               # Pantalla de login
│   │   └── register/            # Pantalla de registro
│   ├── core/                    # Servicios y utilidades
│   │   ├── guards/              # Auth guards
│   │   ├── interceptors/        # HTTP interceptors
│   │   ├── models/              # Interfaces TypeScript
│   │   └── services/            # Servicios core
│   │       ├── api.service.ts           # Cliente HTTP base
│   │       ├── auth.service.ts          # Autenticacion
│   │       ├── geolocation.service.ts   # GPS/ubicacion
│   │       ├── mapbox.service.ts        # Mapas y rutas
│   │       ├── nurse.service.ts         # Datos de enfermeras
│   │       ├── service-request.service.ts # Solicitudes
│   │       ├── storage.service.ts       # Almacenamiento local
│   │       └── websocket.service.ts     # Tiempo real
│   ├── nurse/                   # Modulo enfermeras
│   │   ├── dashboard/           # Dashboard principal
│   │   ├── requests/            # Solicitudes entrantes
│   │   ├── services/            # Servicios ofrecidos
│   │   ├── earnings/            # Ganancias
│   │   ├── availability/        # Disponibilidad
│   │   └── profile/             # Perfil profesional
│   ├── patient/                 # Modulo pacientes
│   │   ├── map/                 # Mapa con enfermeras cercanas
│   │   ├── search/              # Busqueda de servicios
│   │   ├── request/             # Solicitar servicio
│   │   ├── tracking/            # Seguimiento en tiempo real
│   │   └── history/             # Historial de servicios
│   ├── shared/                  # Componentes compartidos
│   │   ├── components/          # Componentes reutilizables
│   │   └── pipes/               # Pipes personalizados
│   └── home/                    # Splash screen
├── assets/                      # Assets estaticos
│   ├── icon/                    # Iconos de la app
│   └── images/                  # Imagenes
├── theme/                       # Temas y estilos
│   └── variables.scss           # Variables CSS Ionic
├── environments/                # Configuracion por entorno
├── global.scss                  # Estilos globales
└── index.html                   # HTML principal
```

## Funcionalidades

### Modulo Paciente

| Pagina | Ruta | Descripcion |
|--------|------|-------------|
| Mapa | `/patient/map` | Mapa interactivo con enfermeras cercanas usando Mapbox |
| Busqueda | `/patient/search` | Buscar servicios por categoria |
| Solicitud | `/patient/request` | Formulario para solicitar servicio |
| Tracking | `/patient/tracking` | Seguimiento en tiempo real estilo Uber |
| Historial | `/patient/history` | Historial de servicios anteriores |

### Modulo Enfermera

| Pagina | Ruta | Descripcion |
|--------|------|-------------|
| Dashboard | `/nurse/dashboard` | Metricas, mapa de ubicacion, solicitudes activas |
| Solicitudes | `/nurse/requests` | Lista de solicitudes pendientes y activas |
| Servicios | `/nurse/services` | Gestion de servicios ofrecidos |
| Ganancias | `/nurse/earnings` | Resumen de ingresos y transacciones |
| Disponibilidad | `/nurse/availability` | Configurar horarios disponibles |
| Perfil | `/nurse/profile` | Perfil profesional y documentos |

### Servicios Core

| Servicio | Descripcion |
|----------|-------------|
| `AuthService` | Login, logout, registro, manejo de sesion |
| `GeolocationService` | Obtencion de ubicacion GPS con Capacitor |
| `MapboxService` | Inicializacion de mapas, marcadores, rutas |
| `WebSocketService` | Conexion en tiempo real para tracking |
| `NurseService` | CRUD de enfermeras y busqueda cercana |
| `ServiceRequestService` | Crear, actualizar, cancelar solicitudes |
| `StorageService` | Almacenamiento local con Preferences |
| `ApiService` | Cliente HTTP base con interceptors |

## Tiempo Real

La app usa Socket.IO para:

- **Tracking de enfermera**: La ubicacion de la enfermera se actualiza cada 5 segundos
- **Actualizacion de estado**: Cambios de estado del servicio (aceptado, en camino, llegada, etc.)
- **Notificaciones**: Alertas de nuevas solicitudes para enfermeras

### Eventos WebSocket

```typescript
// Enfermera emite ubicacion
socket.emit('nurse:location', { lat, lng, nurseId });

// Paciente escucha ubicacion
socket.on('nurse:location:update', (location) => {
  // Actualizar marcador en mapa
});

// Cambio de estado
socket.on('request:status:update', (status) => {
  // Actualizar UI
});
```

## Mapbox

### Configuracion

1. Crear cuenta en [mapbox.com](https://www.mapbox.com)
2. Obtener Access Token
3. Agregar a `environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  mapboxToken: 'pk.xxx...'
};
```

### Funcionalidades del Mapa

- Visualizacion de enfermeras cercanas con marcadores personalizados
- Calculo de rutas con Mapbox Directions API
- Animacion de marcadores en movimiento
- Clustering de marcadores para muchas enfermeras
- Estilos de mapa claro/oscuro segun tema del sistema

## Accesibilidad (WCAG 2.1 AA)

La app cumple con estandares de accesibilidad:

- **Focus visible**: Outline de 3px en elementos focusables
- **ARIA labels**: Todos los botones de solo icono tienen labels descriptivos
- **Roles semanticos**: Uso correcto de `role="button"`, `role="dialog"`, etc.
- **Errores de formulario**: `aria-invalid` y `aria-describedby` en inputs
- **Reduced motion**: Respeta preferencia de usuario para animaciones
- **Contraste**: Colores con ratio 4.5:1 minimo
- **Screen reader**: Clase `.sr-only` para texto solo para lectores

## Variables de Entorno

Crear `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'ws://localhost:3000',
  mapboxToken: 'pk.eyJ1...',
  defaultLocation: {
    lat: -12.0464,  // Lima, Peru
    lng: -77.0428
  }
};
```

## Scripts Disponibles

| Comando | Descripcion |
|---------|-------------|
| `npm start` | Servidor de desarrollo (alias: `ionic serve`) |
| `npm run build` | Build de produccion |
| `npm test` | Tests unitarios con Karma |
| `npm run lint` | Linter ESLint |
| `ionic capacitor sync` | Sincronizar web con proyectos nativos |
| `ionic capacitor run ios` | Ejecutar en iOS |
| `ionic capacitor run android` | Ejecutar en Android |

## Plugins Capacitor

| Plugin | Uso |
|--------|-----|
| `@capacitor/geolocation` | Ubicacion GPS |
| `@capacitor/camera` | Tomar fotos para perfil |
| `@capacitor/push-notifications` | Notificaciones push |
| `@capacitor/network` | Estado de conexion |
| `@capacitor/preferences` | Almacenamiento local |
| `@capacitor/haptics` | Feedback haptico |
| `@capacitor/splash-screen` | Splash screen nativo |
| `@capacitor/status-bar` | Personalizar status bar |

## Integracion con Backend

Esta app se conecta con `histora-back` (NestJS). Asegurate de tener el backend corriendo antes de usar la app:

```bash
cd ../histora-back
npm run start:dev
```

### Endpoints Principales

- `POST /auth/login` - Iniciar sesión
- `POST /auth/register/patient` - Registro de paciente
- `POST /auth/register/nurse/validate-cep` - Validar CEP enfermera
- `POST /auth/register/nurse/complete` - Completar registro enfermera
- `GET /nurses/nearby?lat=x&lng=y` - Enfermeras cercanas
- `POST /service-requests` - Crear solicitud
- `PATCH /service-requests/:id/status` - Actualizar estado
- `GET /service-payments/:id/summary` - Resumen de pago
- `POST /service-payments` - Procesar pago

## Funcionalidades Implementadas

- [x] Chat en tiempo real entre paciente y enfermera
- [x] Sistema de calificaciones y reseñas
- [x] Pagos integrados (Culqi - tarjetas y Yape)
- [x] Notificaciones push con FCM
- [x] Tracking GPS en tiempo real
- [x] Botón de pánico para emergencias
- [x] Verificación CEP de enfermeras
- [x] Panel de administración

## Próximos Pasos

- [ ] Modo offline con sincronización
- [ ] Soporte multi-idioma
- [ ] Historial médico del paciente

## Contribuir

1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'feat: agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## Licencia

Propietario - Todos los derechos reservados

---

Desarrollado por **Raul Campos** | nurse-lite.com
