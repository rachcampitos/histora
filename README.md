# Histora App

**Histora** es una aplicación médica modular diseñada para gestionar pacientes, doctores y registros clínicos. El proyecto está construido con **NestJS** en el backend y **Angular + Ionic** en el frontend, y está orientado a resolver necesidades reales del sector salud, especialmente en el contexto peruano.

---

## Estructura del Proyecto

```
histora/
├── docs/             # Documentación técnica y normativa
├── histora-back/     # Backend con NestJS y MongoDB
├── histora-front/    # Frontend con Angular + Ionic
└── README.md
```

## Instalación y Uso

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/histora-app.git
cd histora-app
```

2. Instala dependencias:
```bash
cd histora-back && npm install
cd ../histora-front && npm install
```

3. Configura las variables de entorno en `histora-back/.env`

4. Levanta los servicios:
```bash
# Backend
cd histora-back && npm run start:dev

# Frontend
cd histora-front && npm start
```

## Arquitectura

### Backend (histora-back)
- **Framework:** NestJS con TypeScript
- **Base de datos:** MongoDB con Mongoose
- **Autenticación:** JWT con refresh token rotation
- **Documentación:** Swagger/OpenAPI
- **Tests:** Jest (279 tests unitarios)

Módulos:
- Auth (autenticación y autorización)
- Users (gestión de usuarios)
- Patients (pacientes)
- Doctors (médicos)
- Appointments (citas médicas)
- Consultations (consultas médicas)
- Clinical History (historiales clínicos)
- Payments (pagos)
- Notifications (notificaciones)
- Uploads (carga de archivos)

### Frontend (histora-front)
- **Framework:** Angular 19 con signals
- **UI Library:** Ionic 8 standalone components
- **Charts:** ApexCharts para estadísticas
- **Calendario:** FullCalendar para citas
- **Theme:** Sistema de temas claro/oscuro

Características de UI:
- Layout profesional con sidebar colapsable
- Dashboard con métricas y gráficos
- Gestión completa de pacientes y citas
- Historiales clínicos detallados
- Configuración de tema y colores
- Diseño responsive para desktop y tablet
- Cumplimiento WCAG 2.1 AA (accesibilidad)

## Estado del Proyecto

### Completado
- Backend completo con todos los módulos
- API REST documentada con Swagger
- Sistema de autenticación JWT
- Frontend con layout profesional
- Dashboard con estadísticas y gráficos
- CRUD de pacientes, citas y consultas
- Historiales clínicos
- Sistema de notificaciones
- Tests unitarios (279 backend, 118 frontend)

### En Desarrollo
- Integración con Capacitor para mobile
- Exportación de reportes PDF
- Sistema de suscripciones

## Tests

```bash
# Backend
cd histora-back && npm test

# Frontend
cd histora-front && npm test
```

## Tecnologías

| Capa | Tecnología |
|------|------------|
| Frontend | Angular 19, Ionic 8, TypeScript |
| Backend | NestJS, MongoDB, Mongoose |
| Auth | JWT, Passport, bcrypt |
| Docs | Swagger/OpenAPI |
| Tests | Jest, Karma, Jasmine |
| CI/CD | GitHub Actions |

## Licencia

Proyecto privado desarrollado por Raul Campos.