# Auditoria UX/UI - NurseLite (Febrero 2026)

**Fecha:** 2026-02-10
**Evaluador:** Claude Code (asistido)
**Nota Global:** A- (91/100)
**App evaluada:** histora-care (Ionic/Angular) + nurselite-landing (Next.js)

**Ultima actualizacion:** 2026-02-10 (post-correccion de 16 hallazgos)

---

## Resumen Ejecutivo

Se evaluaron 35 hallazgos en las categorias de usabilidad, accesibilidad, consistencia visual, flujos criticos y landing page. Tras la correccion intensiva, **32 de 35 hallazgos estan resueltos**, 1 parcial (C2), 1 excluido (A6 - feature nueva), y 1 pendiente menor (C2 re-request). La nota sube de B- (78/100) a A- (91/100).

---

## Hallazgos por Severidad

### CRITICOS (4) - Impacto directo en conversion/retencion

| # | Hallazgo | Estado | Detalle |
|---|----------|--------|---------|
| C1 | Checkout: pagos deshabilitados sin comunicacion clara | **RESUELTO** | Badge "Proximamente", banner info, opacity 0.5 |
| C2 | Tracking: rechazo sin opcion de re-request rapido | **PARCIAL** | Muestra 3 alternativas. Falta "reintentar con mismos datos" |
| C3 | Request: direccion manual usa coordenadas de la enfermera | **RESUELTO** | Implementado geocoding real: reverse geocode para GPS, forward geocode para manual |
| C4 | Login: errores genericos sin detalle del backend | **RESUELTO** | Frontend muestra mensajes especificos del backend |

### ALTOS (8) - Afectan experiencia significativamente

| # | Hallazgo | Estado | Detalle |
|---|----------|--------|---------|
| A1 | Formulario de request no valida fecha pasada visualmente | **RESUELTO** | `availableTimeSlots` computed filtra slots pasados cuando fecha es hoy |
| A2 | Sin feedback de progreso al cargar mapa de busqueda | **RESUELTO** | Overlay con spinner sobre el mapa, se oculta en `map.on('load')` |
| A3 | Historial sin filtros por estado o fecha | **RESUELTO** | Chips "Este mes" / "3 meses" / "Todo" con filtrado por `createdAt` |
| A4 | Notificaciones push no configuradas en produccion | **RESUELTO** | Infraestructura web-push completa (WebPushService + backend) |
| A5 | Sin onboarding/tutorial para primer uso | **RESUELTO** | ProductTourService implementado con tour guiado |
| A6 | Perfil de enfermera: galeria de fotos sin lazy loading | **EXCLUIDO** | Requiere schema backend nuevo + endpoints + storage. Es feature nueva |
| A7 | Busqueda por mapa: markers no agrupados (clustering) | **RESUELTO** | GeoJSON source + cluster/count/unclustered layers. Umbral: 5+ enfermeras |
| A8 | Chat: sin indicador de "escribiendo..." | **RESUELTO** | Typing indicator funcional via WebSocket |

### MEDIOS (12) - Mejoras de usabilidad

| # | Hallazgo | Estado | Detalle |
|---|----------|--------|---------|
| M1 | Iconos de categoria sin label en movil | **RESUELTO** | Usa ion-select con texto visible |
| M2 | Loading states inconsistentes (spinner vs skeleton) | **RESUELTO** | Skeleton screens en history y search (perfil + servicios + stats) |
| M3 | Sin animacion de transicion entre paginas | **RESUELTO** | Animaciones Ionic default activas |
| M4 | Toast messages: duracion inconsistente | **RESUELTO** | Estandarizado: success/info 3000ms, danger 4000ms en toda la app |
| M5 | Formularios: label "position=stacked" deprecated | **RESUELTO** | Migrado a `label-placement="stacked"` en ion-input/ion-select |
| M6 | Dark mode: algunos ion-card sin borde diferenciado | **RESUELTO** | Cards con border en dark mode via global.scss |
| M7 | Mapa de tracking: controles se superponen con bottom sheet | **RESUELTO** | `.controls-hidden` cuando `currentBreakpoint() >= 0.85` |
| M8 | Sin confirmacion al salir de formulario con cambios | **RESUELTO** | `canDeactivate` guard funcional + `formDirty` signal |
| M9 | Toolbar back button no consistente | **RESUELTO** | Estandarizado con `defaultHref`, removidos `(click)` redundantes |
| M10 | Review modal: textarea no muestra contador de caracteres | **RESUELTO** | Contador de caracteres implementado |
| M11 | Precio mostrado como "S/." vs "S/" inconsistente | **RESUELTO** | Unificado a `S/` en 9 archivos (care + landing) |
| M12 | Sin empty state personalizado en historial vacio | **RESUELTO** | Empty states con icono + mensaje + CTA implementados |

### BAJOS (11) - Pulido y detalle

| # | Hallazgo | Estado | Detalle |
|---|----------|--------|---------|
| B1 | Landing: Hero CTA tiene poco contraste en hover dark mode | **RESUELTO** | `.dark .btn-primary:hover` con gradiente lighter teal + lift effect |
| B2 | Landing: testimonios carrusel sin pause on hover | **RESUELTO** | Pause on hover implementado |
| B3 | Login: carousel de testimonios sin lazy loading de imagenes | **N/A** | No hay imagenes en el carousel de login |
| B4 | Registro: password requirements no visibles hasta error | **RESUELTO** | Hint con checkmark-circle/ellipse-outline debajo del campo password |
| B5 | Footer landing: links de redes sociales sin rel="noopener" | **RESUELTO** | `rel="noopener"` presente |
| B6 | App: ion-refresher no implementado en listas | **RESUELTO** | ion-refresher implementado en listas principales |
| B7 | Tracking: mapa no se adapta a dark mode automaticamente | **RESUELTO** | Usa ThemeService para cambiar estilo del mapa |
| B8 | Accesibilidad: faltan aria-labels en botones icon-only | **RESUELTO** | aria-labels descriptivos en espanol en todas las pantallas |
| B9 | SEO landing: falta structured data (JSON-LD) | **RESUELTO** | JSON-LD implementado en layout.tsx |
| B10 | App: splash screen generico de Capacitor | **RESUELTO** | Splash screen personalizado |
| B11 | Landing: FAQ no tiene schema markup para Google | **RESUELTO** | FAQPage schema implementado |

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
| Tests | 768 (33 suites) | Todos pasan |

---

## Resumen de Correcciones Realizadas

### Batch 1: Estandarizacion global
- **M4**: Toast durations estandarizados en ~15 archivos
- **M11**: `S/.` -> `S/` en 9 archivos (care + landing)

### Batch 2: Formularios
- **A1**: Computed `availableTimeSlots` filtra por hora actual si fecha es hoy
- **M5**: Migrado `position="stacked"` a `label-placement="stacked"`
- **B4**: Password hints visibles antes de error

### Batch 3: Mapa
- **A2**: Loading overlay con spinner sobre mapa + fallback timeout 10s
- **A7**: Clustering con GeoJSON source, 3 layers (circles, counts, unclustered), zoom on click

### Batch 4: Historial
- **A3**: Chips de filtro por rango de fecha (mes/3meses/todo)

### Batch 5: Skeleton screens
- **M2**: Skeletons en history (avatar + lines + badge) y search (profile header + services + stats grid)

### Batch 6: Navegacion
- **M8**: `canDeactivate` guard funcional con alert de confirmacion
- **M9**: Back buttons estandarizados con `defaultHref`

### Batch 7: UI polish
- **B1**: Dark mode hover para `.btn-primary` con gradiente teal lighter
- **M7**: Controles de mapa se ocultan cuando bottom sheet >= 0.85

### Batch 8: Accesibilidad
- **B8**: aria-labels en espanol para todos los botones icon-only

---

## Items Pendientes

| # | Hallazgo | Complejidad | Notas |
|---|----------|-------------|-------|
| C2 | Re-request rapido desde tracking rechazado | Media | Requiere pre-fill de datos + navegacion a request page |
| A6 | Galeria de fotos de enfermera | Alta | Feature nueva: schema backend + endpoints + storage + UI |

---

## Notas

- La app tiene muy buena base tecnica (OnPush, signals, lazy loading)
- El sistema de dark mode es completo y consistente
- 32/35 hallazgos resueltos (91.4% de cobertura)
- Builds y tests verificados (histora-care + nurselite-landing)
