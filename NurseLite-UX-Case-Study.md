# NurseLite: UX Case Study

**Plataforma de enfermeria a domicilio en Peru**
Febrero 2026

---

## Resumen Ejecutivo

NurseLite es una plataforma movil (PWA) de dos lados que conecta pacientes con enfermeras profesionales verificadas para servicios de enfermeria a domicilio en Lima, Peru. El proyecto enfrenta un desafio UX unico: construir confianza en un contexto de salud donde ambas partes (paciente y enfermera) necesitan sentirse seguras, mientras se mantiene una experiencia fluida y accesible.

**Stack:** Ionic 8 + Angular (app movil), Next.js 16 (landing), NestJS (backend)
**Usuarios objetivo:** Pacientes que necesitan atencion domiciliaria y enfermeras profesionales independientes
**Contexto critico:** Sector salud en Peru — la confianza, verificacion profesional y seguridad son requisitos no negociables

### Metricas Tecnicas de UX
- **96.5%** de componentes con OnPush change detection (rendimiento percibido)
- **71** modulos lazy-loaded (tiempo de carga inicial optimizado)
- **326 KB** transferidos (gzip) — bundle de 1.36 MB raw
- **WCAG 2.1 AA** como objetivo de accesibilidad
- **Dark mode** completo con deteccion automatica de preferencia del sistema

---

## 1. Contexto del Proyecto

### 1.1 Espacio del Problema

En Peru, la atencion de enfermeria a domicilio opera mayormente de manera informal: recomendaciones boca a boca, sin verificacion profesional, sin transparencia de precios, y sin mecanismos de seguridad para ninguna de las partes. Los pacientes no tienen forma de verificar credenciales, y las enfermeras profesionales no tienen una plataforma que les permita trabajar de forma independiente con garantias.

### 1.2 Declaracion del Problema (Problem Statement)

> "Las familias en Lima que necesitan atencion de enfermeria a domicilio no tienen una forma confiable de encontrar enfermeras verificadas profesionalmente, con transparencia de precios, seguimiento en tiempo real y garantias de seguridad para ambas partes."

### 1.3 Usuarios Objetivo

**Paciente primario:** Adulto 30-55 anos, cuidador familiar, busca atencion para padres mayores o familiares. Tecnologia: smartphone Android, conectividad variable. Necesita confianza y simplicidad.

**Enfermera profesional:** Mujer 25-45 anos, colegiada CEP, busca independencia laboral y mejores ingresos. Familiarizada con apps de delivery/transporte. Necesita flujo rapido de aceptacion y cobro.

### 1.4 Restricciones del Proyecto

| Restriccion | Impacto en UX |
|---|---|
| PWA (no app nativa pura) | Capacitor bridge para features nativas; offline limitado |
| Regulacion CEP obligatoria | Flujo de verificacion multi-paso antes de poder trabajar |
| Contexto salud en Peru | Lenguaje profesional pero accesible; senales de confianza constantes |
| Conectividad variable | Estados de carga robustos; operaciones optimistas |
| Dos roles distintos | Arquitectura de informacion diferenciada por rol |

---

## 2. Personas de Usuario

### Persona 1: Ana Rodriguez (Paciente)

| Atributo | Detalle |
|---|---|
| Edad | 42 anos |
| Ocupacion | Administradora, trabaja desde casa |
| Contexto | Cuida a su madre de 72 anos que necesita inyecciones diarias |
| Dispositivo | Samsung Galaxy A54, Android 14 |
| Modelo mental | Familiarizada con Rappi, PedidosYa — espera experiencia similar |
| Motivacion | Encontrar enfermera confiable sin depender de recomendaciones |
| Frustracion | No poder verificar credenciales, precios ocultos, no saber cuando llega |
| Objetivo | Solicitar servicio en menos de 2 minutos con total transparencia |

### Persona 2: Maria Elena Garcia (Enfermera)

| Atributo | Detalle |
|---|---|
| Edad | 32 anos |
| Ocupacion | Enfermera colegiada CEP, independiente |
| Contexto | Trabaja 3 dias en clinica y busca ingresos extra los otros dias |
| Dispositivo | iPhone 13, iOS 17 |
| Modelo mental | Quiere control total sobre horario y servicios que ofrece |
| Motivacion | Ganar mas sin intermediarios, construir reputacion profesional |
| Frustracion | Apps que cobran comisiones altas, pacientes que no verifican identidad |
| Objetivo | Recibir solicitudes, cobrar rapidamente, crecer profesionalmente |

---

## 3. Arquitectura de Informacion

### 3.1 Estructura de Navegacion

**Paciente:** Navegacion por tabs (hub-and-spoke) — 4 tabs persistentes en la base

```
Tab Home      → Buscar enfermeras, servicios rapidos, trust badges
Tab Mapa      → Mapa con enfermeras cercanas, filtros, solicitud
Tab Historial → Servicios pasados, filtros por fecha, re-solicitar
Tab Config    → Perfil, verificacion, preferencias, tema, soporte
```

**Enfermera:** Navegacion por secciones (dashboard-centric)

```
Dashboard     → Stats, disponibilidad toggle, historial
Servicios     → Configurar servicios ofrecidos, precios, toggle on/off
Solicitudes   → Entrantes (timer), aceptadas, historial
Ganancias     → Balance, historial de pagos, metodos de cobro
Perfil        → Bio, especialidades, verificacion, tier
Resenas       → Rating summary, filtros, infinite scroll
```

### 3.2 Flujos Criticos de Usuario

**Flujo de solicitud (Paciente):** 5 pasos

```
Buscar enfermera → Ver perfil → Solicitar servicio → Pagar → Tracking en vivo
```

**Flujo de verificacion (Enfermera):** 5 pasos con validacion CEP

```
Ingresar CEP → Validacion automatica → Confirmar identidad → Configurar perfil → Lista para trabajar
```

**Flujo de servicio activo (ambos roles):**

```
Solicitud aceptada → En camino (GPS) → Llego → Codigo de seguridad → En servicio → Completado → Resena
```

### 3.3 Progressive Disclosure (Revelacion Progresiva)

Se aplica en multiples contextos:
- **Verificacion:** Cada paso solo muestra los campos relevantes a ese paso
- **Review modal:** El checkbox de uso publico solo aparece cuando rating >= 4 Y comentario >= 20 caracteres
- **Mapa:** Bottom sheet aparece despues de cargar marcadores, no simultaneamente
- **Onboarding:** 1 slide pre-auth, 5 slides post-auth (no abrumar antes del registro)

---

## 4. Heuristicas de Usabilidad de Nielsen Aplicadas

Evaluacion sistematica contra las 10 heuristicas de usabilidad de Jakob Nielsen (Nielsen, 1994).

### H1: Visibilidad del Estado del Sistema (Visibility of System Status)

El sistema informa constantemente al usuario sobre lo que esta sucediendo.

| Implementacion | Ubicacion |
|---|---|
| **Tracking GPS en tiempo real** con posicion de enfermera en mapa, ETA decreciente, y stepper de 5 pasos | `tracking.page.ts` |
| **Estados de servicio** visibles: Pendiente → Aceptado → En camino → Llego → En servicio → Completado | Stepper horizontal con iconos por estado, shimmer en paso activo, pulse en dot activo |
| **Indicador de conexion** WebSocket para chat en tiempo real | Chat modal con status de conexion |
| **Progress bar** durante validacion CEP (0-100% con mensajes rotativos) | Verificacion de enfermera |
| **Timer countdown** en solicitudes entrantes (45s para responder) | Solicitud entrante para enfermera |
| **Loading states** con spinner crescent + mensajes contextuales | Global: "Verificando DNI...", "Subiendo foto...", etc. |
| **Indicadores de lectura** en chat: enviando → enviado → entregado → leido | Chat service con `readBy` array |

### H2: Correspondencia entre Sistema y Mundo Real (Match Between System and Real World)

El sistema habla el idioma del usuario y usa convenciones del mundo real.

| Implementacion | Razon |
|---|---|
| **Espanol peruano** en toda la interfaz | Mercado objetivo: Lima, Peru |
| **Terminologia CEP** (Colegio de Enfermeros del Peru) | Enfermeras reconocen inmediatamente la institucion |
| **Estado "HABIL"** como badge de verificacion | Termino oficial del CEP que las enfermeras conocen |
| **Precios en Soles (S/)** con formato local | Formato monetario peruano estandar |
| **Yape como metodo de pago principal** | Metodo de pago movil mas usado en Peru |
| **Iconografia medica** reconocible: jeringa, curaciones, signos vitales | Servicios identificables sin leer texto |
| **Metafora de delivery** para el flujo de servicio | Los usuarios estan familiarizados con apps tipo Rappi/PedidosYa |

### H3: Control y Libertad del Usuario (User Control and Freedom)

Los usuarios pueden deshacer acciones y salir de flujos no deseados.

| Implementacion | Contexto |
|---|---|
| **Boton de retroceso** consistente en todas las pantallas con toolbar | Navegacion con `NavController` |
| **Cancelar solicitud** antes de que la enfermera acepte | Flujo de solicitud del paciente |
| **Rechazar solicitud** sin penalizacion para enfermeras | Timer de 45s con opcion explicita de rechazo |
| **Toggle de disponibilidad** ON/OFF instantaneo | Dashboard de enfermera |
| **"Omitir por ahora"** en el flujo de resena | Review modal — no forzar feedback |
| **Deshacer seleccion** en filtros de servicios | Deseleccionar chips de servicio |
| **Navegacion por tabs** que preserva estado entre cambios | Patron hub-and-spoke del paciente |

### H4: Consistencia y Estandares (Consistency and Standards)

Elementos consistentes a traves de toda la aplicacion.

| Patron | Implementacion |
|---|---|
| **Botones CTA** siempre navy solido (#1e3a5f) en light, teal (#4a9d9a) en dark — sin gradientes | Design tokens: `$color-cta-light`, `$color-cta-dark` |
| **Toolbar** identico en todas las pantallas: fondo blanco, texto slate, borde sutil | `--background: #ffffff; --color: #1e293b` |
| **Cards** con esquinas redondeadas 16px, sombra suave, padding 24px | Componente `Card` reutilizable |
| **Toasts** posicionados abajo (info/success) o arriba (urgente/error) | `ToastService` centralizado con duracion estandar |
| **Alertas** con boton cancelar siempre gris claro, confirmar siempre color primario | Sistema de alertas `.histora-alert-*` |
| **Iconografia** Ionicons en app, Lucide React en landing | Sets consistentes por plataforma |
| **Espaciado** basado en escala de 4px (4, 8, 12, 16, 20, 24, 32, 40, 48) | Design tokens SCSS |
| **Border radius** escala: 4px (sm), 8px (md), 12px (lg), 16px (xl), 9999px (full) | Design tokens SCSS |

### H5: Prevencion de Errores (Error Prevention)

Diseno que previene problemas antes de que ocurran.

| Implementacion | Tipo de prevencion |
|---|---|
| **Codigo de seguridad de 6 digitos** entre enfermera y paciente | Previene confusion de identidad en servicios |
| **Validacion en tiempo real** de DNI (8 digitos), telefono (9 digitos), email | Restricciones de formato antes de enviar |
| **Botones deshabilitados** hasta completar campos requeridos | `[disabled]="!form.valid"` |
| **Confirmacion de acciones destructivas** (cancelar servicio, logout, eliminar) | Alertas de doble confirmacion |
| **Auto-strip** de caracteres no numericos en campos de DNI y CEP | Input sanitization |
| **Timer visual** en solicitudes entrantes (45s) | Previene timeout sin aviso |
| **Triple-tap para panico** en lugar de boton simple | Previene activacion accidental del boton de emergencia |

### H6: Reconocer en Lugar de Recordar (Recognition Rather Than Recall)

Minimizar la carga de memoria del usuario.

| Implementacion | Contexto |
|---|---|
| **Trust badges** visibles junto al nombre de enfermera | CEP Habil, Identidad Verificada, Experimentada, Top Rated |
| **Perfil completo** de enfermera antes de solicitar | Rating, servicios, numero de resenas, tier, ultima resena |
| **Historial de servicios** accesible con un tap | Tab Historial del paciente |
| **Servicios recientes** en home como acceso rapido | Dashboard del paciente |
| **Sugerencias de resena** contextuales basadas en rating | Chips: "Muy puntual", "Excelente trato", etc. |
| **Estado del servicio** visible en stepper sin necesidad de recordar pasos | Stepper horizontal de 5 pasos con iconos descriptivos |

### H7: Flexibilidad y Eficiencia de Uso (Flexibility and Efficiency of Use)

Aceleradores para usuarios expertos sin complicar la experiencia para nuevos usuarios.

| Implementacion | Beneficio |
|---|---|
| **Sistema de tiers** (Certificada → Destacada → Experimentada → Elite) | Enfermeras expertas obtienen mas visibilidad |
| **Filtros en mapa** por servicio, rating, distancia | Usuarios frecuentes refinan busqueda rapido |
| **Quick replies** en chat contextuales por rol | Respuestas rapidas sin escribir |
| **Toggle de disponibilidad** en dashboard | Un tap para activar/desactivar recepcion de solicitudes |
| **Re-solicitar** desde historial de servicios | Repetir servicio pasado sin rellenar datos |
| **Dark mode** con 3 opciones: Claro, Oscuro, Automatico | Adaptacion a preferencia y contexto de uso |

### H8: Diseno Estetico y Minimalista (Aesthetic and Minimalist Design)

Solo informacion relevante; cada elemento extra compite con los relevantes.

| Decision de diseno | Razon |
|---|---|
| **Sin gradientes en CTAs** — colores solidos | Claridad visual, mejor contraste, consistencia |
| **Informacion progresiva** en verificacion | Solo mostrar campos relevantes al paso actual |
| **Cards con jerarquia visual clara** | Titulo bold → subtitulo medium → detalle regular |
| **Whitespace generoso** entre secciones | Escala de espaciado basada en 8pt grid |
| **Paleta de colores limitada** | Navy + Teal + Neutrals + semanticos (success/warning/error) |
| **Iconos funcionales**, no decorativos | Cada icono comunica informacion, no adorna |

### H9: Ayudar a Reconocer, Diagnosticar y Recuperarse de Errores (Help Users Recognize, Diagnose, and Recover from Errors)

Mensajes de error en lenguaje claro con solucion sugerida.

| Implementacion | Ejemplo |
|---|---|
| **Mensajes de error inline** bajo campos de formulario | "El DNI debe tener 8 digitos" (no "Error de validacion") |
| **Toasts de error** con duracion extendida (4s vs 3s estandar) | Mas tiempo para leer el problema |
| **Error de CEP** con explicacion y enlace a CEP | "No encontramos este numero CEP. Verifica en cep.org.pe" |
| **Fallo de foto** con opcion de reintento | "No se pudo subir la foto. Toca para intentar de nuevo" |
| **Estado de rechazo** en verificacion con motivo y ruta de correccion | Muestra razon especifica + boton "Corregir y reenviar" |
| **Fallback de ubicacion** si GPS falla | Input manual de direccion como alternativa |

### H10: Ayuda y Documentacion (Help and Documentation)

Informacion de ayuda facil de encontrar y orientada a tareas.

| Implementacion | Ubicacion |
|---|---|
| **Seccion FAQ** con accordion colapsable | Landing page y dentro de la app |
| **Modal educativo de CEP** explica por que se verifica | Pre-flujo de verificacion de enfermera |
| **Product tour** con Driver.js para nuevos usuarios | Post-registro, guiado por pasos con highlight |
| **How It Works** en landing — 4 pasos visuales | Seccion dedicada en la pagina principal |
| **Tooltips** en elementos complejos | Tier system, badges, metricas de dashboard |
| **Modal de tier** con carousel de 3 slides | Explica sistema de niveles y beneficios |

---

## 5. Leyes y Principios UX Adicionales

### 5.1 Ley de Fitts (Fitts's Law, 1954)

> "El tiempo para alcanzar un objetivo es funcion de la distancia y tamano del objetivo."

| Aplicacion | Implementacion |
|---|---|
| **Touch targets minimo 44px** | Design token: `$touch-target-min: 44px` |
| **Targets comodos a 48px** | Design token: `$touch-target-comfortable: 48px` |
| **CTAs principales** ocupan ancho completo del contenedor | Botones de solicitud, pago, registro |
| **Botones de aceptar/rechazar** grandes y separados | Solicitud entrante: 60px altura, gap de 16px |
| **Boton de panico** requiere triple-tap (no tap unico) | Tamano deliberadamente grande pero con proteccion |

### 5.2 Ley de Hick (Hick's Law, 1952)

> "El tiempo de decision aumenta logaritmicamente con el numero de opciones."

| Aplicacion | Implementacion |
|---|---|
| **Maximo 4-5 opciones** en seleccion de servicio | Pills de servicio en mapa: Inyeccion, Curaciones, Control vital, Medicacion |
| **2 opciones** en solicitud entrante | Solo Aceptar o Rechazar — sin opciones intermedias |
| **3 modos de tema** | Claro, Oscuro, Automatico — no mas opciones |
| **3 metodos de pago** | Yape, Tarjeta, Efectivo — los mas usados en Peru |
| **Tabs de navegacion limitadas a 4** | Home, Mapa, Historial, Config (paciente) |

### 5.3 Ley de Miller (Miller's Law, 1956)

> "La memoria de trabajo puede manejar 7 ± 2 elementos."

| Aplicacion | Implementacion |
|---|---|
| **Stepper de servicio: 5 pasos** | Aceptado → En camino → Llego → En servicio → Completado |
| **Stats de dashboard: 3 metricas** | Rating, Servicios, Ganancias |
| **Trust badges: maximo 4** | CEP, Identidad, Experiencia, Rating |
| **4 tiers de enfermera** | Certificada → Destacada → Experimentada → Elite |
| **Codigo de seguridad: 6 digitos** | Dentro del rango manejable (7±2) |

### 5.4 Ley de Jakob (Jakob's Law)

> "Los usuarios pasan la mayor parte del tiempo en otros sitios. Prefieren que tu sitio funcione igual que los que ya conocen."

| Aplicacion | Referencia |
|---|---|
| **Flujo de solicitud** similar a Rappi/PedidosYa | Mapa → Seleccionar → Pagar → Tracking |
| **Tracking en vivo** similar a Uber/DiDi | Mapa con punto movil, ETA, stepper |
| **Rating con 5 estrellas** estandar de la industria | Igual que Google Maps, App Store, etc. |
| **Chat** similar a WhatsApp | Burbujas, indicadores de lectura, quick replies |
| **Tab navigation** estandar iOS/Android | Tabs en base con iconos + labels |
| **Pull-to-refresh** para actualizar datos | Gesto nativo esperado por los usuarios |

### 5.5 Principios de Gestalt

| Principio | Aplicacion |
|---|---|
| **Proximidad:** Elementos relacionados agrupados | Stats del dashboard en row de 3 cards, detalles de servicio agrupados |
| **Similitud:** Estilo consistente para elementos del mismo tipo | Todas las cards con 16px radius, misma sombra, mismo padding |
| **Cierre:** Progress indicators muestran completitud | Stepper de servicio, barra de progreso de verificacion |
| **Figura-fondo:** Jerarquia visual con contraste claro | Cards blancas sobre fondo gris (#f8fafc), modales con backdrop oscuro |
| **Continuidad:** Lineas de conexion en steppers | Lineas que conectan pasos del stepper de servicio |

### 5.6 Peak-End Rule (Kahneman)

> "Las personas juzgan una experiencia basandose en su punto mas intenso y en su final."

| Momento Peak | Implementacion |
|---|---|
| **Servicio completado** | Confetti animation + badge dorado "Ganaste S/40" con contador animado |
| **Tier promotion** | Celebracion con confetti continuo + animacion de badge Certificada → Destacada |
| **Verificacion exitosa** | Confetti + checkmark verde + modal de celebracion |
| **End: Resena enviada** | Stagger animation de 5 estrellas, confetti, mensaje de agradecimiento |

---

## 6. Accesibilidad e Inclusion (WCAG 2.1 AA)

### 6.1 Principios POUR

#### Perceptible (Perceivable)

| Criterio | Implementacion |
|---|---|
| **Contraste de color** AA (4.5:1 texto, 3:1 UI) | Texto primario light: #1e293b sobre blanco = 12.63:1. Dark: #f1f5f9 sobre #0f172a = 15.2:1 |
| **Dark mode completo** | 3 modos: Claro, Oscuro, Auto. CSS variables dinamicas en todos los componentes |
| **Textos descriptivos** en iconos | `aria-label` en botones de icono (telefono, chat, mapa) |
| **No depender solo del color** | Badges combinan color + icono + texto. Estados usan icono + color + label |
| **Texto escalable** | Sistema tipografico en rem/px coherente, no se rompe a 200% zoom |

#### Operable (Operable)

| Criterio | Implementacion |
|---|---|
| **Touch targets** minimo 44px | Design token enforced: `$touch-target-min: 44px` |
| **Skip link** para navegacion con teclado | `.skip-link` visible en `:focus` — "Saltar al contenido principal" |
| **Focus visible** en todos los interactivos | `:focus-visible` con outline 3px solid primary, offset 2px |
| **Sin limites de tiempo criticos** | Timer de solicitud (45s) es para enfermeras, no bloquea al paciente |
| **Movimiento reducido** | `@media (prefers-reduced-motion: reduce)` desactiva todas las animaciones |
| **Safe areas** respetadas | `env(safe-area-inset-*)` para dispositivos con notch |

#### Comprensible (Understandable)

| Criterio | Implementacion |
|---|---|
| **Lenguaje simple** | Espanol llano, sin jerga tecnica para usuarios finales |
| **Etiquetas claras** en formularios | Cada input con `<label>` visible, placeholder como sugerencia |
| **Errores especificos** | Mensajes que indican QUE esta mal y COMO corregirlo |
| **Comportamiento predecible** | Navegacion consistente, mismos patrones en todas las pantallas |
| **Ayuda contextual** | Modales educativos antes de flujos complejos (CEP, verificacion) |

#### Robusto (Robust)

| Criterio | Implementacion |
|---|---|
| **HTML semantico** | Heading hierarchy, form labels, landmark regions |
| **ARIA labels** en componentes custom | Botones de icono, toggles, modales custom |
| **Clase `.sr-only`** para texto solo screen reader | `position: absolute; width: 1px; height: 1px; clip: rect(0,0,0,0)` |
| **Cross-platform** | PWA + Capacitor bridge para iOS y Android nativos |
| **`aria-live="polite"`** en mensajes de error | Screen readers anuncian errores de validacion |

### 6.2 Diseno Inclusivo

| Consideracion | Implementacion |
|---|---|
| **Alfabetizacion variable** | Iconos acompanan texto en todas las acciones clave |
| **Literacidad tecnologica** | Onboarding guiado con product tour (Driver.js) |
| **Conectividad variable** | Loading states robustos, operaciones optimistas |
| **Accesibilidad economica** | Precios transparentes desde el inicio, sin costos ocultos |
| **Idioma** | Espanol como idioma unico — apropiado para mercado peruano |

---

## 7. Sistema de Diseno (Design System)

### 7.1 Paleta de Color

#### Semantica de Color

| Token | Light | Dark | Uso |
|---|---|---|---|
| CTA Primary | `#1e3a5f` (navy) | `#4a9d9a` (teal) | Botones principales — solido, sin gradiente |
| Success | `#16a34a` | `#22c55e` | Verificacion exitosa, disponible |
| Warning | `#d97706` | `#f59e0b` | Timer, alertas no criticas |
| Error | `#dc2626` | `#ef4444` | Errores, cancelaciones, acciones destructivas |
| Surface | `#ffffff` | `#1e293b` | Cards, contenedores |
| Background | `#f8fafc` | `#0f172a` | Fondo principal |
| Text Primary | `#1e293b` | `#f1f5f9` | Texto principal |
| Text Secondary | `#475569` | `#cbd5e1` | Texto secundario |
| Border | `#e2e8f0` | `#334155` | Bordes y separadores |

**Decision: Sin gradientes en CTAs.** Los botones de accion principal usan color solido porque: (1) mejor contraste WCAG, (2) mayor consistencia visual, (3) en contexto de salud, solidez transmite confiabilidad.

### 7.2 Tipografia

| Nivel | Tamano | Peso | Uso |
|---|---|---|---|
| Display | 24px | 800 | Numeros de dashboard, precios prominentes |
| Heading 1 | 20px | 700 | Titulos de seccion |
| Heading 2 | 18px | 600 | Subtitulos, nombres de enfermera |
| Body | 16px | 400 | Texto principal |
| Body Small | 14px | 400 | Texto secundario, metadata |
| Caption | 12px | 400 | Labels, timestamps, disclaimers |

**Familia:** System fonts stack (Roboto en Android, SF Pro en iOS, Geist en web) — sin carga de fuentes externas para optimizar rendimiento.

### 7.3 Elevacion y Sombras

| Nivel | Valor | Uso |
|---|---|---|
| Small | `0 1px 2px rgba(0,0,0,0.05)` | Inputs, elementos sutiles |
| Medium | `0 4px 6px -1px rgba(0,0,0,0.1)` | Cards, dropdowns |
| Large | `0 10px 15px -3px rgba(0,0,0,0.1)` | Modales, bottom sheets, elementos flotantes |
| Dark mode | Opacidad incrementada (0.3-0.5) | Compensar falta de sombras visibles en fondos oscuros |

### 7.4 Espaciado

Escala basada en **8-point grid** con excepciones en 4px para micro-ajustes:

```
4px  → Micro-gaps (entre icono y texto inline)
8px  → Tight spacing (gap entre badges, chips)
12px → Compact (padding interno de pills)
16px → Standard (gap entre elementos de formulario)
20px → Comfortable (padding de cards)
24px → Section gap (entre grupos de contenido)
32px → Section break (entre secciones mayores)
40px → Page section (antes/despues de headers)
48px → Major section (separacion entre bloques principales)
```

### 7.5 Componentes Reutilizables

| Componente | Proposito | Variantes |
|---|---|---|
| **Trust Badges** | Senales de confianza en perfiles | CEP Habil, Identidad Verificada, Experimentada, Top Rated (max 4) |
| **Review Modal** | Captura de resena post-servicio | Rating obligatorio, comentario opcional, opt-in de uso publico |
| **Chat Modal** | Comunicacion en tiempo real | Fullscreen movil, card centrada tablet, quick replies por rol |
| **Panic Button** | Seguridad durante servicio | Triple-tap activacion, 2 niveles (Ayuda/Emergencia) |
| **Virtual Escort** | Compartir ubicacion con contactos | Max 3 contactos, relaciones definidas |
| **Tier Onboarding** | Educacion sobre sistema de niveles | Carousel 3 slides, CTA de progression |
| **Horizontal Stepper** | Estado de servicio activo | 5 pasos equidistantes, iconos por estado, shimmer en activo, pulse en dot |

---

## 8. Patrones de Confianza y Seguridad (Trust & Safety Patterns)

Este es el diferenciador clave de NurseLite. En un contexto de salud, cada interaccion debe reforzar la confianza.

### 8.1 Verificacion Profesional CEP

**Flujo:** Ingreso CEP → Validacion automatica contra API del Colegio de Enfermeros → Muestra nombre, foto, estado HABIL → Enfermera confirma identidad → Upload de documentos → Selfie → Aprobacion admin.

**Patrones UX aplicados:**
- **Feedback inmediato** durante validacion (progress bar + mensajes rotativos)
- **Modal educativo** pre-flujo: explica POR QUE se verifica (genera aceptacion)
- **Estado HABIL** como badge verde prominente (reconocimiento inmediato)
- **Pantalla de espera** post-envio con tareas sugeridas (reduce ansiedad)

### 8.2 Codigo de Seguridad

Cada servicio genera un codigo unico de 6 digitos que ambas partes deben intercambiar fisicamente al encontrarse.

**Patron UX:** Similar a codigos de entrega de Amazon/Rappi pero adaptado a contexto de salud donde la verificacion de identidad es critica.

**Decision de diseno:** Digitos presentados individualmente en boxes separadas (no un string continuo) para facilitar lectura verbal por telefono.

### 8.3 Boton de Panico

**Activacion:** Triple-tap dentro de 1.5 segundos (no tap unico).
**Progresion haptica:** Light → Medium → Heavy con cada tap (feedback fisico de activacion).
**Niveles:** Ayuda necesaria (warning) vs Emergencia (danger) con confirmacion doble.
**Datos:** Captura geolocalizacion y plataforma automaticamente.

**Razon del triple-tap:** Ley de Fitts aplicada inversamente — una accion critica que NO queremos que ocurra accidentalmente requiere deliberacion.

### 8.4 Virtual Escort

Comparte ubicacion en vivo con hasta 3 contactos de confianza durante el servicio. Categorias de contacto: Familiar, Pareja, Amigo/a.

### 8.5 Sistema de Tiers (Gamificacion para Confianza)

| Tier | Requisitos | Color | Icono |
|---|---|---|---|
| Certificada | Base (CEP verificada) | Gris | Checkmark |
| Destacada | 10+ servicios, 4.0+ rating | Navy | Star |
| Experimentada | 30+ servicios, 4.5+ rating, 10+ resenas | Purpura (#7B68EE) | Ribbon |
| Elite | 50+ servicios, 4.7+ rating, 20+ resenas | Dorado | Trophy |

**Patron UX:** Gamificacion aplicada a confianza — cada tier es una senal de calidad para el paciente y un motivador de engagement para la enfermera. La celebracion visual (confetti + animacion de transicion) refuerza la Peak-End Rule.

---

## 9. Experiencia en Tiempo Real

### 9.1 Tracking en Vivo

- **Mapa Mapbox** con posicion de enfermera actualizada via WebSocket
- **ETA decreciente** calculada en tiempo real
- **Ruta animada** con polyline dashed
- **Stepper horizontal** que avanza con cada cambio de estado
- **Pulse animation** en dot activo + shimmer en linea activa
- **CSS on-demand:** Mapbox CSS cargado dinamicamente (no en bundle global) — ahorro de ~50KB

### 9.2 Chat en Tiempo Real

- **Socket.io** en namespace `/chat` con JWT authentication
- **Tipos de mensaje:** texto, imagen, voz, ubicacion, sistema, quick_reply
- **Status tracking:** enviando → enviado → entregado → leido (similar a WhatsApp)
- **Quick replies** contextuales: enfermeras reciben sugerencias diferentes a pacientes
- **Restriccion de acceso:** Chat solo disponible durante servicio activo (privacidad y limites claros)

### 9.3 Notificaciones

**Push (nativas):** APNs para iOS, FCM para Android, Web Push para PWA
**Granularidad:** Preferencias por tipo (solicitudes, actualizaciones, pagos, promociones, recordatorios)
**Patron offline:** Servidor almacena notificacion si usuario no esta conectado; entrega al reconectar

---

## 10. Micro-interacciones y Feedback Haptico

### 10.1 Servicio de Haptics

| Tipo | Uso | Patron |
|---|---|---|
| `light()` | Toggle switches, checkbox, seleccion de lista | Confirmacion sutil |
| `medium()` | Press de boton, swipe de card, pull-to-refresh | Confirmacion media |
| `heavy()` | Acciones mayores, dialogos de confirmacion | Enfasis de consecuencia |
| `success()` | Envio de resena, verificacion completada | Refuerzo positivo |
| `warning()` | Error de validacion, timeout cercano | Alerta sin alarma |
| `error()` | Fallo de operacion | Alerta |
| `selectionChanged()` | Picker, cambio de segmento | Feedback de cambio |

### 10.2 Animaciones de Celebracion

- **Libreria:** canvas-confetti
- **Colores brand:** Teal, Navy, Cyan, Gold, Red
- **Trigger patterns:** Burst unico (25 particulas) para logros menores; confetti continuo para tier promotion
- **Reduccion de movimiento:** Respetada via `prefers-reduced-motion` — animaciones desactivadas

---

## 11. Optimizacion de Rendimiento como UX

### 11.1 Rendimiento Percibido

| Optimizacion | Impacto UX |
|---|---|
| **71 modulos lazy-loaded** | Pantalla inicial carga en <2s en 4G |
| **NoPreloading** (antes PreloadAllModules) | Ahorro de ~2MB en carga inicial |
| **OnPush change detection** en 96.5% componentes | UI sin jank ni retrasos |
| **Mapbox CSS on-demand** | -50KB del bundle global |
| **Eliminacion de leaflet** (dependencia muerta) | Reduccion de bundle sin afectar funcionalidad |
| **Compresion de imagenes** antes de upload | Reduccion de tiempo de carga en fotos de verificacion |

### 11.2 Bundle Final

```
Raw:         1.36 MB
Transferido: 326 KB (gzip)
```

---

## 12. Evaluacion Heuristica e Iteraciones

### 12.1 Proceso de Auditoria

Se realizaron 3 rondas de auditoria UX/UI sistematica, documentadas en commits:

| Ronda | Hallazgos | Commit | Ejemplos |
|---|---|---|---|
| **Ronda 1** | 16 hallazgos corregidos | `e23abae` | Contraste en dark mode, toasts inconsistentes, toolbar sin fondo en dark |
| **Ronda 2** | 14 hallazgos corregidos | `f2b9498` | Formato de precios S/. → S/, hover states en dark, map controls |
| **Ronda 3** | 13 hallazgos corregidos | `3cea7fd` | Aria-labels en iconos, skeleton screens, date range en historial |

### 12.2 Formato de Hallazgos

Cada hallazgo fue evaluado con:

**Ejemplo:**
```
Hallazgo: Toast de error usa misma duracion que toast informativo
Heuristica Violada: H1 (Visibilidad del estado del sistema)
Severidad: Menor
Ubicacion: ToastService global
Solucion: Error toasts → 4000ms, Info/Success toasts → 3000ms
```

### 12.3 Hallazgos Criticos Resueltos

| Hallazgo | Heuristica | Solucion |
|---|---|---|
| Time picker invisible en dark mode | H4 (Consistencia) | Set `--wheel-fade-background-rgb` para match con fondo dark |
| Formato de precio inconsistente S/. vs S/ | H4 (Consistencia) | Estandarizar a S/ (formato oficial peruano) |
| Iconos sin labels para screen readers | H10 (Ayuda) | Agregar `aria-label` a todos los iconos interactivos |
| Mapa carga CSS global innecesariamente | H7 (Eficiencia) | Mapbox CSS on-demand via CDN |
| Boton de retroceso ausente en algunas pantallas | H3 (Control) | Agregar back buttons consistentes |
| Skeleton screens ausentes en listas | H1 (Visibilidad) | Implementar skeleton loading states |

---

## 13. Decisiones de Diseno y Razonamiento

### 13.1 ¿Por que PWA en lugar de nativa pura?

| Factor | Decision |
|---|---|
| **Distribucion** | Sin App Store review → deploy instantaneo via web |
| **Costo** | Un codebase para iOS + Android + Web |
| **UX trade-off** | Capacitor bridge para features nativas (camera, GPS, haptics, push) |
| **Riesgo** | Offline limitado — mitigado con loading states robustos |

### 13.2 ¿Por que no gradientes en CTAs?

1. **Accesibilidad:** Color solido garantiza ratio de contraste WCAG AA
2. **Consistencia:** Un color es mas facil de mantener que un gradiente a traves de dark/light mode
3. **Contexto medico:** Solidez visual = confiabilidad percibida (no "flashy")
4. **Rendimiento:** Menos rendering en dispositivos de gama baja

### 13.3 ¿Por que triple-tap para panico?

1. **Prevencion de error** (H5): Un boton de emergencia de un tap se activa accidentalmente
2. **Feedback progresivo:** Haptics light → medium → heavy confirman la intencion
3. **Deliberacion:** 1.5s window requiere accion consciente, no reflejo accidental
4. **Referencia:** Similar a la activacion de SOS de Apple (multiple press power button)

### 13.4 ¿Por que chat solo durante servicio activo?

1. **Limites claros:** Protege privacidad de ambas partes
2. **Contexto:** Chat fuera de servicio no tiene caso de uso justificado
3. **Seguridad:** Previene comunicacion no deseada post-servicio
4. **Modelo mental:** Consistente con apps de ride-sharing (Uber, DiDi)

### 13.5 ¿Por que opt-in para testimonios publicos?

1. **Privacidad por defecto:** Solo resenas con consentimiento explicito se muestran publicamente
2. **Calidad:** Solo rating >= 4 con comentario >= 20 caracteres pueden optar
3. **Formato:** Solo "nombre + inicial de apellido" (ej: "Ana R.") para proteger identidad
4. **Regulacion:** Cumple con principios de proteccion de datos personales

---

## 14. Landing Page como Herramienta de UX

### 14.1 Estructura Informacional

La landing page sigue el patron de persuasion AIDA (Attention, Interest, Desire, Action):

| Seccion | Funcion AIDA | Patron UX |
|---|---|---|
| Hero + tabs (Paciente/Enfermera) | **Attention** | Segmentacion inmediata del usuario |
| How It Works (4 pasos) | **Interest** | Reduccion de complejidad percibida |
| Servicios + Precios | **Interest** | Transparencia desde el inicio |
| Verificacion CEP | **Desire** | Senal de confianza diferenciadora |
| Onboarding Demo interactivo | **Desire** | Experiencia del producto sin descargarlo |
| Testimonios | **Desire** | Prueba social (social proof) |
| FAQ | **Desire** | Resolucion de objeciones |
| CTA Final | **Action** | Conversion |

### 14.2 Demo Interactivo (Onboarding Demo)

Componente complejo (~92KB) que simula el flujo completo de la app:
- **Tabs:** Enfermera (9 pantallas) y Paciente (7 pantallas)
- **Animaciones:** Typing effect, stagger, confetti, stepper animado
- **Auto-advance** con pause-on-hover (desktop)
- **Swipe navigation** para movil (touch threshold: 40px horizontal)
- **Timeline sidebar** con progress connector animado entre pasos
- **No-loop:** Se detiene en el ultimo paso con boton "Repetir demo"

### 14.3 Demos TikTok/Reels

Demos dedicados para grabacion de video publicitario:
- **Interstitials narrativos:** Pantallas de transicion entre pasos clave con icono + texto (1.5s cada uno)
- **Posicion estrategica:** No en los primeros 3 segundos (hook rule de TikTok)
- **Formato:** 1080x1920px (9:16 vertical), dev-only (redirect a / en produccion)

---

## 15. Metodologias y Frameworks de Referencia

| Framework/Ley | Autor | Ano | Aplicacion en NurseLite |
|---|---|---|---|
| 10 Heuristicas de Usabilidad | Jakob Nielsen | 1994 | Evaluacion sistematica de toda la interfaz (seccion 4) |
| Ley de Fitts | Paul Fitts | 1954 | Touch targets, tamano de botones, zona de pulgar |
| Ley de Hick | William Hick | 1952 | Limitacion de opciones en cada decision |
| Ley de Miller | George Miller | 1956 | Chunking de informacion en 5-7 grupos |
| Ley de Jakob | Jakob Nielsen | 2000 | Patrones familiares de apps existentes |
| Principios de Gestalt | Wertheimer et al. | 1923 | Agrupacion visual, proximidad, similitud |
| Peak-End Rule | Daniel Kahneman | 1993 | Celebraciones en momentos clave (confetti, tier up) |
| Design Thinking | Stanford d.school | 2004 | Proceso iterativo: empatizar, definir, idear, prototipar, testear |
| WCAG 2.1 | W3C | 2018 | Accesibilidad nivel AA como objetivo |
| Human Interface Guidelines | Apple | 2007+ | Patrones nativos iOS (safe areas, haptics) |
| Material Design | Google | 2014+ | Elevacion, motion, componentes |

---

## 16. Resultados y Metricas

### 16.1 Metricas Tecnicas Alcanzadas

| Metrica | Valor | Benchmark |
|---|---|---|
| Bundle transferido | 326 KB | < 500 KB (bueno para 4G) |
| Componentes OnPush | 96.5% | > 80% es excelente |
| Modulos lazy-loaded | 71 | Cobertura completa |
| Cobertura de tests | 81.99% statements, 83.25% lineas | > 80% es solido |
| Suites de test | 33 suites, 768 tests | En ~13.5 segundos |
| Rondas de auditoria UX | 3 rondas, 43 hallazgos corregidos | Proceso iterativo documentado |
| Dark mode | 100% cobertura de componentes | Con deteccion automatica de sistema |
| Accesibilidad | WCAG 2.1 AA target | Focus visible, contrast ratios, aria-labels, reduced motion |

### 16.2 Decisiones Validadas

| Hipotesis | Validacion |
|---|---|
| Triple-tap previene activaciones accidentales de panico | 0 reportes de falsas alarmas |
| CEP modal educativo reduce abandono de verificacion | Enfermeras completan flujo entendiendo el POR QUE |
| Quick replies aceleran comunicacion en chat | Reduccion de tipeo manual durante servicio activo |
| Tier system motiva completar mas servicios | Enfermeras mencionan "subir de nivel" como motivador |

---

## Referencias

1. Nielsen, J. (1994). *10 Usability Heuristics for User Interface Design*. Nielsen Norman Group.
2. Nielsen, J. (2000). *Jakob's Law of Internet User Experience*. Nielsen Norman Group.
3. Norman, D. (2013). *The Design of Everyday Things* (Revised ed.). Basic Books.
4. Krug, S. (2014). *Don't Make Me Think, Revisited* (3rd ed.). New Riders.
5. Fitts, P. M. (1954). The information capacity of the human motor system in controlling the amplitude of movement. *Journal of Experimental Psychology*, 47(6), 381-391.
6. Hick, W. E. (1952). On the rate of gain of information. *Quarterly Journal of Experimental Psychology*, 4(1), 11-26.
7. Miller, G. A. (1956). The magical number seven, plus or minus two. *Psychological Review*, 63(2), 81-97.
8. Kahneman, D. (1999). Objective happiness. In D. Kahneman, E. Diener, & N. Schwarz (Eds.), *Well-being: The foundations of hedonic psychology*. Russell Sage Foundation.
9. W3C (2018). *Web Content Accessibility Guidelines (WCAG) 2.1*. World Wide Web Consortium.
10. Apple Inc. (2023). *Human Interface Guidelines*. Apple Developer Documentation.
11. Google (2023). *Material Design 3*. material.io.
12. Wertheimer, M. (1923). Laws of organization in perceptual forms. *Psychologische Forschung*, 4, 301-350.

---

*Documento generado como parte del proceso de desarrollo de NurseLite. Todas las decisiones de diseno estan respaldadas por principios de usabilidad establecidos y validadas a traves de iteraciones sistematicas de auditoria UX/UI.*

*NurseLite — Enfermeria a domicilio*
*app.nurse-lite.com*
