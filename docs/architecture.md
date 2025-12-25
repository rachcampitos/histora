# Arquitectura del Sistema

## Visión General

Histora utiliza una arquitectura modular basada en NestJS con patrón de capas:

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│              (Web App / Mobile App / API)                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      API GATEWAY                             │
│                   (Guards + Pipes)                           │
│         ┌─────────────┬──────────────┬─────────────┐        │
│         │ JwtAuthGuard│  RolesGuard  │ClinicAccess │        │
│         └─────────────┴──────────────┴─────────────┘        │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                     CONTROLLERS                              │
│  ┌──────┬────────┬─────────┬──────────┬────────────────┐    │
│  │ Auth │ Clinics│ Patients│ Doctors  │ Appointments   │    │
│  └──────┴────────┴─────────┴──────────┴────────────────┘    │
│  ┌──────────────┬───────────────┬──────────────────────┐    │
│  │Subscriptions │ClinicalHistory│   Public Endpoints   │    │
│  └──────────────┴───────────────┴──────────────────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      SERVICES                                │
│         (Business Logic + Validation)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   MONGOOSE MODELS                            │
│  ┌──────┬────────┬─────────┬──────────┬────────────────┐    │
│  │ User │ Clinic │ Patient │  Doctor  │  Appointment   │    │
│  └──────┴────────┴─────────┴──────────┴────────────────┘    │
│  ┌──────────────┬───────────────┬──────────────────────┐    │
│  │ Subscription │     Plan      │   ClinicalHistory    │    │
│  └──────────────┴───────────────┴──────────────────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      MongoDB                                 │
│                   (Atlas Cloud)                              │
└─────────────────────────────────────────────────────────────┘
```

## Diagrama de Módulos

```mermaid
graph TD
    subgraph "Core Modules"
        Auth[Auth Module]
        Users[Users Module]
        Clinics[Clinics Module]
    end

    subgraph "Business Modules"
        Subs[Subscriptions Module]
        Patients[Patients Module]
        Doctors[Doctors Module]
        Appointments[Appointments Module]
        Clinical[Clinical History Module]
    end

    subgraph "Guards"
        JWT[JwtAuthGuard]
        Roles[RolesGuard]
        Clinic[ClinicAccessGuard]
    end

    subgraph "Database"
        DB[(MongoDB)]
    end

    Auth --> Users
    Auth --> Clinics
    Clinics --> Subs

    JWT --> Auth
    Roles --> Users
    Clinic --> Clinics

    Patients --> DB
    Doctors --> DB
    Appointments --> DB
    Clinical --> DB
    Subs --> DB
    Users --> DB
    Clinics --> DB
```

## Multi-Tenancy

El sistema implementa multi-tenancy a nivel de base de datos usando un campo `clinicId` como discriminador:

```mermaid
graph LR
    subgraph "Clinic A"
        PA[Patients A]
        DA[Doctors A]
        AA[Appointments A]
    end

    subgraph "Clinic B"
        PB[Patients B]
        DB[Doctors B]
        AB[Appointments B]
    end

    subgraph "Shared Database"
        MongoDB[(MongoDB)]
    end

    PA --> MongoDB
    DA --> MongoDB
    AA --> MongoDB
    PB --> MongoDB
    DB --> MongoDB
    AB --> MongoDB
```

Cada query incluye automáticamente el filtro `clinicId` del usuario autenticado.

## Flujo de Autenticación

```mermaid
sequenceDiagram
    participant C as Client
    participant G as Guards
    participant A as AuthService
    participant U as UsersService
    participant DB as MongoDB

    C->>G: Request + JWT Token
    G->>G: JwtAuthGuard validates token
    G->>G: RolesGuard checks permissions
    G->>G: ClinicAccessGuard verifies tenant
    G->>A: Validated request
    A->>U: Get user data
    U->>DB: Query user
    DB-->>U: User document
    U-->>A: User + clinicId
    A-->>C: Response
```

## Estructura de Carpetas

```
histora-back/
├── src/
│   ├── auth/
│   │   ├── decorators/      # @CurrentUser, @Roles, @Public
│   │   ├── guards/          # JWT, Roles, ClinicAccess
│   │   ├── strategies/      # JWT Strategy
│   │   ├── dto/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/
│   │   ├── schema/
│   │   ├── dto/
│   │   └── ...
│   ├── clinics/
│   ├── subscriptions/
│   ├── patients/
│   ├── doctors/
│   ├── appointments/
│   ├── clinical-history/
│   ├── app.module.ts
│   └── main.ts
├── test/
│   ├── mocks/               # Mock factories for testing
│   └── ...
└── docs/
```

## Dependencias Principales

| Paquete | Versión | Uso |
|---------|---------|-----|
| @nestjs/core | 11.x | Framework principal |
| @nestjs/mongoose | 11.x | ODM para MongoDB |
| @nestjs/jwt | 11.x | Tokens JWT |
| @nestjs/passport | 11.x | Autenticación |
| mongoose | 8.x | Cliente MongoDB |
| bcrypt | 5.x | Hash de contraseñas |
| class-validator | 0.14.x | Validación de DTOs |
