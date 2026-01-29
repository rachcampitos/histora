# Flujo de Onboarding de Enfermeras - NurseLite

## Resumen Ejecutivo

El onboarding de enfermeras es un flujo de 4 pantallas que explica el modelo de negocio P2P (peer-to-peer) de NurseLite y guia a las enfermeras en la configuracion inicial de su perfil.

**Objetivo:** Que las enfermeras entiendan como recibir pagos y configuren sus metodos de pago antes de empezar a recibir solicitudes.

---

## Flujo Completo

```
                    FLUJO DE ONBOARDING
                    ====================

     PANTALLA 1: BIENVENIDA
     ======================
     - Saludo personalizado con nombre
     - Explicacion breve de NurseLite
     - [Obligatorio] Continuar

                    |
                    v

     PANTALLA 2: MODELO DE PAGO P2P
     ==============================
     - Diagrama: Paciente -> Enfermera (directo)
     - Explicacion: "Los pacientes te pagan a ti"
     - Metodos: Yape, Plin, Efectivo
     - Sin intermediarios ni comisiones
     - [Obligatorio] Continuar

                    |
                    v

     PANTALLA 3: CONFIGURAR METODOS DE PAGO
     ======================================
     - Campo: Numero Yape (9 digitos)
     - Campo: Numero Plin (9 digitos)
     - Toggle: Acepta efectivo
     - [Opcional] Puede saltar

                    |
                    v

     PANTALLA 4: PLANES DE SUSCRIPCION
     =================================
     - Plan Basico: Gratis (limitado)
     - Plan Pro: S/29/mes
     - Plan Premium: S/99/mes
     - [Opcional] Puede saltar o ir a suscripcion

                    |
                    v

     -> DASHBOARD (onboarding completado)
```

---

## Pantallas Detalladas

### Pantalla 1: Bienvenida

**Contenido:**
- Titulo: "Bienvenida a NurseLite, [Nombre]"
- Subtitulo: "Tu plataforma para conectar con pacientes"
- Icono: Corazon medico

**Comportamiento:**
- Obligatoria, no se puede saltar
- Obtiene nombre del usuario autenticado

---

### Pantalla 2: Modelo de Pago P2P

**Contenido:**
- Titulo: "Como funcionan los pagos"
- Diagrama visual del flujo de pago
- Texto explicativo:
  - "Los pacientes te pagan directamente"
  - "Tu defines tus precios"
  - "Sin comisiones por servicio"

**Metodos de pago mostrados:**
- Yape (icono morado)
- Plin (icono verde)
- Efectivo (icono verde)

**Comportamiento:**
- Obligatoria, no se puede saltar
- Critica para entender el modelo de negocio

---

### Pantalla 3: Configurar Metodos de Pago

**Campos:**
| Campo | Tipo | Validacion |
|-------|------|------------|
| Numero Yape | Tel | 9 digitos, solo numeros |
| Numero Plin | Tel | 9 digitos, solo numeros |
| Acepta Efectivo | Toggle | Default: true |

**Comportamiento:**
- Opcional, puede saltar
- Al guardar, actualiza el perfil de enfermera
- Minimo un metodo de pago para continuar (si decide guardar)

---

### Pantalla 4: Planes de Suscripcion

**Planes mostrados:**

| Plan | Precio | Caracteristicas |
|------|--------|-----------------|
| Basico | Gratis | Radio limitado, solicitudes limitadas |
| Pro | S/29/mes | Radio ampliado, mas solicitudes |
| Premium | S/99/mes | Sin limites, prioridad |

**Comportamiento:**
- Opcional, puede saltar
- Boton "Ver planes" lleva a pagina de suscripcion
- Boton "Saltar" completa onboarding

---

## Estado del Onboarding

### Servicio: NurseOnboardingService

**Ubicacion:** `histora-care/src/app/core/services/nurse-onboarding.service.ts`

**Estado persistido en localStorage:**
```typescript
interface NurseOnboardingState {
  completedAt: string | null;      // ISO date cuando se completo
  currentStep: number;             // Pantalla actual (0-3)
  skippedSetup: boolean;          // Si salto configuracion
  checklistItems: {
    paymentMethods: boolean;      // Tiene Yape/Plin configurado
    services: boolean;            // Tiene servicios agregados
    availability: boolean;        // Tiene horario configurado
    bio: boolean;                 // Tiene biografia (>20 chars)
  };
}
```

**Key de localStorage:** `nurselite_nurse_onboarding`

---

## Profile Checklist Component

Despues del onboarding, el dashboard muestra un checklist de completitud del perfil.

### Items del Checklist

| ID | Label | Condicion de Completitud |
|----|-------|--------------------------|
| paymentMethods | Configura metodos de pago | yapeNumber OR plinNumber |
| services | Agrega tus servicios | services.length > 0 |
| availability | Define tu disponibilidad | availableFrom AND availableTo |
| bio | Completa tu biografia | bio.length > 20 |

### Comportamiento

- **Visible:** Solo si no estan todos los items completos
- **Minimizable:** Click en header colapsa/expande
- **Navegacion:** Click en item lleva a la seccion correspondiente
- **Auto-hide:** Se oculta 3 segundos despues de completar todo

---

## Banner de Metodos de Pago

En la pagina de perfil, aparece un banner contextual cuando no hay Yape/Plin configurado.

**Condicion de visibilidad:**
```typescript
!yapeNumber() && !plinNumber()
```

**Accion:** Scroll suave a la seccion de metodos de pago.

---

## Integracion con el Flujo de Registro

```
Registro -> Login -> Dashboard
                        |
                        v
              Onboarding completado?
                   /        \
                 NO          SI
                  |           |
                  v           v
            Onboarding    Dashboard
                  |
                  v
            Dashboard + Checklist
```

El `DashboardPage` verifica en `ngOnInit`:
```typescript
await this.nurseOnboarding.init();
if (!this.nurseOnboarding.isCompleted()) {
  this.router.navigate(['/nurse/onboarding'], { replaceUrl: true });
  return;
}
```

---

## Archivos Relacionados

### Frontend (histora-care)

| Archivo | Descripcion |
|---------|-------------|
| `core/services/nurse-onboarding.service.ts` | Servicio de estado |
| `nurse/onboarding/onboarding.module.ts` | Modulo del onboarding |
| `nurse/onboarding/onboarding.page.ts` | Logica de las 4 pantallas |
| `nurse/onboarding/onboarding.page.html` | Template con swiper |
| `nurse/onboarding/onboarding.page.scss` | Estilos con dark mode |
| `nurse/dashboard/components/profile-checklist/*` | Componente checklist |

### Backend (histora-back)

No requiere cambios en backend. El estado se maneja completamente en el frontend con localStorage.

---

## Consideraciones de UX

1. **Obligatoriedad:** Solo las 2 primeras pantallas son obligatorias
2. **Persistencia:** El progreso se guarda en cada cambio de pantalla
3. **Re-entrada:** Si cierra la app, continua donde quedo
4. **Gamificacion:** El checklist motiva a completar el perfil
5. **Contextualidad:** El banner solo aparece cuando es relevante

---

## Metricas Sugeridas (Futuro)

- Tasa de completitud del onboarding
- Tiempo promedio en cada pantalla
- % de enfermeras que configuran Yape/Plin vs solo efectivo
- % de enfermeras que van a planes vs saltan
- Items del checklist mas/menos completados
