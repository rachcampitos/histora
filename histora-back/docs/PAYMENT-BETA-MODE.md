# Modo Beta de Pagos - Solo Efectivo

## Descripción

Durante la fase beta de Histora Care, los pagos con tarjeta de crédito/débito y Yape están deshabilitados. Solo se acepta pago en efectivo al finalizar el servicio.

## Razón

1. **Reducir complejidad** en fase de validación
2. **Evitar costos de procesamiento** antes de tener volumen
3. **Simplificar disputas/reembolsos** iniciales
4. **Enfocarse en el core** del servicio (matching enfermera-paciente)

## Implementación

### Frontend (checkout.page.ts)

```typescript
// Flag de control
betaMode = signal(true);  // Cambiar a false para habilitar todos los métodos
```

### Comportamiento en UI

Cuando `betaMode = true`:

| Método de Pago | Estado | Badge |
|----------------|--------|-------|
| Efectivo | ✅ Habilitado | "Disponible" (verde) |
| Tarjeta | ❌ Deshabilitado | "Próximamente" (gris) |
| Yape | ❌ Deshabilitado | "Próximamente" (gris) |

### Elementos Visuales

1. **Efectivo destacado** con borde verde
2. **Tarjeta y Yape** con opacidad reducida (0.6) y no clickeables
3. **Banner informativo** explicando la limitación beta

### Mensaje al Usuario

```
"Durante el lanzamiento beta, solo aceptamos pagos en efectivo.
Los pagos con tarjeta y Yape estarán disponibles muy pronto."
```

## Flujo de Pago en Efectivo

```
1. Paciente selecciona "Efectivo"
   ↓
2. Modal de confirmación:
   "Pagará al finalizar el servicio.
    La enfermera confirmará el pago en persona."
   ↓
3. Click "Confirmar"
   ↓
4. Servicio queda registrado con paymentMethod: 'cash'
   ↓
5. Enfermera confirma pago al finalizar servicio
```

## Archivos Modificados

- `src/app/patient/checkout/checkout.page.ts` - Flag betaMode
- `src/app/patient/checkout/checkout.page.html` - Condicionales UI
- `src/app/patient/checkout/checkout.page.scss` - Estilos disabled/beta

## Habilitar Pagos Completos (Post-Beta)

Para habilitar todos los métodos de pago:

```typescript
// En checkout.page.ts
betaMode = signal(false);
```

O mejor, moverlo a environment:

```typescript
// environment.ts
export const environment = {
  betaMode: false,
  // ...
};

// checkout.page.ts
betaMode = signal(environment.betaMode);
```

## Consideraciones Futuras

### Antes de habilitar tarjetas:
- [ ] Configurar Culqi en producción
- [ ] Probar flujo completo de pago
- [ ] Configurar webhooks de confirmación
- [ ] Implementar manejo de errores de pago
- [ ] Configurar reembolsos

### Antes de habilitar Yape:
- [ ] Integrar SDK de Yape/Culqi
- [ ] Probar flujo de notificación push
- [ ] Configurar timeout de confirmación
- [ ] Manejar pagos pendientes

## Métricas Beta

Trackear para entender demanda:
- Clics en métodos deshabilitados (medir interés)
- Tasa de abandono en checkout
- Feedback de usuarios sobre métodos de pago
