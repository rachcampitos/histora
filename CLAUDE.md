# Instrucciones para Claude Code - Histora Care

## Estructura del Proyecto

```
histora/
├── histora-back/     # Backend NestJS (API)
├── histora-care/     # App Ionic/Angular (enfermeria a domicilio)
└── histora-front/    # (Legacy - No en uso)
```

## Despliegue

### App (histora-care)
- **Hosting:** Cloudflare Pages
- **URL:** https://care.historahealth.com
- **Despliegue:** AUTOMATICO con git push a main

### Backend API (histora-back)
- **Hosting:** Railway
- **URL:** https://api.historahealth.com
- **Despliegue:** AUTOMATICO con git push a main

> **IMPORTANTE:** Solo hacer `git push origin main` y el despliegue es automatico.
> **NO ejecutar:** `railway up` manualmente.

## APIs Externas

### CEP (Colegio de Enfermeros del Peru)
- **Documentacion:** `histora-back/docs/CEP-API.md`
- **Uso:** Validar numero CEP, obtener nombre, foto, estado HABIL

### RENIEC (via decolecta)
- **Limite:** 100 consultas/mes (gratis)
- **Token:** Variable `RENIEC_API_TOKEN`
- **Uso:** Backup para validacion de DNI

### Culqi (Pagos)
- **Uso:** Tarjetas de credito/debito y Yape
- **Documentacion:** `histora-back/docs/PAYMENT-BETA-MODE.md`

## Flujos Importantes

### Verificacion de Enfermeras
- **Documentacion:** `histora-back/docs/NURSE-VERIFICATION-FLOW.md`
- **Flujo:** DNI + CEP → valida en cep.org.pe → foto + nombre + HABIL → confirma → selfie → admin aprueba

## Datos de Prueba

```
CEP: 108887
DNI: 44119536
Nombre: CHAVEZ TORRES MARIA CLAUDIA
Estado: HABIL
Region: CONSEJO REGIONAL III LIMA METROPOLITANA
```

## Comandos Utiles

```bash
# Backend
cd histora-back && npm run build
cd histora-back && npm run test
cd histora-back && npm run start:dev

# Frontend
cd histora-care && npm run build
cd histora-care && npm run test
cd histora-care && ionic serve
```

## Variables de Entorno

### Backend (Railway)
- `MONGO_URL` - MongoDB Atlas
- `JWT_SECRET` / `JWT_REFRESH_SECRET` - JWT
- `CLOUDINARY_*` - Subida de imagenes
- `SENDGRID_API_KEY` - Emails
- `CULQI_API_KEY` - Pagos
- `RENIEC_API_TOKEN` - API decolecta (opcional)

### Frontend
- Variables en `environment.ts` y `environment.prod.ts`
- API URL: `https://api.historahealth.com`

## Roles de Usuario

| Rol | Descripcion |
|-----|-------------|
| `platform_admin` | Administrador de la plataforma |
| `patient` | Paciente que solicita servicios |
| `nurse` | Enfermera profesional verificada |

## Notas Importantes

1. **NO crear archivos .md innecesarios** - Solo documentacion esencial
2. **NO usar emojis en codigo** - A menos que el usuario lo pida
3. **Commits en espanol** - El proyecto es para Peru
4. **Push = Deploy** - El push automaticamente despliega

---
Ultima actualizacion: 2026-01-29
