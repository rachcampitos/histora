// src/doctors/interfaces/doctor.interface.ts
export interface Doctor {
  id?: string; // opcional si lo genera la base de datos
  name: string;
  specialty: string;
  phone?: string;
  email?: string;
  createdAt?: Date;
}
