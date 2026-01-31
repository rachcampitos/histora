# Instrucciones para Claude Code - Histora Care

## GitHub

- **Repositorio:** github.com/rachcampitos/histora
- **Usuario GitHub:** rachcampitos (NO raul-campos-wbd)
- **Branch principal:** main

## Estructura del Proyecto

```
histora/
├── histora-back/        # Backend NestJS (API)
├── histora-care/        # App Ionic/Angular (enfermeria a domicilio)
├── nurselite-landing/   # Landing page Next.js
└── histora-front/       # (Legacy - No en uso)
```

## Despliegue

### Landing Page (nurselite-landing)
- **Hosting:** Cloudflare Pages
- **URL:** https://nurse-lite.com
- **Despliegue:** AUTOMATICO con git push a main

### App Movil (histora-care / NurseLite)
- **Hosting:** Cloudflare Pages
- **URL:** https://app.nurse-lite.com
- **Despliegue:** AUTOMATICO con git push a main

### Backend API (histora-back)
- **Hosting:** Railway
- **URL:** https://api.historahealth.com
- **Despliegue:** AUTOMATICO con git push a main

### App Web Legacy (histora-front)
- **Hosting:** Railway
- **Estado:** Legacy, no en uso activo

> **IMPORTANTE:** Solo hacer `git push origin main` y el despliegue es automatico.
> **NO ejecutar:** `railway up` ni `wrangler pages deploy` manualmente.

## Arquitectura nurselite-landing

### Stack Tecnologico

| Categoria | Tecnologia | Version |
|-----------|------------|---------|
| Framework | Next.js | 16.1.6 |
| UI Library | React | 19.2.3 |
| Lenguaje | TypeScript | 5.x |
| Estilos | Tailwind CSS | 4.x |
| Animaciones | Framer Motion | 12.29.2 |
| Iconos | Lucide React | 0.563.0 |
| Hosting | Cloudflare Pages | - |

### Configuracion

```typescript
// next.config.ts
{
  output: "export",              // Static export (no server)
  images: { unoptimized: true }  // Para Cloudflare Pages
}
```

### Estructura de Componentes

```
nurselite-landing/src/
├── app/
│   ├── layout.tsx         # Layout principal + metadata SEO
│   ├── page.tsx           # Pagina principal
│   └── globals.css        # Variables CSS + dark mode
│
└── components/
    ├── Header.tsx         # Navegacion + theme toggle
    ├── Hero.tsx           # Seccion principal (Paciente/Enfermera)
    ├── HowItWorks.tsx     # 4 pasos del proceso
    ├── Services.tsx       # Catalogo de servicios por categoria
    ├── CEPVerification.tsx # Explicacion verificacion CEP
    ├── Testimonials.tsx   # Carrusel de testimonios
    ├── FAQ.tsx            # Preguntas frecuentes (accordion)
    ├── CTA.tsx            # Call to action final
    ├── Footer.tsx         # Pie de pagina
    ├── ThemeProvider.tsx  # Contexto dark/light mode
    └── ui/
        └── AnimatedSection.tsx  # Wrapper animaciones scroll
```

### Dark Mode

```
1. Script en <head> → Detecta preferencia antes de render
2. ThemeProvider → Maneja estado + localStorage
3. CSS Variables → :root (light) / .dark (dark)
4. Tailwind → @custom-variant dark (&:where(.dark, .dark *))
```

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

# App Movil
cd histora-care && npm run build
cd histora-care && npm run test
cd histora-care && ionic serve

# Landing Page
cd nurselite-landing && npm run dev
cd nurselite-landing && npm run build
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

## Monitoreo

- **Sentry:** Configurado en frontend y backend
- **DSN:** Configurado en environments
- **Solo activo en produccion**

## Compilacion Nativa

```bash
cd histora-care
npx cap sync           # Sincronizar
npx cap open ios       # Abrir Xcode
npx cap open android   # Abrir Android Studio
```

- **Bundle ID:** com.historahealth.nurselite
- **Requiere:** Node.js 22+ (para Capacitor CLI)

## URLs de Produccion

| Servicio | URL |
|----------|-----|
| Landing NurseLite | https://nurse-lite.com |
| App NurseLite | https://app.nurse-lite.com |
| API Backend | https://api.historahealth.com |

## Notas Importantes

1. **NO crear archivos .md innecesarios** - Solo documentacion esencial
2. **NO usar emojis en codigo** - A menos que el usuario lo pida
3. **Commits en espanol** - El proyecto es para Peru
4. **Push = Deploy** - El push automaticamente despliega
5. **Usuario GitHub:** rachcampitos (para operaciones con gh CLI)
6. **NO agregar Co-Authored-By de Claude** - Los commits no deben incluir coautoria de Claude

---
Ultima actualizacion: 2026-01-30
