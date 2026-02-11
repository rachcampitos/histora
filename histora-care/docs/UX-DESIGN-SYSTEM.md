# NurseLite - Sistema de Diseno UX/UI

> Documento de referencia unica para el diseno visual y la experiencia de usuario de la app NurseLite (histora-care).
> Ultima actualizacion: Febrero 2026

---

## Indice

1. [Paleta de Colores](#1-paleta-de-colores)
2. [Tipografia](#2-tipografia)
3. [Componentes Ionic - Estilos Personalizados](#3-componentes-ionic---estilos-personalizados)
4. [Implementacion de Dark Mode](#4-implementacion-de-dark-mode)
5. [Animaciones](#5-animaciones)
6. [Patrones de Layout](#6-patrones-de-layout)
7. [Iconografia](#7-iconografia)
8. [Sistema de Colores por Estado](#8-sistema-de-colores-por-estado)
9. [Componentes Compartidos](#9-componentes-compartidos)
10. [Reglas y Convenciones](#10-reglas-y-convenciones)

---

## 1. Paleta de Colores

### 1.1 Colores de Marca (Brand)

| Token SCSS | Valor | Uso |
|---|---|---|
| `$color-brand-primary` | `#1e3a5f` | Navy Blue - Color principal de NurseLite |
| `$color-brand-secondary` | `#2d5f8a` | Medium Blue - Gradiente secundario |
| `$color-brand-accent` | `#4a9d9a` | Teal - Acento (lampara NurseLite) |

### 1.2 Colores Semanticos

| Token SCSS | Valor | Uso |
|---|---|---|
| `$color-success` | `#16a34a` | Verde puro - diferenciado del teal accent |
| `$color-success-dark` | `#15803d` | Hover/texto sobre blanco |
| `$color-success-light` | `#dcfce7` | Fondos sutiles de exito |
| `$color-error` | `#dc2626` | Rojo - acciones destructivas |
| `$color-warning` | `#d97706` | Amber - advertencias |
| `$color-info` | `#0284c7` | Azul informativo |

### 1.3 Colores Calidos (Humanizar la experiencia)

| Token SCSS | Valor | Uso |
|---|---|---|
| `$color-warmth-primary` | `#f59e0b` | Amber 500 - Optimismo, energia positiva |
| `$color-warmth-secondary` | `#fbbf24` | Amber 400 - Variante mas suave |
| `$color-warmth-light` | `#fef3c7` | Amber 100 - Fondos calidos |
| `$color-empathy-primary` | `#ec4899` | Pink 500 - Cuidado, empatia |
| `$color-empathy-light` | `#fce7f3` | Pink 100 - Fondos suaves |

### 1.4 Escala de Neutros

| Token SCSS | Valor | Descripcion |
|---|---|---|
| `$color-neutral-50` | `#f8fafc` | Fondo mas claro |
| `$color-neutral-100` | `#f1f5f9` | Fondo secundario |
| `$color-neutral-200` | `#e2e8f0` | Bordes suaves |
| `$color-neutral-300` | `#cbd5e1` | Bordes visibles |
| `$color-neutral-400` | `#94a3b8` | Texto placeholder |
| `$color-neutral-500` | `#64748b` | Texto terciario |
| `$color-neutral-600` | `#475569` | Texto secundario |
| `$color-neutral-700` | `#334155` | Bordes dark mode |
| `$color-neutral-800` | `#1e293b` | Superficies dark mode |
| `$color-neutral-900` | `#0f172a` | Fondo principal dark mode |

### 1.5 Superficies - Light Mode

| Variable CSS / Token | Valor | Uso |
|---|---|---|
| `--ion-background-color` | `#faf9f7` | Fondo general (off-white calido) |
| `--histora-surface` | `#ffffff` | Tarjetas, contenedores |
| `--histora-surface-secondary` | `#f5f4f2` | Fondos de items, inputs |
| `--histora-border` | `#d4d4d8` | Bordes principales |
| `--histora-border-light` | `#e5e5e5` | Bordes sutiles |
| `--histora-item-background` | `#ffffff` | Fondo de ion-item |
| `--histora-item-background-hover` | `#f5f4f2` | Hover de ion-item |

### 1.6 Superficies - Dark Mode

| Variable CSS / Token | Valor | Uso |
|---|---|---|
| `--ion-background-color` | `#0f172a` | Fondo general |
| `--histora-surface` | `#1e293b` | Tarjetas, contenedores |
| `--histora-surface-secondary` | `$surface-dark-secondary` (`#232b3e`) | Fondos de cards (tokens) |
| `--histora-border` | `#334155` | Bordes principales |
| `--ion-card-background` | `#1e293b` | Tarjetas Ionic |
| `--ion-item-background` | `#1e293b` | Items Ionic |
| `--ion-toolbar-background` | `#0f172a` | Toolbar |

### 1.7 Texto - Light Mode (WCAG AA)

| Variable CSS / Token | Valor | Ratio sobre blanco | Uso |
|---|---|---|---|
| `--histora-text-primary` | `#1a1a1a` | ~16:1 | Titulos, texto principal |
| `--histora-text-secondary` | `#52525b` | ~7:1 | Subtitulos, descripcion |
| `--histora-text-muted` | `#71717a` | 4.8:1 | Placeholders, ayuda |

### 1.8 Texto - Dark Mode (WCAG AA)

| Variable CSS / Token | Valor | Ratio sobre #1a202e | Uso |
|---|---|---|---|
| `$text-dark-primary` | `#f1f5f9` | 15.2:1 | Titulos, texto principal |
| `$text-dark-secondary` | `#d1d9e3` | 11.3:1 | Subtitulos, descripcion |
| `$text-dark-tertiary` | `#a8b5c4` | 7.1:1 | Placeholders, ayuda |

### 1.9 Colores CTA (Call to Action)

**REGLA CRITICA: Los botones CTA usan colores SOLIDOS, NO gradientes.**

| Contexto | Light Mode | Dark Mode |
|---|---|---|
| **CTA primario** | `#1e3a5f` (navy solido) | `#4a9d9a` (teal solido) |
| **CTA destructivo** | `#dc2626` (rojo) | `#dc2626` (rojo) |
| **CTA warning** | `#d97706` (amber) | `#d97706` (amber) |
| **CTA success** | `#16a34a` (verde) | `#16a34a` (verde) |

### 1.10 Teal Accent para Dark Mode

El color `#6bb5b3` se usa extensivamente en dark mode como color interactivo para elementos seleccionados y de accion. No confundir con el teal de marca (`#4a9d9a`) que se usa para CTAs.

| Color | Uso en Dark Mode |
|---|---|
| `#6bb5b3` | ion-radio checked, ion-chip seleccionado, ion-datetime botones, action-sheet seleccionado, links, precios, iconos interactivos, focus de inputs |
| `#4a9d9a` | Botones CTA solidos, send button en chat, checkbox accent |

### 1.11 Gradientes (Solo para Brand / Decorativos)

```scss
// Brand gradient - SOLO para avatares, iconos decorativos y fondos de bienvenida
--nurselite-gradient: linear-gradient(135deg, #1e3a5f 0%, #4a9d9a 100%);

// Warm gradient - Para elementos que necesitan calidez humana
--nurselite-gradient-warm: linear-gradient(135deg, #1e3a5f 0%, #4a9d9a 60%, #fbbf24 100%);
```

**Los gradientes NUNCA se usan en botones CTA.** Solo en:
- Fondos decorativos (welcome section del dashboard)
- Avatares placeholder
- Iconos de seccion (virtual escort, verificacion)
- Banner de servicio activo (verde gradiente)

---

## 2. Tipografia

### 2.1 Familia Tipografica

```scss
$font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### 2.2 Escala de Tamanos

| Token | Tamano | Uso |
|---|---|---|
| `$font-size-xs` | `12px` | Ayudas, labels, badges, stat labels |
| `$font-size-sm` | `14px` | Texto secundario, descripciones, items de lista |
| `$font-size-base` | `16px` | Texto principal, inputs, botones |
| `$font-size-lg` | `18px` | Titulos de seccion, h2 internos |
| `$font-size-xl` | `20px` | Titulos de pagina, alertas |
| `$font-size-2xl` | `24px` | Titulos principales, h1, valores grandes de stats |

### 2.3 Pesos Tipograficos

| Token | Valor | Uso |
|---|---|---|
| `$font-weight-regular` | `400` | Texto de cuerpo, descripciones |
| `$font-weight-medium` | `500` | Labels, texto enfatizado, hints |
| `$font-weight-semibold` | `600` | Subtitulos, botones, nombres |
| `$font-weight-bold` | `700` | Titulos principales, precios, h1 |

### 2.4 Jerarquia de Encabezados

| Nivel | Tamano | Peso | Ejemplo de Uso |
|---|---|---|---|
| h1 | 24px | 700 | Welcome section ("Hola, Maria") |
| h2 | 18px | 600 | Titulos de seccion ("Solicitudes activas") |
| h3 | 16px-17px | 600-700 | Titulo de card, nombre de enfermera |
| h4 | 15px | 600 | Subtitulo de seccion, detalle de card |
| Body | 15-16px | 400 | Texto principal |
| Caption | 12-13px | 500 | Timestamps, etiquetas, metadata |

---

## 3. Componentes Ionic - Estilos Personalizados

### 3.1 ion-toolbar

```scss
// Light mode
ion-header ion-toolbar {
  --background: #ffffff;
  --color: #1e293b;
}

// Dark mode
body.dark ion-toolbar {
  --background: #0f172a;
  --color: #f1f5f9;
  --border-color: #334155;
}
```

El toolbar es consistente en toda la app. En dark mode, el back button y los botones de la toolbar heredan `--color: #f1f5f9`.

### 3.2 ion-card

```scss
// Light mode (por defecto)
ion-card {
  // background: #ffffff (implicit)
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

// Dark mode (desde global.scss mixin)
ion-card {
  --background: #1e293b;
  --color: #e2e8f0;
  border: 1px solid #334155;
}

ion-card-title { color: #f1f5f9; }
ion-card-content { color: #cbd5e1; }
```

### 3.3 ion-button

#### Primario (CTA solido)

```scss
.primary-btn {
  --background: #1e3a5f;
  --color: white;
  --border-radius: 12px;
  height: 52px;
  font-weight: 600;
  font-size: 16px;
}

// Dark mode CTA
.cta-button {
  --background: #4a9d9a;    // Teal solido
  --color: white;
}
```

#### Outline

```scss
// Light mode
ion-button[fill="outline"] {
  // Hereda --border-color y --color de Ionic
}

// Dark mode
ion-button[fill="outline"] {
  --border-color: #475569;
  --color: #e2e8f0;

  &:hover:not([disabled]) {
    --background: rgba(51, 65, 85, 0.3);
  }
}
```

#### Clear

```scss
// Dark mode
ion-button[fill="clear"] {
  --color: #cbd5e1;
}
```

#### Destructivo

```scss
ion-button[color="danger"] {
  // Ionic maneja el color via --ion-color-danger: #dc2626
}
```

#### Botones por Estado de Servicio

Los CTAs principales en `active-service` y `tracking` cambian de color segun el estado:

```scss
.main-action-btn {
  &[data-status="accepted"]   { --background: #2563eb; }  // Blue
  &[data-status="on_the_way"] { --background: #ea580c; }  // Orange
  &[data-status="arrived"]    { --background: #d97706; }  // Amber
  &[data-status="in_progress"]{ --background: #0891b2; }  // Cyan
  &.success-state             { --background: #16a34a; }  // Green
}

// Dark mode: versiones mas claras
.main-action-btn {
  &[data-status="accepted"]   { --background: #3b82f6; }
  &[data-status="on_the_way"] { --background: #f97316; }
  &[data-status="arrived"]    { --background: #f59e0b; }
  &[data-status="in_progress"]{ --background: #06b6d4; }
  &.success-state             { --background: #22c55e; }
}
```

### 3.4 ion-chip

```scss
// Light mode: no override (Ionic defaults)

// Dark mode (global.scss mixin)
ion-chip {
  --background: #334155;
  --color: #e2e8f0;
}

// Dark mode chip seleccionado (ej: review-celebration)
ion-chip {
  --background: rgba(74, 157, 154, 0.15);
  --color: #6bb5b3;
  border-color: #6bb5b3;
}
```

### 3.5 ion-badge

```scss
// Dark mode (global.scss mixin)
ion-badge[color="primary"] {
  --background: #1e3a5f;
  --color: #ffffff;
}

ion-badge[color="success"] {
  --background: #064e3b;
  --color: #6ee7b7;
}
```

Los badges de estado del servicio usan colores por estado (ver seccion 8).

### 3.6 ion-radio

```scss
// Dark mode - usa teal para el estado checked
body.dark ion-radio {
  --color-checked: #6bb5b3;
}
```

### 3.7 ion-datetime / ion-picker

La personalizacion del datetime en dark mode es critica porque Ionic usa fondos blancos por defecto en el wheel picker.

```scss
body.dark ion-datetime {
  --background: #1e293b;
  --background-rgb: 30, 41, 59;
  --title-color: #f1f5f9;

  // CRITICO: sin esto, el overlay del wheel es invisible
  --wheel-highlight-background: rgba(148, 163, 184, 0.15);
  --wheel-fade-background-rgb: 30, 41, 59;  // Debe coincidir con el fondo
  color: #f1f5f9;

  // Wheel items
  &::part(wheel-item) { color: #f1f5f9; }
  &::part(wheel-item active) { color: #6bb5b3; }

  // Calendar
  .calendar-day-active { background: #4a9d9a; color: #fff; }
  .calendar-day-disabled { color: #475569; }

  // Botones
  ion-buttons ion-button { --color: #6bb5b3; }
}

// ion-datetime-button
body.dark ion-datetime-button {
  &::part(native) {
    background: #334155;
    color: #f1f5f9;
    border-radius: 8px;
  }
}
```

**Problema conocido:** `--wheel-fade-background-rgb` por defecto es `255,255,255` (blanco). En dark mode, esto crea un overlay blanco invisible sobre fondo oscuro. Siempre debe setearse al RGB del fondo del datetime.

### 3.8 ion-action-sheet

```scss
// Dark mode
body.dark ion-action-sheet {
  --background: #1e293b;
  --color: #f1f5f9;

  .action-sheet-group { background: #1e293b; border-radius: 16px; }
  .action-sheet-title { color: #94a3b8; border-bottom: 1px solid #334155; }
  .action-sheet-button { color: #f1f5f9; }

  // Opcion seleccionada
  .action-sheet-selected {
    color: #6bb5b3;
    font-weight: 600;
  }

  // Boton cancelar
  .action-sheet-cancel {
    background: #0f172a;
    .action-sheet-button-inner { color: #6bb5b3; }
  }
}
```

### 3.9 ion-modal

Existen varias variantes de modal con clases CSS especificas:

| Clase CSS | Tipo | Tamano |
|---|---|---|
| `chat-modal-fullscreen` | Fullscreen mobile, card en tablet | 100% / max 600x800 |
| `review-modal-floating` | Centrado flotante | calc(100% - 32px), max 400px |
| `review-celebration-modal` | Centrado flotante | 90%, max 400px, auto height |
| `tier-onboarding-modal` | Centrado flotante | 92%, max 420px, 520px height |
| `tracking-sheet-modal` | Bottom sheet con breakpoints | 100%, border-radius top |
| `service-modal` | Pagina completa | 100% |
| `verification-modal` | Bottom sheet | border-radius top 20px |
| `confirmation-modal` | Centrado transparente | max 320px |

Todas comparten en dark mode:

```scss
body.dark ion-modal {
  --background: #1e293b;   // o #0f172a para fullscreen
  &::part(content) {
    border: 1px solid #334155;
  }
}
```

### 3.10 ion-alert (Sistema Histora)

Se usa un sistema unificado de clases CSS para alerts:

| Clase CSS | Uso | Color del boton confirm |
|---|---|---|
| `histora-alert` | Base | `#1e3a5f` (navy) |
| `histora-alert-danger` | Acciones destructivas (logout, eliminar, cancelar) | `#dc2626` (rojo) |
| `histora-alert-primary` | Confirmaciones normales | `#1e3a5f` (navy) |
| `histora-alert-warning` | Advertencias | `#d97706` (amber) |
| `histora-alert-success` | Confirmaciones exitosas | `#16a34a` (verde) |
| `logout-alert` | Logout (alias de danger) | `#dc2626` (rojo) |

Estructura comun:

```scss
ion-alert.histora-alert {
  .alert-wrapper {
    background: #ffffff;
    border-radius: 16px;
    max-width: 340px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }

  .alert-title {
    font-size: 20px;
    font-weight: 700;
    text-align: center;
  }

  .alert-message {
    font-size: 15px;
    text-align: center;
  }

  .alert-button {
    border-radius: 12px;
    font-weight: 600;
    min-height: 48px;
    text-transform: none;

    &.alert-button-role-cancel {
      background: #e2e8f0;
      color: #334155;
    }
  }
}

// Dark mode para todos los alerts
body.dark {
  ion-alert.histora-alert {
    .alert-wrapper {
      background: #1e293b;
      border: 1px solid #475569;
    }
    .alert-title { color: #f1f5f9; }
    .alert-message { color: #94a3b8; }
    .alert-button.alert-button-role-cancel {
      background: #334155;
      color: #f1f5f9;
    }
  }
}
```

Alerts especiales adicionales: `cep-alert` (educativo con iconos y lista), `review-view-alert` (muestra resena existente con estrellas), `verification-celebration` (celebracion de verificacion).

### 3.11 ion-toast

Dos variantes principales:

#### Chat Notification Toast

```scss
ion-toast.chat-notification-toast {
  --background: #ffffff;         // Dark: #1e293b
  --color: #1e293b;              // Dark: #f1f5f9
  --border-radius: 14px;
  --box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
```

#### New Request Toast

```scss
ion-toast.new-request-toast {
  --background: #ffffff;         // Dark: #1e293b
  --color: #1e293b;              // Dark: #f1f5f9
  --border-radius: 14px;

  &::part(icon) {
    color: #1e3a5f;              // Dark: #4a9d9a
  }

  &::part(button) {
    color: #1e3a5f;              // Dark: #4a9d9a
    font-weight: 600;
  }
}
```

### 3.12 ion-segment

```scss
// Dark mode
body.dark ion-segment {
  --background: #334155;

  ion-segment-button {
    --color: #94a3b8;
    --color-checked: #ffffff;
    --indicator-color: var(--ion-color-primary);
  }
}
```

### 3.13 ion-loading

```scss
// Light mode
ion-loading {
  .loading-wrapper {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    padding: 24px 32px;
  }
}

// Dark mode
body.dark ion-loading {
  --spinner-color: #6bb5b3;

  .loading-wrapper {
    background: rgba(30, 41, 59, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    .loading-content { color: #f1f5f9; }
    ion-spinner { --color: #6bb5b3; }
  }
}
```

### 3.14 ion-popover (Select Interface)

```scss
// Dark mode para popover de ion-select
body.dark ion-popover {
  --background: #1e293b;

  ion-item {
    --background: #1e293b;
    --color: #f1f5f9;
    --border-color: #334155;
  }

  ion-radio { --color-checked: #6bb5b3; }
}
```

---

## 4. Implementacion de Dark Mode

### 4.1 Activacion

El dark mode se controla via `ThemeService` que agrega la clase `dark` e `ion-palette-dark` al body. No se usa `prefers-color-scheme` directamente en CSS; el servicio detecta la preferencia y aplica la clase.

```scss
// Importa los estilos base de Ionic para dark mode
@import "@ionic/angular/css/palettes/dark.class.css";
```

### 4.2 Patron en Componentes con Shadow DOM

Para componentes Angular con `ViewEncapsulation.Emulated` (default):

```scss
// CORRECTO: Usar :host-context para acceder al body
:host-context(body.dark),
:host-context(body.ion-palette-dark) {
  .mi-elemento { color: #f1f5f9; }
}
```

### 4.3 Patron en Componentes sin Shadow DOM

Para componentes con `ViewEncapsulation.None` (como `ReviewModalComponent`):

```scss
// CORRECTO: Selector directo, sin :host-context
body.dark,
body.ion-palette-dark {
  .review-modal { background: #1e293b; }
}
```

**Razon:** `:host-context` solo funciona cuando Angular emula Shadow DOM con atributos `_ngcontent`. Sin encapsulacion, no hay `:host`.

### 4.4 Patron para Modales (Overlay Container)

Los modales de Ionic se renderizan en el overlay container, fuera del componente host. Esto significa que `:host-context` no aplica para estilos dentro del modal. Hay dos soluciones:

**Solucion 1: Estilos globales en `global.scss`** (recomendada para modales con cssClass)

```scss
// global.scss
body.dark ion-modal.tracking-sheet-modal {
  &::part(content) {
    background: #1e293b;
  }
}
```

**Solucion 2: Class binding en el template** (usada en tracking sheet content)

```scss
// tracking.page.scss
.sheet-content.dark-mode {
  --background: #1e293b;
  // ... estilos dark mode sin :host-context
}
```

```html
<!-- tracking.page.html -->
<ion-content class="sheet-content" [class.dark-mode]="isDark">
```

### 4.5 Overrides de dark.class.css

El CSS de `dark.class.css` de Ionic cambia todos los contrastes a `#000`. Se deben re-overridear en `global.scss`:

```scss
@mixin dark-mode-styles {
  // Re-override para mantener contraste blanco
  --ion-color-primary-contrast: #ffffff;
  --ion-color-secondary-contrast: #ffffff;
  --ion-color-tertiary-contrast: #ffffff;
  --ion-color-success-contrast: #ffffff;
  --ion-color-warning-contrast: #ffffff;
  --ion-color-danger-contrast: #ffffff;
  --ion-color-medium-contrast: #ffffff;
}
```

### 4.6 Penetracion de Shadow DOM

Para componentes Ionic que usan Shadow DOM real (como `ion-datetime`), los estilos internos solo se modifican via CSS custom properties:

```scss
// CORRECTO: usa custom properties
ion-datetime {
  --background: #1e293b;
  --wheel-fade-background-rgb: 30, 41, 59;
}

// Para parts expuestos
ion-datetime::part(wheel-item active) {
  color: #6bb5b3;
}

// INCORRECTO: no funciona con Shadow DOM
ion-datetime .internal-element { color: red; }
```

### 4.7 Problemas Comunes Encontrados

| Problema | Causa | Solucion |
|---|---|---|
| `_ngcontent` attrs no matchean | `ViewEncapsulation.Emulated` scope | Usar `:host-context` en vez de selectores directos |
| Modales sin dark mode | Render fuera del host | Estilos en `global.scss` o class binding |
| `--wheel-fade-background-rgb` blanco | Default de Ionic | Setear al RGB del fondo oscuro |
| `ion-icon` blanco dentro de boton | `color` no se hereda en Shadow DOM | `ion-icon { color: #fff !important }` |
| Contraste negro en dark mode | `dark.class.css` override | Re-setear `--contrast` a `#ffffff` |

---

## 5. Animaciones

### 5.1 Tokens de Duracion

| Token | Valor | Uso |
|---|---|---|
| `$duration-fast` | `150ms` | Feedback inmediato (tap, hover) |
| `$duration-normal` | `250ms` | Transiciones estandar |
| `$duration-slow` | `350ms` | Animaciones de entrada/salida |
| `$easing-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Material Design standard easing |

### 5.2 Catalogo de Animaciones

#### Shimmer Sweep (Dashboard, Banners)

Efecto de brillo que recorre un banner de izquierda a derecha para indicar actividad.

```scss
@keyframes shimmer-sweep {
  0%   { transform: translateX(-100%); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
}
// Uso: banner de servicio activo, lineas de progreso activas
// Duracion: 2-2.5s ease-in-out infinite
```

#### Pulse Dot (Stepper)

Efecto de pulso en los puntos del stepper que indica el paso actual.

```scss
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 4px rgba(var(--pulse-color-rgb), 0.2); }
  50%      { box-shadow: 0 0 0 8px rgba(var(--pulse-color-rgb), 0.1); }
}
// Uso: dot activo del stepper de progreso
// Duracion: 2s ease-in-out infinite
```

#### Badge Breathe (Active Service)

Efecto sutil de respiracion para badges de estado.

```scss
@keyframes badge-breathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.05); }
}
// Uso: badge de estado en timer header
// Duracion: 2s ease-in-out infinite
```

#### Success Pulse (CTA)

Pulso verde que se dispara una vez cuando un boton cambia a estado exitoso.

```scss
@keyframes success-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.5); }
  100% { box-shadow: 0 0 0 12px rgba(22, 163, 74, 0); }
}
// Uso: boton principal al cambiar a estado "completado"
// Duracion: 0.8s ease-out (una vez)
```

#### Star Pop (Review Celebration)

Animacion de entrada de estrellas con efecto de rebote.

```scss
@keyframes star-pop {
  0%   { transform: scale(0) rotate(-180deg); opacity: 0; }
  60%  { transform: scale(1.3) rotate(10deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
// Uso: estrellas en el modal de celebracion de resena
// Duracion: 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)
// Se aplica con animation-delay escalonado por estrella
```

#### Title Shimmer Gradient (5-Star Celebration)

Gradiente animado en texto para celebrar 5 estrellas.

```scss
@keyframes shimmer {
  to { background-position: 200% center; }
}

.title.five-stars {
  background: linear-gradient(90deg, #4a9d9a 0%, #FFD700 50%, #4a9d9a 100%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 3s linear infinite;
}
```

#### Marker Pulse (Mapa)

```scss
@keyframes marker-pulse {
  0%   { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}
// Uso: marcador de enfermera en el mapa Mapbox
// Duracion: 2s infinite
```

#### Message Arrive (Chat)

```scss
@keyframes message-arrive {
  0%   { opacity: 0; transform: translateY(20px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
// Uso: cada burbuja de mensaje al aparecer
// Duracion: 300ms cubic-bezier(0.34, 1.56, 0.64, 1)
```

#### Typing Bounce (Chat)

```scss
@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.7; }
  30%           { transform: translateY(-8px); opacity: 1; }
}
// Uso: los tres puntos del indicador "escribiendo..."
// Duracion: 1.4s infinite, con animation-delay de 0, 0.2s, 0.4s
```

#### Emergency Pulse (Panic Button)

```scss
@keyframes emergency-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(var(--ion-color-danger-rgb), 0.4); }
  50%      { box-shadow: 0 0 0 10px rgba(var(--ion-color-danger-rgb), 0); }
}
// Uso: banner de alerta de emergencia activa
// Duracion: 1s ease-in-out infinite
```

#### Tour Pulse (Product Tour)

```scss
@keyframes tour-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.3); }
  50%      { box-shadow: 0 0 0 8px rgba(102, 126, 234, 0.1); }
}
// Uso: elemento resaltado durante el tour del producto (Driver.js)
// Duracion: 2s ease-in-out infinite
```

### 5.3 Accesibilidad - Reduced Motion

Todas las animaciones se desactivan con `prefers-reduced-motion: reduce`:

```scss
// En _design-tokens.scss (global)
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

// En global.scss (con scroll-behavior)
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

// En active-service (especifico)
@media (prefers-reduced-motion: reduce) {
  .compact-stepper .stepper-step.active .stepper-dot,
  .compact-stepper .stepper-line.active .stepper-line-fill,
  .timer-header ion-badge.badge-breathe,
  .actions-section .main-action-btn.success-state {
    animation: none !important;
  }
}
```

---

## 6. Patrones de Layout

### 6.1 Safe Areas

iOS requiere padding para el notch y la barra inferior:

```scss
// Header (toolbar maneja safe-area automaticamente via Ionic)

// Footer sticky
.panic-footer {
  position: fixed;
  bottom: 0;
  padding-bottom: calc(12px + var(--ion-safe-area-bottom, 0));
}

// Chat input
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .chat-input {
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }
}

// Chat header (safe-area-top para modales fullscreen)
.chat-header {
  padding-top: calc(12px + var(--ion-safe-area-top, 0px));
}
```

### 6.2 Layouts Basados en Cards

Las tarjetas siguen un patron consistente:

```
[Card]
  border-radius: 16px
  padding: 16px
  box-shadow: 0 2px 8px rgba(0,0,0,0.08)  // light
  box-shadow: 0 2px 8px rgba(0,0,0,0.3)    // dark
  border: 1px solid #334155               // solo dark mode
```

Variantes de tarjetas usadas:

| Tarjeta | Uso | Diferencia |
|---|---|---|
| `ion-card` | Contenedor generico | Ionic standard con overrides |
| `.nurse-card` | Info de enfermera en tracking | `background: #fafafa` / `#0f172a` |
| `.patient-card` | Info de paciente en active-service | `ion-card` con avatar y acciones |
| `.stat-card` | Estadisticas del dashboard | Flex grid, icono + valor + label |
| `.active-request-card` | Solicitud pendiente | `border-left: 4px solid #2d5f8a` |
| `.waiting-nurse-card` | Enfermera asignada (waiting) | Sin border-left, centrado |

### 6.3 Patrones de Modal

| Tipo | Uso | Caracteristica |
|---|---|---|
| **Fullscreen** | Chat | 100% width/height, sin border-radius (mobile) |
| **Bottom Sheet** | Tracking info, verificacion | `border-radius: 24px 24px 0 0`, handle visible |
| **Floating Center** | Review, celebration, tier onboarding | Centrado con backdrop, `border-radius: 20px` |
| **Page Modal** | Servicios, configuracion | Pagina completa estilo navegacion |

### 6.4 Footer Sticky con Panic Button

```
[ion-content]
  padding-bottom: 140px  // espacio para el footer fijo

[.panic-footer] (position: fixed, bottom: 0)
  background: card-bg
  border-top: 1px solid border
  padding: 20px 16px 12px
  padding-bottom: calc(12px + safe-area-bottom)
```

### 6.5 Stepper Pattern

Dos variantes de stepper:

**Compact Stepper (Nurse - Active Service)**
- Posicionado sobre las acciones
- Dots de 28px, lines de 2px
- Labels absolutamente posicionadas (no afectan el layout)
- Pasos completados se colapsan (label reemplazado por dot de 6px)

**Full Stepper (Patient - Tracking)**
- Dentro del bottom sheet modal
- Dots de 32px, lines de 3px
- Pasos completados se colapsan (label reemplazado por dot de 8px)
- Mas espacioso que el compact

Ambos comparten la logica:
- Lines completadas: `flex: 0 0 12-16px` (comprimidas)
- Line activa: `flex: 1 1 auto; min-width: 60-80px` (expandida, con shimmer)
- Colores por estado (ver seccion 8)

---

## 7. Iconografia

### 7.1 Biblioteca de Iconos

Se usa **Ionicons** exclusivamente. No se usan iconos custom SVG.

### 7.2 Tamanos Estandar

| Contexto | Tamano |
|---|---|
| Dentro de botones | 20-22px |
| Iconos de lista / item | 18-20px |
| Iconos de seccion | 24-28px |
| Iconos de estado vacio | 48-64px |
| Iconos de marcador mapa | 18px (dentro de circulo de 32px) |

### 7.3 Colores de Iconos por Contexto

| Contexto Light | Color | Contexto Dark | Color |
|---|---|---|---|
| Icono en boton primary | `#ffffff` | Icono en boton primary | `#ffffff` |
| Icono informativo | `var(--ion-color-primary)` | Icono informativo | `#6bb5b3` |
| Icono muted | `var(--ion-color-medium)` | Icono muted | `#94a3b8` o `#64748b` |
| Icono success | `#16a34a` | Icono success | `#34d399` |
| Icono danger | `#dc2626` | Icono danger | `#dc2626` |
| Icono warning/star | `#f59e0b` / `#fbbf24` | Icono warning/star | `#fbbf24` |

### 7.4 ion-icon Dentro de ion-button[color]

Cuando un `ion-button` tiene el atributo `color`, el icono dentro hereda el color de Ionic. En dark mode, esto puede fallar si `dark.class.css` cambia los contrastes. Solucion:

```scss
// Forzar color blanco en iconos de botones solidos
ion-button:not([fill="outline"]):not([fill="clear"]) {
  --color: white;
}

// Especifico para iconos primary en dark mode
ion-icon[color="primary"] {
  --ion-color-base: #6bb5b3 !important;
  color: #6bb5b3 !important;
}
```

---

## 8. Sistema de Colores por Estado

### 8.1 Estados de Servicio

La app usa un sistema de colores consistente por estado de servicio. Los colores aparecen en stepper dots, stepper lines, badges, CTAs, banners y mensajes de estado.

#### Light Mode

| Estado | Color | RGB | Uso |
|---|---|---|---|
| `accepted` | `#2563eb` | 37, 99, 235 | Azul - Confirmacion |
| `on_the_way` | `#ea580c` | 234, 88, 12 | Naranja - En camino |
| `arrived` | `#d97706` | 217, 119, 6 | Amber - Llego |
| `in_progress` | `#0891b2` | 8, 145, 178 | Cyan - En progreso |
| `completed` | `#16a34a` | 22, 163, 74 | Verde - Completado |

#### Dark Mode (Versiones mas claras para contraste)

| Estado | Color | RGB | Uso |
|---|---|---|---|
| `accepted` | `#60a5fa` | 96, 165, 250 | Azul claro |
| `on_the_way` | `#fb923c` | 251, 146, 60 | Naranja claro |
| `arrived` | `#fbbf24` | 251, 191, 36 | Amber claro |
| `in_progress` | `#22d3ee` | 34, 211, 238 | Cyan claro |
| `completed` | `#4ade80` | 74, 222, 128 | Verde claro |

### 8.2 Donde se Aplican los Colores por Estado

| Elemento | Como se aplica |
|---|---|
| **Stepper dot** (activo/completado) | `background: [color]` |
| **Stepper line fill** (completada/activa) | `background: [color]` |
| **Stepper label** (activo) | `color: [color]` |
| **Label dot** (paso colapsado) | `background: [color]` |
| **Status dot** (avatar enfermera) | `background: [color]` + pulse animation en on_the_way/arrived/in_progress |
| **Status message banner** | `background: rgba([color], 0.1-0.15); color: [color]` |
| **CTA button** | `--background: [color]` |
| **ion-badge** de estado | Via Ionic color system |
| **Pulse animation** | `--pulse-color-rgb: [RGB]` |

### 8.3 Estados de Verificacion (Dashboard Banners)

| Estado | Gradiente de fondo | Icono de fondo |
|---|---|---|
| `pending` | `linear-gradient(90deg, #f59e0b, #d97706)` | `linear-gradient(135deg, #f59e0b, #d97706)` |
| `under_review` | `linear-gradient(90deg, #2d5f8a, #1e3a5f)` | `linear-gradient(135deg, #2d5f8a, #1e3a5f)` |
| `rejected` | `linear-gradient(90deg, #dc2626, #b91c1c)` | `linear-gradient(135deg, #dc2626, #b91c1c)` |

### 8.4 Estados Terminales (Tracking)

| Estado | Color del icono circular |
|---|---|
| `rejected` | `linear-gradient(135deg, #f97316, #ea580c)` |
| `cancelled` | `linear-gradient(135deg, #64748b, #475569)` |

---

## 9. Componentes Compartidos

Ubicacion: `histora-care/src/app/shared/components/`

### 9.1 ChatModalComponent

**Archivo:** `chat-modal/`
**Modal class:** `chat-modal-fullscreen`
**Encapsulation:** Emulated

Modal de chat fullscreen estilo WhatsApp. Header con avatar, indicador online y estado "escribiendo". Burbujas de mensaje con gradient (enviado) y blanco/dark (recibido). Indicador de typing con dots animados. Quick replies. Input con textarea auto-resizable y boton de envio circular.

Colores dark mode clave: fondo `#0f172a`, cards `#1e293b`, focus border `#6bb5b3`, send button `#4a9d9a`.

### 9.2 ReviewModalComponent

**Archivo:** `review-modal/`
**Modal class:** `review-modal-floating`
**Encapsulation:** None

Modal flotante centrado para dejar resena. Estrellas doradas (`#fbbf24`) con animacion al seleccionar. Chips de sugerencia. Textarea con contador de caracteres. Checkbox de opt-in (verde) para testimonios publicos.

**Nota:** Usa `ViewEncapsulation.None`, por lo que dark mode se aplica con `body.dark {}` directo.

### 9.3 ReviewCelebrationModalComponent

**Archivo:** `review-celebration-modal/`
**Modal class:** `review-celebration-modal`
**Encapsulation:** Emulated

Celebracion despues de que la enfermera recibe una resena. Estrellas con `star-pop` animation. Titulo con shimmer gradient si son 5 estrellas. Card de comentario con borde izquierdo teal. CTA solid navy / teal dark.

### 9.4 VirtualEscortComponent

**Archivo:** `virtual-escort/`
**Encapsulation:** Emulated

Componente collapsible para la escolta virtual. Lista de contactos compartidos con avatares, botones de accion. Boton de agregar contacto con borde dashed. Info text con fondo teal translucido.

### 9.5 PanicButtonComponent

**Archivo:** `panic-button/`
**Encapsulation:** Emulated

Boton circular rojo de emergencia (80px / 56px compact). Gradient rojo con box-shadow progresivo segun taps (1-3). Indicadores de tap (dots) encima del boton. Help text debajo.

En dark mode: dots cambian a blanco (`rgba(255,255,255,0.3)` -> `white` al llenarse).

### 9.6 TrustBadgesComponent

**Archivo:** `trust-badges/`
**Encapsulation:** Emulated

Badges inline de confianza (CEP Habil, Identidad Verificada, Experiencia, Top Rated). Tres tamanos: small, medium, large. Cada badge tiene su propio color via CSS variables `--badge-bg` y `--badge-color`.

### 9.7 TierOnboardingModalComponent

**Archivo:** `tier-onboarding-modal/`
**Modal class:** `tier-onboarding-modal`
**Encapsulation:** Emulated

Onboarding de 3 slides para el sistema de niveles. Progress dots, slide con icono gradient, lista de tiers con iconos coloreados, lista de beneficios. Nav buttons: prev (clear) + next (navy/teal).

### 9.8 SessionWarningModalComponent

**Archivo:** `session-warning-modal/`
**Encapsulation:** Emulated

Modal de advertencia de sesion por expirar. Cuenta regresiva visual. Botones para extender o cerrar sesion.

### 9.9 VerificationRequiredModalComponent

**Archivo:** `verification-required-modal/`
**Encapsulation:** Emulated

Modal que aparece cuando se requiere verificacion antes de una accion. Lista de pasos pendientes.

### 9.10 PatientRatingModalComponent

**Archivo:** `patient-rating-modal/`
**Encapsulation:** Emulated

Modal para que la enfermera califique al paciente. Similar al review modal pero simplificado.

### 9.11 CheckInReminderComponent

**Archivo:** `check-in-reminder/`
**Encapsulation:** Emulated

Recordatorio de check-in durante el servicio activo. Aparece como banner con timer.

### 9.12 NurseListModalComponent

**Archivo:** `nurse-list-modal/`
**Encapsulation:** Emulated

Lista de enfermeras disponibles. Items con avatar, nombre, rating, badges de verificacion.

### 9.13 AiAssistantComponent

**Archivo:** `ai-assistant/`
**Encapsulation:** Emulated

Componente de asistente AI integrado para sugerencias contextuales.

### 9.14 OptimizedImageComponent

**Archivo:** `optimized-image/`
**Encapsulation:** Emulated

Componente wrapper para imagenes con lazy loading, placeholder y fallback.

---

## 10. Reglas y Convenciones

### 10.1 Reglas de Color

1. **NO usar gradientes en botones CTA.** Los CTAs son colores solidos. Navy (`#1e3a5f`) en light, teal (`#4a9d9a`) en dark.
2. **Gradientes solo para decoracion:** Welcome sections, avatares, iconos de seccion, banners de estado.
3. **Teal `#6bb5b3`** es el color interactivo en dark mode (focus, checked, links, precios). NO usarlo en light mode.
4. **Teal `#4a9d9a`** es para CTAs en dark mode. NO confundir con `#6bb5b3`.
5. **Colores de estado son consistentes** en toda la app (ver seccion 8). No inventar nuevos colores.

### 10.2 Reglas de Dark Mode

1. **Siempre** usar `body.dark, body.ion-palette-dark` (ambos selectores).
2. **Componentes emulated:** usar `:host-context(body.dark), :host-context(body.ion-palette-dark)`.
3. **Componentes sin encapsulacion:** usar `body.dark, body.ion-palette-dark` directamente.
4. **Modales:** estilos en `global.scss` o class binding.
5. **Re-overridear contrastes** que `dark.class.css` cambia a negro.
6. **`--wheel-fade-background-rgb`** SIEMPRE setear al RGB del fondo en datetime dark.

### 10.3 Reglas de Toolbar

El toolbar debe ser consistente en toda la app:

```
Light: --background: #ffffff; --color: #1e293b
Dark:  --background: #0f172a; --color: #f1f5f9; --border-color: #334155
```

### 10.4 Reglas de IonicModule

```typescript
IonicModule.forRoot({
  innerHTMLTemplatesEnabled: true  // Requerido para HTML en alerts/toasts
})
```

`IonicSafeString` esta deprecado desde Ionic 8.7.17+. Usar `innerHTMLTemplatesEnabled: true` en su lugar.

### 10.5 Reglas de Accesibilidad (WCAG 2.1 AA)

1. **Contraste minimo 4.5:1** para texto normal, 3:1 para texto grande.
2. **Focus visible:** `outline: 3px solid var(--ion-color-primary); outline-offset: 2px`.
3. **Touch targets minimos:** 44px (preferido 48px).
4. **`prefers-reduced-motion`:** todas las animaciones se desactivan.
5. **`.sr-only`:** clase utilitaria para contenido solo accesible por screen readers.
6. **Placeholder contrast:** `#6b7280` sobre fondos claros (4.5:1), `#94a3b8` sobre fondos oscuros (5.71:1).

### 10.6 Reglas Generales de Codigo

1. **No usar emojis** en codigo a menos que el usuario lo pida explicitamente.
2. **Commits en espanol** - el proyecto es para Peru.
3. **Importar design tokens** via `@use '../../../theme/design-tokens' as tokens;`.
4. **Tokens SCSS son compile-time.** Para valores que cambian en runtime (dark mode), usar CSS custom properties.
5. **No crear archivos .md innecesarios** - solo documentacion esencial.

### 10.7 Espaciado

| Token | Valor | Uso comun |
|---|---|---|
| `$spacing-1` | `4px` | Micro gaps, margin-top minimo |
| `$spacing-2` | `8px` | Gap entre elementos pequenos |
| `$spacing-3` | `12px` | Padding interno de items |
| `$spacing-4` | `16px` | Padding estandar de contenedores |
| `$spacing-5` | `20px` | Padding amplio |
| `$spacing-6` | `24px` | Separacion entre secciones |
| `$spacing-8` | `32px` | Separacion grande |
| `$spacing-10` | `40px` | Padding de estados vacios |
| `$spacing-12` | `48px` | Separacion maxima |

### 10.8 Border Radius

| Token | Valor | Uso |
|---|---|---|
| `$radius-sm` | `4px` | Elementos minimos |
| `$radius-md` | `8px` | Inputs, chips |
| `$radius-lg` | `12px` | Botones, cards internas |
| `$radius-xl` | `16px` | Cards principales |
| `$radius-full` | `9999px` | Circulos, pills |

Cards y modales usan `16-20px`. Botones usan `12px`. Inputs usan `12px`. El tracking sheet modal usa `24px 24px 0 0` (top only).

### 10.9 Sombras

| Token | Valor | Uso |
|---|---|---|
| `$shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Cards sutiles, stat cards |
| `$shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | Cards elevadas |
| `$shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` | Modales, overlays |

En dark mode, las sombras usan opacidad mas alta: `rgba(0,0,0,0.3-0.5)`.

### 10.10 Touch Targets

| Token | Valor | Uso |
|---|---|---|
| `$touch-target-min` | `44px` | Minimo WCAG (botones, items tappable) |
| `$touch-target-comfortable` | `48px` | Preferido para acciones principales |

Los botones principales tienen `height: 48-52px`. Los botones circulares de accion tienen `width/height: 44px`.

---

## Archivos de Referencia

| Archivo | Contenido |
|---|---|
| `src/theme/_design-tokens.scss` | Tokens SCSS: colores, espaciado, tipografia, animaciones |
| `src/global.scss` | Estilos globales, overrides de Ionic, dark mode global |
| `src/theme/variables.scss` | (Vacio - tokens consolidados en _design-tokens.scss) |
| `src/app/patient/tracking/tracking.page.scss` | Stepper completo, colores por estado, mapa |
| `src/app/nurse/active-service/active-service.page.scss` | Stepper compacto, timer, acciones por estado |
| `src/app/nurse/dashboard/dashboard.page.scss` | Welcome section, stats, banners |
| `src/app/shared/components/chat-modal/chat-modal.component.scss` | Chat completo |
| `src/app/shared/components/review-modal/review-modal.component.scss` | Review modal (ViewEncapsulation.None) |
| `src/app/shared/components/panic-button/panic-button.component.scss` | Boton de emergencia |
