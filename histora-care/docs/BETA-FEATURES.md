# NurseLite - Caracteristicas Beta

## Estado Actual: Beta Abierto

Fecha de ultima actualizacion: Febrero 2026

## Funcionalidades Implementadas

### Autenticacion
- ✅ Registro de pacientes (email + contraseña)
- ✅ Registro de enfermeras (con validacion CEP)
- ✅ Login con email/contraseña
- ✅ Login con Google OAuth
- ✅ Recuperacion de contraseña con OTP (6 digitos)
- ✅ Remember me (sesiones extendidas)
- ✅ Refresh token automatico

### Verificacion de Enfermeras
- ✅ Validacion CEP (Colegio de Enfermeros del Peru)
- ✅ Verificacion de foto oficial CEP
- ✅ Validacion RENIEC (opcional)
- ✅ Estado de verificacion (pendiente, aprobado, rechazado)
- ✅ Panel admin para aprobar/rechazar

### Busqueda y Solicitud de Servicios
- ✅ Mapa con enfermeras cercanas (Mapbox)
- ✅ Filtros por servicio, precio, distancia
- ✅ Perfil detallado de enfermera
- ✅ Solicitud de servicio con fecha/hora
- ✅ Seleccion de direccion

### Tracking en Tiempo Real
- ✅ Mapa con ubicacion de la enfermera (Mapbox)
- ✅ Actualizacion de ubicacion en tiempo real (Socket.IO)
- ✅ Stepper de estados (aceptado → en camino → llego → en progreso → completado)
- ✅ ETA estimado con ruta en mapa
- ✅ Bottom sheet con info del servicio

### Chat
- ✅ Chat en tiempo real paciente-enfermera (Socket.IO)
- ✅ Quick replies predefinidos
- ✅ Indicador de mensajes no leidos
- ✅ Read receipts

### Pagos
- ✅ Pago en efectivo
- ✅ Pago via Yape (P2P directo a enfermera)
- ✅ Pago via Plin (P2P directo a enfermera)
- ⏳ Pago con tarjeta via Culqi (proximamente)

### Seguridad
- ✅ Codigos de seguridad bidireccionales (paciente ↔ enfermera)
- ✅ Verificacion de identidad de pacientes (DNI + selfie)
- ✅ Boton de panico con alerta a contactos
- ✅ Tracking GPS durante el servicio

### Reviews y Niveles
- ✅ Sistema de calificacion (1-5 estrellas)
- ✅ Comentarios de pacientes
- ✅ Sugerencias de comentario segun rating
- ✅ Promedio de calificacion en perfil
- ✅ Pagina de resenas para enfermera con distribucion de rating y filtros
- ✅ Modal celebratorio con confeti al recibir resena
- ✅ Notificacion en tiempo real de nuevas resenas (WebSocket)
- ✅ Sistema de niveles (Certificada, Destacada, Experimentada, Elite)
- ✅ Badge de nivel en avatar y dashboard

### Panel de Administracion
- ✅ Dashboard con KPIs
- ✅ Gestion de enfermeras y verificaciones
- ✅ Gestion de pacientes
- ✅ Dark mode

### Legal
- ✅ Terminos y condiciones
- ✅ Politica de privacidad
- ✅ Pagina de ayuda/FAQ

## Funcionalidades Pendientes

### Corto Plazo
- [ ] Notificaciones push nativas (Firebase/APNs)
- [ ] Pagos con tarjeta (Culqi)
- [ ] Facturas/Boletas electronicas
- [ ] Respuestas de enfermeras a resenas

### Mediano Plazo
- [ ] Programa de referidos
- [ ] Suscripciones para servicios recurrentes
- [ ] Modo offline con sincronizacion

### Largo Plazo
- [ ] Integracion con seguros de salud
- [ ] Expansion a otras ciudades
- [ ] Soporte multi-idioma

## Configuracion Beta

### Flags de Feature

```typescript
// checkout.page.ts
betaMode = signal(true);  // Tarjetas deshabilitadas, Yape/Plin/Efectivo habilitados
```

### Estado de Metodos de Pago

| Metodo de Pago | Estado | Tipo |
|----------------|--------|------|
| Efectivo | ✅ Habilitado | Directo |
| Yape | ✅ Habilitado | P2P a enfermera |
| Plin | ✅ Habilitado | P2P a enfermera |
| Tarjeta | ⏳ Proximamente | Via Culqi |

## Feedback y Soporte

### Canales
- Email: soporte@historahealth.com
- In-app: Pagina de ayuda
