# Flujo CRUD Pacientes - Histora

```mermaid
graph TD
  UI[Frontend Angular]
  PC[PatientController]
  PS[PatientService]
  PR[PatientRepository]
  DB[(Base de datos)]

  UI -->|Enviar solicitud HTTP| PC
  PC -->|Validar datos y lógica básica| PS
  PS -->|Ejecutar lógica negocio| PR
  PR --> DB
  DB --> PR
  PR --> PS
  PS --> PC
  PC --> UI