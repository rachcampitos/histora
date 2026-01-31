# Estrategia de Pagos - NurseLite

## Resumen Ejecutivo

Este documento define la estrategia completa de pagos para NurseLite, incluyendo el modelo de comisiones, estructura de precios, flujo de dinero, y análisis de rentabilidad.

---

## 1. Pasarela de Pagos: Culqi

### Por qué Culqi

- **Líder en Perú:** Ampliamente reconocido y confiable
- **Comisiones competitivas:** 3.44% + IGV (tarjetas nacionales)
- **Sin costos fijos:** Solo pagas por transacción
- **Métodos de pago completos:** Tarjetas, Yape, PagoEfectivo, billeteras móviles
- **API bien documentada:** SDKs para múltiples lenguajes
- **Soporte local:** En español, horario Perú

### Comisiones de Culqi

| Método de Pago | Comisión |
|----------------|----------|
| Tarjetas nacionales | 3.44% + IGV |
| Tarjetas internacionales | 3.99% + IGV |
| Yape | 3.44% + IGV |
| PagoEfectivo | Variable |
| Monto mínimo fijo | S/. 3.50 (para montos < S/. 87.72) |

### Tiempos de Abono

- Ventas antes de las 4 p.m.: Mismo día hábil
- Ventas después de las 4 p.m.: Siguiente día hábil
- Con cuenta BCP: Incluye fines de semana y feriados

### Métodos de Pago a Implementar

**Fase 1 (MVP):**
- Tarjetas de débito/crédito (Visa, Mastercard)
- Yape (el más popular en Perú)

**Fase 2:**
- PagoEfectivo (para usuarios sin bancarización)
- Cuotéalo (pagos en cuotas)

---

## 2. Modelo de Comisiones

### Estructura Recomendada

**La comisión se cobra ÚNICAMENTE a la enfermera** (estándar en marketplaces de servicios).

| Fase | Periodo | Comisión | Objetivo |
|------|---------|----------|----------|
| Founders | Mes 1-3 | 0% | Atraer primeras 25 enfermeras |
| Growth | Mes 4-6 | 10% | Validar modelo |
| Scale | Mes 7-12 | 15% | Sostenibilidad |
| Estable | Año 2+ | 18-20% | Rentabilidad |

### Ejemplo de Transacción (Fase Scale - 15%)

```
Enfermera define tarifa: S/. 80/hora
Servicio de 4 horas:    S/. 320

Paciente paga:          S/. 320
  ├─ Culqi (3.99%):     -S/. 12.77
  ├─ Comisión app (15%): -S/. 48.00
  └─ Enfermera recibe:   S/. 259.23

Margen neto app:        S/. 35.23 por servicio
```

### Justificación de la Comisión

**Valor que recibe la enfermera:**
1. Flujo constante de pacientes (no buscar clientes)
2. Pago garantizado y seguro (no perseguir dinero)
3. Verificación CEP automática (credibilidad)
4. Perfil profesional visible en Google
5. Sistema de reseñas (reputación)
6. Soporte legal y términos claros
7. Marketing incluido (la app promociona)

---

## 3. Estructura de Precios

### Servicios por Hora

| Tipo de Servicio | Tarifa Base | Senior (+20%) | Especialista (+40%) |
|------------------|-------------|---------------|---------------------|
| Cuidado básico/acompañamiento | S/. 50-60/h | S/. 60-72/h | S/. 70-84/h |
| Cuidado especializado (post-op, heridas) | S/. 70-80/h | S/. 84-96/h | S/. 98-112/h |
| Cuidado intensivo (paciente crítico) | S/. 90-100/h | S/. 108-120/h | S/. 126-140/h |
| Pediátrico/neonatal | S/. 80-90/h | S/. 96-108/h | S/. 112-126/h |

### Servicios por Turno

| Duración | Tarifa |
|----------|--------|
| Turno 8h (día) | S/. 400-450 |
| Turno 12h (día/noche) | S/. 550-600 |
| Turno 24h | S/. 900-1,000 |
| Turnos recurrentes | -10% descuento |

### Servicios Específicos

| Servicio | Tarifa |
|----------|--------|
| Aplicación de inyección | S/. 40-50 |
| Curaciones | S/. 60-80 |
| Toma de signos + reporte | S/. 50-60 |
| Instalación/retiro de sonda | S/. 100-120 |
| Acompañamiento hospitalario (12h) | S/. 500 |

### Diferenciación por Experiencia

| Nivel | Requisitos | Modificador |
|-------|------------|-------------|
| Junior | 1-3 años con CEP | Tarifa base |
| Senior | 3-8 años con CEP | +20% |
| Especialista | 8+ años + especialización | +40% |

---

## 4. Flujo de Dinero

### Modelo de Pago

**Servicios cortos (< 4 horas):**
- **Pago:** 100% adelantado al confirmar reserva
- **Razón:** Bajo monto, evita no-shows

**Servicios largos (≥ 4 horas o recurrentes):**
- **Pago:** 50% adelantado, 50% al completar
- **Razón:** Flexibilidad para montos altos

### Política de Cancelaciones

| Escenario | Tiempo | Reembolso |
|-----------|--------|-----------|
| Paciente cancela | >24h antes | 100% |
| Paciente cancela | 2-24h antes | 50% |
| Paciente cancela | <2h antes | 0% (enfermera recibe 50%) |
| Enfermera cancela | Cualquier tiempo | 100% + crédito S/. 20 al paciente |
| Enfermera no llega | - | 100% + crédito S/. 50 al paciente |

### Pago a la Enfermera

| Nivel de Enfermera | Tiempo de Pago |
|-------------------|----------------|
| Nueva (primeros 5 servicios) | T+5 días hábiles |
| Regular | T+2 días hábiles |
| Veterana (50+ servicios sin issues) | T+1 día hábil |

### Flujo Completo de Transacción

```
1. Paciente solicita servicio
   └─ Sistema muestra precio total (incluye todo)

2. Paciente confirma y paga
   └─ Culqi procesa pago
   └─ Dinero queda en cuenta NurseLite

3. Enfermera acepta solicitud
   └─ Notificación a ambas partes

4. Servicio se realiza
   └─ Ambos marcan "completado" en app

5. Periodo de disputa (24h)
   └─ Paciente puede reportar problema

6. Liberación de pago
   └─ Se descuenta comisión
   └─ Se transfiere a cuenta de enfermera

7. Cierre
   └─ Solicitud de reseña a ambas partes
```

---

## 5. Análisis de Rentabilidad

### Costos Operativos Mensuales (Estimado)

| Concepto | Costo |
|----------|-------|
| Hosting (Railway + Cloudflare) | S/. 150 |
| MongoDB Atlas | S/. 100 |
| Cloudinary | S/. 50 |
| SMS/Notificaciones | S/. 200 |
| Marketing digital | S/. 2,000 |
| Operaciones/soporte (part-time) | S/. 2,500 |
| **Total fijos** | **S/. 5,000** |

### Cálculo de Margen por Servicio

```
Ticket promedio:        S/. 390
Comisión app (15%):     S/. 58.50
Comisión Culqi (3.99%): -S/. 15.87
Margen neto:            S/. 42.63
```

### Punto de Equilibrio

```
Costos fijos mensuales: S/. 5,000
Margen por servicio:    S/. 42.63

Punto de equilibrio = 5,000 / 42.63 = 118 servicios/mes

Con margen de seguridad (30%): 154 servicios/mes
```

### Proyección de Crecimiento

| Periodo | Enfermeras | Servicios/mes | Ingresos | Resultado |
|---------|------------|---------------|----------|-----------|
| Mes 1-2 | 10 | 25 | S/. 1,066 | -S/. 3,934 |
| Mes 3-4 | 50 | 100 | S/. 4,263 | -S/. 737 |
| Mes 5-6 | 100 | 180 | S/. 7,673 | **+S/. 2,673** |
| Mes 7-12 | 200 | 400 | S/. 17,052 | +S/. 12,052 |
| Año 2 | 500 | 1,000 | S/. 42,630 | +S/. 37,630 |

---

## 6. Incentivos de Lanzamiento

### Para Enfermeras

**Fase Founders (Primeras 25):**
- 0% comisión por 3 meses
- Badge permanente "Founding Member"
- Prioridad en solicitudes
- Bono S/. 200 por completar 5 servicios

**Fase Growth (26-100):**
- 5% comisión por 2 meses (luego 15%)
- Bono S/. 100 por primer servicio
- Referral: S/. 150 por enfermera invitada

**Programa de Referidos (permanente):**
- Enfermera invita enfermera: S/. 100 para cada una
- Enfermera invita paciente: S/. 20 crédito

### Para Pacientes

**Primer servicio:**
- 10% descuento (código BIENVENIDO)
- Sin costo de servicio por 3 meses

**Programa de fidelidad:**
- 5% crédito por cada servicio completado
- Descuento 10% en servicios recurrentes

---

## 7. Implementación Técnica

### Integraciones Culqi Necesarias

1. **CulqiJS v4** - Tokenización de tarjetas en frontend
2. **API Cargos** - Procesamiento de pagos
3. **API Órdenes** - Para Yape y PagoEfectivo
4. **Webhooks** - Notificaciones de estado de pago
5. **API Reembolsos** - Gestión de cancelaciones

### Endpoints Backend Necesarios

```
POST   /payments/create-charge     # Crear cargo (tarjeta)
POST   /payments/create-order      # Crear orden (Yape/PagoEfectivo)
POST   /payments/webhook           # Recibir notificaciones Culqi
POST   /payments/refund            # Procesar reembolso
GET    /payments/history           # Historial de pagos
POST   /payments/release           # Liberar pago a enfermera
GET    /nurses/:id/earnings        # Ganancias de enfermera
POST   /nurses/:id/withdraw        # Solicitar retiro
```

### Modelos de Datos

```typescript
// Payment
interface Payment {
  _id: string;
  serviceRequestId: string;
  patientId: string;
  nurseId: string;
  amount: number;           // Monto total
  commission: number;       // Comisión app
  culqiFee: number;         // Fee de Culqi
  nurseEarnings: number;    // Lo que recibe enfermera
  status: 'pending' | 'completed' | 'refunded' | 'disputed';
  culqiChargeId: string;
  culqiOrderId?: string;
  paymentMethod: 'card' | 'yape' | 'pagoefectivo';
  paidAt?: Date;
  releasedAt?: Date;        // Cuando se liberó a enfermera
  createdAt: Date;
}

// NurseEarnings
interface NurseEarnings {
  nurseId: string;
  totalEarnings: number;
  pendingBalance: number;   // Pendiente de liberar
  availableBalance: number; // Disponible para retiro
  withdrawnTotal: number;   // Total retirado histórico
}
```

### Variables de Entorno Requeridas

```env
# Culqi
CULQI_PUBLIC_KEY=pk_live_xxx
CULQI_SECRET_KEY=sk_live_xxx
CULQI_WEBHOOK_SECRET=whk_xxx

# Comisiones
APP_COMMISSION_RATE=0.15
CULQI_FEE_RATE=0.0399
MIN_CULQI_FEE=3.50
```

---

## 8. Consideraciones Legales

### Términos y Condiciones

Debe incluir:
- Modelo de comisiones claramente explicado
- Política de cancelaciones y reembolsos
- Tiempos de pago a enfermeras
- Proceso de disputas
- Responsabilidades de cada parte

### Cumplimiento

- **INDECOPI:** Transparencia en precios y comisiones
- **SBS:** Si manejas dinero de terceros (evaluar si aplica)
- **Ley de Protección de Datos:** Consentimiento para datos financieros

### Contratos Digitales

- Contrato de servicios enfermera-plataforma
- Términos de uso para pacientes
- Política de privacidad actualizada

---

## 9. Métricas a Monitorear

### KPIs Financieros

| Métrica | Meta Mes 6 | Meta Año 1 |
|---------|------------|------------|
| GMV (Volumen bruto) | S/. 70,000 | S/. 200,000 |
| Take rate | 15% | 18% |
| Ingresos netos | S/. 8,000 | S/. 30,000 |
| CAC enfermera | < S/. 50 | < S/. 30 |
| LTV enfermera | > S/. 500 | > S/. 1,000 |

### KPIs Operativos

| Métrica | Meta |
|---------|------|
| Tasa de conversión (visita → servicio) | > 5% |
| Tasa de completado de servicios | > 95% |
| Tasa de disputas | < 2% |
| NPS pacientes | > 8/10 |
| NPS enfermeras | > 7/10 |

---

## 10. Roadmap de Implementación

### Fase 1: MVP Pagos (2-3 semanas) ✅ COMPLETADO
- [x] Integración Culqi básica (tarjetas) - Con modo simulación
- [x] Modelo de pagos en backend (`service-payments` module)
- [x] UI de pago en frontend (checkout page)
- [x] Historial de pagos básico
- [x] Soporte para Yape y efectivo

### Fase 2: Comisiones y Ganancias (1-2 semanas)
- [ ] Sistema de comisiones configurable
- [ ] Panel de ganancias para enfermeras
- [ ] Sistema de liberación de pagos

### Fase 3: Activación Culqi Real
- [ ] Registrar empresa (RUC SAC/EIRL)
- [ ] Completar registro en Culqi
- [ ] Configurar llaves de producción
- [ ] Desactivar modo simulación

### Fase 4: Avanzado (2 semanas)
- [ ] Sistema de disputas
- [ ] Reembolsos automáticos
- [ ] Retiros de enfermeras
- [ ] Webhooks y notificaciones

---

## 11. Modo Simulación

Para desarrollo y pruebas sin cuenta Culqi activa, el sistema incluye un **modo simulación**.

### Activar/Desactivar

```typescript
// En environment.ts y environment.prod.ts
paymentSimulationMode: true  // Simulación activada
paymentSimulationMode: false // Culqi real
```

### Comportamiento en Modo Simulación

1. **No carga CulqiJS** - Mejora tiempo de carga
2. **Acepta cualquier tarjeta** - Ej: 4111 1111 1111 1111
3. **Simula procesamiento** - Delay de 1.5 segundos
4. **Retorna éxito** - Todos los pagos "funcionan"
5. **Banner visible** - Indica "Modo de prueba"

### Para Activar Pagos Reales

1. Registrar empresa en Perú (RUC)
2. Crear cuenta en [culqi.com](https://culqi.com)
3. Obtener llaves de producción
4. Actualizar environments:
   ```typescript
   culqiPublicKey: 'pk_live_xxx'
   paymentSimulationMode: false
   ```
5. Agregar en Railway:
   ```
   CULQI_PUBLIC_KEY=pk_live_xxx
   CULQI_SECRET_KEY=sk_live_xxx
   ```

---

## Referencias

- [Culqi - Precios](https://culqi.com/precios/)
- [Culqi - Documentación API](https://docs.culqi.com/es/documentacion/pagos-online/)
- [Culqi - CulqiJS v4](https://docs.culqi.com/es/documentacion/culqi-js/v4/culqi-js/)
- [BBVA Perú - Comisiones POS 2025](https://www.bbva.pe/blog/mi-empresa/comisiones-pos-peru.html)
- [Ecommerce News - Pasarelas de pago Perú 2025](https://www.ecommercenews.pe/pagos-online/2025/pasarela-de-pagos-en-peru.html/)

---

*Documento creado: Enero 2026*
*Última actualización: Enero 2026*
