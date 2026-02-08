# Modo Beta de Pagos - Efectivo + Yape/Plin P2P

## Descripcion

Durante la fase beta de NurseLite, los pagos con tarjeta de credito/debito estan deshabilitados. Se aceptan tres metodos de pago directo:

1. **Efectivo** - Pago al finalizar el servicio
2. **Yape P2P** - Pago directo a la enfermera via Yape
3. **Plin P2P** - Pago directo a la enfermera via Plin

## Razon

1. **Reducir complejidad** en fase de validacion
2. **Evitar costos de procesamiento** antes de tener volumen
3. **Simplificar disputas/reembolsos** iniciales
4. **Multiples opciones** sin necesidad de integrar pasarela de pago

## Implementacion

### Frontend (checkout.page.ts)

```typescript
// Flag de control
betaMode = signal(true);  // Tarjetas deshabilitadas

// Metodos habilitados en beta:
// - 'cash': Efectivo
// - 'yape': Yape P2P (pago directo a enfermera)
// - 'plin': Plin P2P (pago directo a enfermera)
```

### Comportamiento en UI

Cuando `betaMode = true`:

| Metodo de Pago | Estado | Badge |
|----------------|--------|-------|
| Efectivo | ✅ Habilitado | "Disponible" (verde) |
| Yape | ✅ Habilitado | "Disponible" (verde) |
| Plin | ✅ Habilitado | "Disponible" (verde) |
| Tarjeta | ❌ Deshabilitado | "Proximamente" (gris) |

### Flujo P2P (Yape/Plin)

```
1. Paciente selecciona "Yape" o "Plin"
   ↓
2. Modal de confirmacion:
   "Realizara el pago via [Yape/Plin] directamente a la enfermera."
   ↓
3. Click "Confirmar"
   ↓
4. Servicio registrado con paymentMethod: 'yape' o 'plin'
   ↓
5. Pantalla de confirmacion con recordatorio:
   "Pagaras S/. XX.XX via [Yape/Plin] a la enfermera"
   ↓
6. Enfermera confirma recepcion del pago
```

### Flujo Efectivo

```
1. Paciente selecciona "Efectivo"
   ↓
2. Modal de confirmacion:
   "Pagara al finalizar el servicio."
   ↓
3. Click "Confirmar"
   ↓
4. Servicio registrado con paymentMethod: 'cash'
   ↓
5. Enfermera confirma pago al finalizar servicio
```

## Archivos Involucrados

- `histora-care/src/app/patient/checkout/checkout.page.ts` - Flag betaMode + logica P2P
- `histora-care/src/app/patient/checkout/checkout.page.html` - UI con 3 opciones activas
- `histora-care/src/app/patient/checkout/checkout.page.scss` - Estilos Yape/Plin icons
- `histora-care/src/app/core/models/payment.model.ts` - PaymentMethod type incluye 'plin'

## Habilitar Pagos con Tarjeta (Post-Beta)

Para habilitar tarjetas:

```typescript
// En checkout.page.ts
betaMode = signal(false);
```

### Requisitos previos:
- [ ] Configurar Culqi en produccion
- [ ] Probar flujo completo de pago con tarjeta
- [ ] Configurar webhooks de confirmacion
- [ ] Implementar manejo de errores de pago
- [ ] Configurar reembolsos
