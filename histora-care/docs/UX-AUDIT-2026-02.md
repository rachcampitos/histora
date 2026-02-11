# Auditoria UX/UI - NurseLite (Febrero 2026)

**Fecha:** 2026-02-10
**Evaluador:** Claude Code (asistido)
**Nota Global:** B- (78/100)
**App evaluada:** histora-care (Ionic/Angular) + nurselite-landing (Next.js)

---

## Resumen Ejecutivo

Se evaluaron 35 hallazgos en las categorias de usabilidad, accesibilidad, consistencia visual, flujos criticos y landing page. La app tiene una base solida con buenos patrones (OnPush, lazy loading, dark mode) pero presenta brechas importantes en flujos criticos del paciente.

---

## Hallazgos por Severidad

### CRITICOS (4) - Impacto directo en conversion/retencion

| # | Hallazgo | Pantalla/Archivo | Estado | Prioridad |
|---|----------|-----------------|--------|-----------|
| C1 | Checkout: pagos deshabilitados sin comunicacion clara | `patient/checkout/` | **RESUELTO** - Tiene opacity 0.5, pointer-events none, badge "Proximamente", banner info | - |
| C2 | Tracking: rechazo sin opcion de re-request rapido | `patient/tracking/tracking.page.html` L27-120 | **PARCIAL** - Muestra 3 alternativas pero no tiene "reintentar con mismos datos" | P0 |
| C3 | Request: direccion manual usa coordenadas de la enfermera | `patient/request/request.page.ts` L236-237 | **BUG** - Modo manual envia `nurseData.location.coordinates`. GPS no hace reverse geocoding | P0 |
| C4 | Login: errores genericos sin detalle del backend | `auth/login/login.page.ts` L106-107 | **FACIL** - Backend envia mensajes especificos pero frontend muestra generico | P0 |

### ALTOS (8) - Afectan experiencia significativamente

| # | Hallazgo | Pantalla/Archivo | Estado | Prioridad |
|---|----------|-----------------|--------|-----------|
| A1 | Formulario de request no valida fecha pasada visualmente | `patient/request/request.page.html` | Pendiente | P1 |
| A2 | Sin feedback de progreso al cargar mapa de busqueda | `patient/search/` | Pendiente | P1 |
| A3 | Historial sin filtros por estado o fecha | `patient/history/` | Pendiente | P1 |
| A4 | Notificaciones push no configuradas en produccion | Backend + Capacitor | Pendiente | P1 |
| A5 | Sin onboarding/tutorial para primer uso | App completa | Pendiente | P1 |
| A6 | Perfil de enfermera: galeria de fotos sin lazy loading | `patient/nurse-profile/` | Pendiente | P1 |
| A7 | Busqueda por mapa: markers no agrupados (clustering) | `patient/search/` | Pendiente | P1 |
| A8 | Chat: sin indicador de "escribiendo..." | `shared/components/chat-modal/` | Pendiente | P1 |

### MEDIOS (12) - Mejoras de usabilidad

| # | Hallazgo | Pantalla/Archivo | Estado | Prioridad |
|---|----------|-----------------|--------|-----------|
| M1 | Iconos de categoria sin label en movil | `patient/search/` | Pendiente | P2 |
| M2 | Loading states inconsistentes (spinner vs skeleton) | Multiples pantallas | Pendiente | P2 |
| M3 | Sin animacion de transicion entre paginas | App routing | Pendiente | P2 |
| M4 | Toast messages: duracion inconsistente (2000-4000ms) | Global | Pendiente | P2 |
| M5 | Formularios: label "position=stacked" deprecated en Ionic 8 | Multiples formularios | Pendiente | P2 |
| M6 | Dark mode: algunos ion-card sin borde diferenciado | `global.scss` | Pendiente | P2 |
| M7 | Mapa de tracking: controles se superponen con bottom sheet | `patient/tracking/` | Pendiente | P2 |
| M8 | Sin confirmacion al salir de formulario con cambios | `patient/request/` | Pendiente | P2 |
| M9 | Toolbar back button no consistente (defaultHref vs click) | Multiples paginas | Pendiente | P2 |
| M10 | Review modal: textarea no muestra contador de caracteres | `shared/components/review-modal/` | Pendiente | P2 |
| M11 | Precio mostrado como "S/." vs "S/" inconsistente | Multiples pantallas | Pendiente | P2 |
| M12 | Sin empty state personalizado en historial vacio | `patient/history/` | Pendiente | P2 |

### BAJOS (11) - Pulido y detalle

| # | Hallazgo | Pantalla/Archivo | Estado | Prioridad |
|---|----------|-----------------|--------|-----------|
| B1 | Landing: Hero CTA tiene poco contraste en hover dark mode | `nurselite-landing/Hero.tsx` | Pendiente | P3 |
| B2 | Landing: testimonios carrusel sin pause on hover | `nurselite-landing/Testimonials.tsx` | Pendiente | P3 |
| B3 | Login: carousel de testimonios sin lazy loading de imagenes | `auth/login/` | Pendiente | P3 |
| B4 | Registro: password requirements no visibles hasta error | `auth/register/` | Pendiente | P3 |
| B5 | Footer landing: links de redes sociales sin rel="noopener" | `nurselite-landing/Footer.tsx` | Pendiente | P3 |
| B6 | App: ion-refresher no implementado en listas | `patient/history/`, `nurse/requests/` | Pendiente | P3 |
| B7 | Tracking: mapa no se adapta a dark mode automaticamente | `patient/tracking/` | Resuelto - usa ThemeService | - |
| B8 | Accesibilidad: faltan aria-labels en botones icon-only | Multiples pantallas | Parcial | P3 |
| B9 | SEO landing: falta structured data (JSON-LD) | `nurselite-landing/layout.tsx` | Pendiente | P3 |
| B10 | App: splash screen generico de Capacitor | Config nativa | Pendiente | P3 |
| B11 | Landing: FAQ no tiene schema markup para Google | `nurselite-landing/FAQ.tsx` | Pendiente | P3 |

---

## Metricas de Rendimiento

| Metrica | Valor | Estado |
|---------|-------|--------|
| Bundle size (raw) | 1.36 MB | Bueno |
| Bundle size (gzip) | 326 KB | Bueno |
| OnPush coverage | 96.5% | Excelente |
| Lazy-loaded modules | 71 | Excelente |
| Test coverage (statements) | 81.99% | Bueno |
| Test coverage (lines) | 83.25% | Bueno |

---

## Plan de Correccion

### Sprint 1 (Inmediato) - Criticos
- [x] C1: Ya resuelto
- [ ] C4: Login - mostrar mensajes de error del backend
- [ ] C3: Request - implementar geocoding real
- [ ] C2: Tracking - boton re-request con mismos datos

### Sprint 2 - Altos
- [ ] A1-A8: Mejoras de experiencia significativas

### Sprint 3 - Medios y Bajos
- [ ] M1-M12 + B1-B11: Pulido general

---

## Notas

- La app tiene muy buena base tecnica (OnPush, signals, lazy loading)
- El sistema de dark mode es completo y consistente
- Los flujos criticos (C2, C3, C4) son correcciones de logica, no de diseno
- C3 es el unico bug real (coordenadas incorrectas), los demas son mejoras UX
