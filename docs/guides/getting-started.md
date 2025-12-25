# Getting Started

Guía para configurar y ejecutar el proyecto Histora.

## Requisitos

- Node.js 18+
- npm o yarn
- MongoDB (local o Atlas)
- Git

## Instalación

### 1. Clonar el repositorio

```bash
git clone git@github.com:rachcampitos/histora.git
cd histora
```

### 2. Backend (NestJS)

```bash
cd histora-back

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
```

### 3. Configurar variables de entorno

Editar `.env`:

```env
# Base de datos
MONGO_URL=mongodb+srv://usuario:password@cluster.mongodb.net/histora_db

# JWT
JWT_SECRET=tu-clave-secreta-muy-segura
JWT_EXPIRES_IN=7d

# App
PORT=3000
```

### 4. Ejecutar en desarrollo

```bash
# Modo desarrollo (con hot reload)
npm run start:dev

# El servidor estará en http://localhost:3000
```

### 5. Ejecutar tests

```bash
# Tests unitarios
npm test

# Tests con coverage
npm run test:cov

# Tests e2e
npm run test:e2e
```

## Estructura del Proyecto

```
histora/
├── histora-back/          # Backend NestJS
│   ├── src/
│   │   ├── auth/          # Autenticación
│   │   ├── users/         # Usuarios
│   │   ├── clinics/       # Clínicas
│   │   ├── subscriptions/ # Suscripciones
│   │   ├── patients/      # Pacientes
│   │   ├── doctors/       # Doctores
│   │   ├── appointments/  # Citas
│   │   └── clinical-history/
│   ├── test/
│   └── docs/
├── histora-front/         # Frontend Angular (pendiente)
└── docs/                  # Documentación
```

## Comandos Útiles

```bash
# Generar nuevo módulo
nest g module nombre-modulo

# Generar servicio
nest g service nombre-servicio

# Generar controller
nest g controller nombre-controller

# Build para producción
npm run build

# Ejecutar en producción
npm run start:prod
```

## Probar la API

### Con cURL

```bash
# Registrar usuario
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@test.com",
    "password": "password123",
    "firstName": "Juan",
    "lastName": "García",
    "clinicName": "Mi Consultorio"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@test.com",
    "password": "password123"
  }'

# Usar token en requests
curl http://localhost:3000/patients \
  -H "Authorization: Bearer <tu-token>"
```

### Con Postman

1. Importar la colección desde `docs/postman/` (próximamente)
2. Configurar variable `{{base_url}}` = `http://localhost:3000`
3. Configurar variable `{{token}}` después de login

## Próximos Pasos

1. Revisar la [Arquitectura](../architecture.md)
2. Explorar los [Modelos de Datos](../data-models.md)
3. Consultar la [API Reference](../api/)
