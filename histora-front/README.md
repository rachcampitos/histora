# Histora Frontend

Frontend de la aplicación Histora, construido con Angular 19 e Ionic 8.

## Tecnologías

- **Angular 19** con signals y standalone components
- **Ionic 8** para componentes UI
- **TypeScript** con tipado estricto
- **ApexCharts** para gráficos estadísticos
- **FullCalendar** para calendario de citas
- **Karma + Jasmine** para tests unitarios

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm start
# o
ng serve
```

La aplicación estará disponible en `http://localhost:4200`

## Build de Producción

```bash
npm run build
```

## Tests

```bash
npm test                    # Tests con watch
npm test -- --no-watch      # Tests sin watch
```

## Estructura del Proyecto

```
src/
├── app/
│   ├── core/              # Servicios, guards, interceptors
│   │   ├── guards/        # Auth guards
│   │   ├── interceptors/  # HTTP interceptors
│   │   ├── models/        # Interfaces TypeScript
│   │   └── services/      # Servicios core (API, Auth, Storage)
│   ├── features/          # Módulos de features
│   │   ├── auth/          # Login, registro
│   │   ├── dashboard/     # Dashboard principal
│   │   ├── patients/      # Gestión de pacientes
│   │   ├── appointments/  # Gestión de citas
│   │   ├── consultations/ # Consultas médicas
│   │   ├── clinical-history/  # Historiales clínicos
│   │   └── settings/      # Configuración
│   ├── layouts/           # Layouts de la app
│   │   ├── main-layout/   # Layout principal con sidebar
│   │   └── auth-layout/   # Layout para auth
│   └── shared/            # Componentes compartidos
├── theme/                 # Estilos y temas
│   ├── variables.css      # Variables CSS Ionic
│   └── cliniva/           # Estilos del tema
└── styles.scss            # Estilos globales
```

## Características

### Layout Principal
- Sidebar colapsable con navegación
- Header con búsqueda y usuario
- Panel de configuración de tema

### Dashboard
- Métricas de pacientes, citas y consultas
- Gráficos de estadísticas (ApexCharts)
- Lista de citas de hoy
- Accesos rápidos

### Gestión de Pacientes
- Lista con búsqueda y paginación
- Detalle completo del paciente
- Formulario de creación/edición

### Gestión de Citas
- Vista por día/semana/todas
- Calendario interactivo
- Estados de cita (programada, confirmada, completada)

### Historiales Clínicos
- Vista detallada con acordeones
- Alergias, condiciones crónicas
- Historial de cirugías y vacunas

### Accesibilidad (WCAG 2.1 AA)
- Skip links
- Focus visible
- Roles ARIA
- Etiquetas accesibles
- Soporte para reduced motion

## Variables de Entorno

Crear archivo `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm test` | Tests unitarios |
| `npm run lint` | Linter ESLint |
