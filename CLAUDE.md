# Instrucciones para Claude Code - Histora

## Estructura del Proyecto

```
histora/
├── histora-back/     # Backend NestJS
├── histora-care/     # Frontend Ionic/Angular (enfermeria a domicilio)
└── histora-front/    # Frontend Angular (admin panel)
```

## Despliegue

### Admin Panel (histora-front)
- **Hosting:** Railway (proyecto: fulfilling-victory)
- **URL:** https://histora-front.up.railway.app (o dominio custom)
- **Despliegue:** AUTOMATICO con git push a main

### App Movil/PWA (histora-care)
- **Hosting:** Cloudflare Pages
- **URL:** https://care.historahealth.com
- **Despliegue:** AUTOMATICO con git push a main

### Backend API (histora-back)
- **Hosting:** Railway (proyecto: merry-perfection)
- **URL:** https://api.historahealth.com
- **Despliegue:** AUTOMATICO con git push a main

> **IMPORTANTE:** Los 3 servicios están conectados a GitHub.
> Solo hacer `git push origin main` y el despliegue es automático.
> **NO ejecutar:** `railway up` o `wrangler pages deploy` manualmente.

## APIs Externas

### CEP (Colegio de Enfermeros del Peru)
- **Documentacion:** `histora-back/docs/CEP-API.md`
- **Endpoint:** `POST /validar/pagina/view.php`
- **Uso:** Validar numero CEP, obtener nombre, foto, estado HABIL

### RENIEC (via decolecta)
- **Limite:** 100 consultas/mes (gratis)
- **Token:** En variables de entorno `RENIEC_API_TOKEN`
- **Uso:** Backup para obtener nombre por DNI (ya no necesario con CEP)

## Flujos Importantes

### Verificacion de Enfermeras
- **Documentacion:** `histora-back/docs/NURSE-VERIFICATION-FLOW.md`
- **Flujo:** CEP + DNI → valida en cep.org.pe → foto + nombre + HABIL → confirma → documentos

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
# Build backend
cd histora-back && npm run build

# Build frontend
cd histora-care && npm run build

# Test backend
cd histora-back && npm run test

# Test frontend
cd histora-care && npm run test
```

## Variables de Entorno

### Backend (Railway)
- `MONGODB_URI` - MongoDB Atlas
- `JWT_SECRET` - JWT signing
- `CLOUDINARY_*` - Subida de imagenes
- `RENIEC_API_TOKEN` - API decolecta (opcional)

### Frontend
- Variables en `environment.ts` y `environment.prod.ts`
- API URL: `https://api.historahealth.com`

## Notas Importantes

1. **NO crear archivos .md innecesarios** - Solo documentacion esencial
2. **NO usar emojis en codigo** - A menos que el usuario lo pida
3. **Commits en español** - El proyecto es para Peru
4. **Push = Deploy** - El push automaticamente despliega en Railway (front+back) y Cloudflare (care)
5. **Vercel NO se usa** - Legacy, ignorar la carpeta .vercel

---
Ultima actualizacion: 2026-01-28
