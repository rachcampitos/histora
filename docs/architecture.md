# Arquitectura Backend - Histora

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