# Histora Care - Características Beta

## Estado Actual: Beta Cerrado

Fecha de última actualización: Enero 2026

## Funcionalidades Implementadas

### Autenticación
- ✅ Registro de pacientes (email + contraseña)
- ✅ Registro de enfermeras (con validación CEP)
- ✅ Login con email/contraseña
- ✅ Login con Google OAuth
- ✅ Recuperación de contraseña con OTP (6 dígitos)
- ✅ Remember me (sesiones extendidas)
- ✅ Refresh token automático

### Verificación de Enfermeras
- ✅ Validación CEP (Colegio de Enfermeros del Perú)
- ✅ Verificación de foto oficial CEP
- ✅ Validación RENIEC (opcional)
- ✅ Estado de verificación (pendiente, aprobado, rechazado)
- ✅ Panel admin para aprobar/rechazar

### Búsqueda y Solicitud de Servicios
- ✅ Mapa con enfermeras cercanas (Mapbox)
- ✅ Filtros por servicio, precio, distancia
- ✅ Perfil detallado de enfermera
- ✅ Solicitud de servicio con fecha/hora
- ✅ Selección de dirección

### Pagos
- ✅ Pago en efectivo
- ⏳ Pago con tarjeta (próximamente)
- ⏳ Pago con Yape (próximamente)

### Reviews
- ✅ Sistema de calificación (1-5 estrellas)
- ✅ Comentarios de pacientes
- ✅ Promedio de calificación en perfil

### Navegación Sin Cuenta
- ✅ Explorar enfermeras sin registrarse
- ✅ Ver servicios y precios
- ✅ Registro requerido solo para solicitar

### Legal
- ✅ Términos y condiciones
- ✅ Política de privacidad
- ✅ Página de ayuda/FAQ

## Funcionalidades Pendientes

### Corto Plazo (Próximas 2 semanas)
- [ ] Verificación de email durante registro (OTP)
- [ ] Notificaciones push
- [ ] Chat en tiempo real enfermera-paciente
- [ ] Tracking de enfermera en camino

### Mediano Plazo (Próximo mes)
- [ ] Pagos con tarjeta (Culqi)
- [ ] Pagos con Yape
- [ ] Historial de servicios detallado
- [ ] Facturas/Boletas electrónicas
- [ ] Programa de referidos

### Largo Plazo
- [ ] App nativa iOS/Android (actualmente PWA)
- [ ] Suscripciones para servicios recurrentes
- [ ] Integración con seguros de salud
- [ ] Expansión a otras ciudades

## Configuración Beta

### Flags de Feature

```typescript
// environment.ts
export const environment = {
  production: false,
  betaMode: true,           // Habilita restricciones beta
  paymentSimulationMode: true,  // Simula pagos
};
```

### Restricciones Activas

| Feature | Estado | Razón |
|---------|--------|-------|
| Pagos con tarjeta | Deshabilitado | Simplificar beta |
| Pagos con Yape | Deshabilitado | Simplificar beta |
| Notificaciones push | Parcial | En desarrollo |
| Chat | Deshabilitado | En desarrollo |

## Métricas de Beta

### KPIs Objetivo
- Registros: 100 usuarios (50 pacientes, 50 enfermeras)
- Verificaciones completadas: 30 enfermeras
- Servicios solicitados: 50
- Servicios completados: 30
- NPS: > 40

### Tracking Implementado
- Registros por tipo de usuario
- Verificaciones iniciadas vs completadas
- Servicios por estado
- Tiempo promedio de respuesta enfermera
- Calificaciones promedio

## Feedback y Soporte

### Canales
- Email: soporte@historahealth.com
- WhatsApp: +51 XXX XXX XXX
- In-app: Página de ayuda

### Bugs Conocidos
- Ninguno crítico actualmente

## Changelog Beta

### v0.1.0 (Enero 2026)
- Lanzamiento inicial beta cerrado
- Registro pacientes y enfermeras
- Verificación CEP
- Búsqueda por mapa
- Solicitud de servicios
- Pagos en efectivo
- Reviews básicos
