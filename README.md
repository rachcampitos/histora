# 🩺 Histora App

**Histora** es una aplicación médica modular diseñada para gestionar pacientes, doctores y registros clínicos. El proyecto está construido con **NestJS** en el backend y **Angular** en el frontend, y está orientado a resolver necesidades reales del sector salud, especialmente en el contexto peruano.

---

## 📦 Estructura del Monorepo

histora-app/
├── docs/             # Documentación técnica y normativa
├── histora-back/     # Backend con NestJS y MongoDB
├── histora-front/    # Frontend con Angular
└── .gitignore

## 🚀 Instalación y Uso

- Clona el repositorio:
  ```bash
  git clone https://github.com/tu-usuario/histora-app.git
  cd histora-app

## 🚀 Instala dependencias en cada módulo:

cd histora-back && npm install
cd ../histora-front && npm install

Configura las variables de entorno en histora-back/.env
Levanta los servicios:

# Backend
npm run start:dev

# Frontend
ng serve

🧠 Descripción General

Histora busca ofrecer una solución técnica robusta para el manejo de información médica. Está dividido en tres partes:

•  Backend (histora-back) – API modular con NestJS y MongoDB
•  Frontend (histora-front) – Interfaz de usuario con Angular
•  Documentación (docs) – Normativas, esquemas y referencias técnicas

📌 Estado Actual

•  ✅ Backend: CRUD de pacientes, doctores y historias clínicas con borrado lógico
•  🛠️ Frontend: En desarrollo
•  📚 Documentación: Normativas peruanas y estructura técnica

🗺️ Roadmap General

•  Estructura modular del backend
•  Borrado lógico y restauración de historias clínicas
•  Módulo de citas médicas
•  Autenticación y roles
•  Exportación de historias clínicas en PDF
•  Interfaz completa en Angular
•  Panel de configuración para campos personalizados

👨‍💻 Autor

Desarrollado por Raul, apasionado por crear soluciones reales para el sector salud y consolidarse como desarrollador fullstack. Este proyecto es parte de su camino hacia la excelencia técnica y profesional.