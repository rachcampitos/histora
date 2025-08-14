# 📚 Documentación Técnica – Histora

Este directorio contiene recursos visuales y técnicos que explican la arquitectura y los flujos de la aplicación **Histora**, facilitando el entendimiento del sistema tanto para desarrolladores como para colaboradores externos.

---

## 📁 Contenido

- `architecture.md` – Diagrama de arquitectura del backend
- `patient-flow.md` – Flujo completo del CRUD de pacientes
- `assets/` – Imágenes del sistema y módulos médicos (pacientes, doctores, historias clínicas, citas, recetas, etc.)

---

## 🧱 Arquitectura del Backend

El archivo `architecture.md` contiene un diagrama en formato **Mermaid** que representa la estructura modular del backend, incluyendo:

- **Controllers** – Encargados de recibir las solicitudes HTTP
- **Services** – Contienen la lógica de negocio
- **Repositories** – Interactúan directamente con la base de datos
- **Database** – MongoDB (actual) y PostgreSQL (opcional/futuro)

```mermaid
graph TD
  subgraph Controllers
    C1[PatientController]
    C2[DoctorController]
    C3[ClinicalHistoryController]
  end

  subgraph Services
    S1[PatientService]
    S2[DoctorService]
    S3[ClinicalHistoryService]
  end

  subgraph Repositories
    R1[PatientRepository]
    R2[DoctorRepository]
    R3[ClinicalHistoryRepository]
  end

  subgraph Database
    DB[(MongoDB)]
  end

  C1 --> S1
  C2 --> S2
  C3 --> S3

  S1 --> R1
  S2 --> R2
  S3 --> R3

  R1 --> DB
  R2 --> DB
  R3 --> DB