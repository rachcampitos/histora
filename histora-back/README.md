# 🩺 Histora Backend

Este es el backend de **Histora**, una aplicación médica modular construida con **NestJS** y **MongoDB**. El objetivo es ofrecer una arquitectura escalable, segura y adaptable a distintos contextos clínicos, incluyendo normativas peruanas.

---

## 📁 Estructura del Monorepo
histora-app/
├── docs/             # Documentación técnica y normativa
├── histora-back/     # Backend con NestJS
├── histora-front/    # Frontend con Angular
└── .gitignore

---

## 🧱 Módulos Implementados

- `PatientsModule` → CRUD completo con validación
- `DoctorsModule` → CRUD completo con validación
- `ClinicalHistoryModule` → CRUD con borrado lógico y relaciones

### 🔄 En progreso:
- Módulo de citas médicas
- Autenticación y roles
- Exportación de historias clínicas en PDF

---

## ⚙️ Funcionalidades Clave

- ✅ Validación con DTOs (`class-validator`)
- ✅ Borrado lógico (`isDeleted`) en historias clínicas
- ✅ Restauración de registros eliminados
- ✅ Relaciones entre entidades (`ObjectId` con `ref`)
- ✅ Popular datos con `.populate()` para mostrar información completa
- ✅ Modularidad con `MongooseModule.forFeature`

---

## 📬 Endpoints Disponibles

### Patients
- `POST /patients`
- `GET /patients`
- `GET /patients/:id`
- `PATCH /patients/:id`
- `DELETE /patients/:id`

### Doctors
- `POST /doctors`
- `GET /doctors`
- `GET /doctors/:id`
- `PATCH /doctors/:id`
- `DELETE /doctors/:id`

### Clinical History
- `POST /clinical-history`
- `GET /clinical-history`
- `GET /clinical-history/:id`
- `PUT /clinical-history/:id`
- `DELETE /clinical-history/:id` → Borrado lógico
- `PUT /clinical-history/restore/:id` → Restaurar historia

---

## 🧠 Consideraciones Técnicas

- MongoDB Atlas como base de datos
- Uso de `ValidationPipe` global
- DTOs para control de datos entrantes
- Schemas con `@Schema()` y `@Prop()` para estructura de Mongo
- Relaciones entre entidades con `ref` y `populate`
- Separación clara entre lógica de negocio y persistencia

---

## 🚀 Roadmap

- [x] CRUD de pacientes
- [x] CRUD de doctores
- [x] CRUD de historias clínicas con borrado lógico
- [ ] Módulo de citas médicas
- [ ] Autenticación con JWT y roles
- [ ] Exportar historias clínicas en PDF
- [ ] Panel de configuración para campos personalizados

---

## 🧪 Testing & Desarrollo

- Tests unitarios en progreso
- Uso de Postman para pruebas manuales
- Ambiente de desarrollo local con `.env`

---

## 👨‍💻 Autor

Desarrollado por **Raul**, apasionado por crear soluciones reales en el sector salud. Este backend es parte de su camino hacia convertirse en un desarrollador fullstack sólido y versátil.

---