# Flujos del Sistema - Histora Care

## Resumen General

Histora Care es una plataforma que conecta pacientes con enfermeras profesionales para servicios de salud a domicilio. Este documento detalla los flujos principales del sistema.

---

## 1. Flujo de Registro de Enfermera

### 1.1 Registro Inicial
```
[Enfermera] → Descarga la app → Selecciona "Soy Profesional de Salud"
           → Completa formulario de registro:
              - Datos personales (nombre, email, teléfono)
              - Contraseña
              - Número CEP (Colegio de Enfermeros del Perú)
           → Crea cuenta (estado: PENDIENTE_VERIFICACION)
```

### 1.2 Completar Perfil Profesional
```
[Enfermera] → Accede a "Mi Perfil" → Completa información:
           - Foto profesional
           - Especialidades (inyecciones, curaciones, etc.)
           - Años de experiencia
           - Biografía profesional
           - Documentos requeridos:
             * Título profesional
             * Constancia CEP vigente
             * DNI
             * Antecedentes policiales (opcional)
           - Servicios que ofrece con precios
           - Zona de cobertura (radio en km)
           → Envía para revisión
```

### 1.3 Verificación por Admin
```
[Admin] → Recibe notificación de nueva enfermera
        → Revisa documentos y perfil
        → Valida número CEP con el colegio (manual o API)
        → Aprueba o Rechaza:
           - APROBADA: Enfermera puede empezar a recibir solicitudes
           - RECHAZADA: Se notifica motivo, puede corregir y reenviar
```

### 1.4 Estados de la Enfermera
| Estado | Descripción |
|--------|-------------|
| `pending_verification` | Recién registrada, documentos en revisión |
| `active` | Verificada, puede recibir solicitudes |
| `inactive` | Perfil pausado voluntariamente |
| `suspended` | Suspendida por admin (violación de términos) |
| `rejected` | Documentos rechazados |

---

## 2. Flujo de Disponibilidad de Enfermera

### 2.1 Configurar Disponibilidad
```
[Enfermera] → "Mi Disponibilidad" → Configura:
           - Horario semanal (Lun-Dom, hora inicio/fin)
           - Días de descanso
           - Disponibilidad inmediata (toggle ON/OFF)
           - Ubicación actual (GPS)
```

### 2.2 Activar Modo "Disponible"
```
[Enfermera] → Toggle "Estoy Disponible" = ON
           → App actualiza ubicación GPS cada X minutos
           → Enfermera aparece en el mapa para pacientes cercanos
           → Badge verde "Disponible" se muestra
```

### 2.3 Desactivar Disponibilidad
```
[Enfermera] → Toggle "Estoy Disponible" = OFF
           → No aparece como disponible en el mapa
           → Sigue visible en búsquedas pero sin badge verde
           → Puede recibir solicitudes programadas (citas futuras)
```

---

## 3. Flujo de Solicitud de Servicio (Paciente)

### 3.1 Buscar Enfermera
```
[Paciente] → Abre la app → Ve mapa con enfermeras cercanas
          → Puede filtrar por:
             - Tipo de servicio (inyección, curación, etc.)
             - Radio de distancia (5km, 10km, 15km, 20km)
             - Disponibilidad inmediata
          → Selecciona una enfermera
          → Ve perfil completo: rating, reseñas, servicios, precios
```

### 3.2 Crear Solicitud
```
[Paciente] → "Solicitar Servicio"
          → Selecciona tipo de servicio de la lista de la enfermera
          → Elige modalidad:
             A) INMEDIATO: "Lo necesito ahora"
             B) PROGRAMADO: Selecciona fecha y hora
          → Ingresa dirección del servicio (GPS o manual)
          → Agrega notas adicionales (opcional):
             - Síntomas
             - Indicaciones médicas
             - Instrucciones de acceso
          → Ve resumen con precio estimado
          → Confirma solicitud
```

### 3.3 Estados de la Solicitud
| Estado | Descripción |
|--------|-------------|
| `pending` | Enviada, esperando respuesta de enfermera |
| `accepted` | Enfermera aceptó, servicio confirmado |
| `rejected` | Enfermera rechazó (puede dar motivo) |
| `in_progress` | Enfermera en camino o realizando servicio |
| `completed` | Servicio terminado |
| `cancelled` | Cancelado por paciente o enfermera |

---

## 4. Flujo de Recepción de Solicitud (Enfermera)

### 4.1 Notificación de Nueva Solicitud
```
[Sistema] → Detecta nueva solicitud para enfermera
         → Envía notificación push:
            "Nueva solicitud de [Paciente]"
            "Servicio: Inyección intramuscular"
            "Distancia: 2.3 km"
         → Muestra en la app con temporizador (5 min para responder)
```

### 4.2 Ver Detalles de Solicitud
```
[Enfermera] → Abre notificación → Ve:
           - Nombre del paciente
           - Tipo de servicio solicitado
           - Precio acordado
           - Ubicación aproximada (mapa)
           - Distancia desde ubicación actual
           - Notas del paciente
           - Fecha/hora (si es programado)
           - Rating del paciente (si tiene historial)
```

### 4.3 Responder Solicitud
```
[Enfermera] → Opciones:
           A) ACEPTAR:
              → Solicitud pasa a "accepted"
              → Paciente recibe notificación de confirmación
              → Se crea chat entre enfermera y paciente
              → Enfermera puede ver ubicación exacta

           B) RECHAZAR:
              → Selecciona motivo (opcional):
                 - No disponible en ese horario
                 - Fuera de mi zona
                 - No realizo ese servicio
                 - Otro
              → Paciente recibe notificación
              → Puede buscar otra enfermera

           C) NO RESPONDE (timeout 5 min):
              → Solicitud vuelve a "pending"
              → Se puede ofrecer a otras enfermeras cercanas
```

---

## 5. Flujo de Ejecución del Servicio

### 5.1 Antes del Servicio
```
[Enfermera] → "Iniciar Viaje" (para servicios inmediatos)
           → App muestra ruta al domicilio
           → Paciente puede ver ubicación en tiempo real
           → Chat disponible para coordinación
```

### 5.2 Llegada y Servicio
```
[Enfermera] → Llega al domicilio
           → "He llegado" (notifica al paciente)
           → Realiza el servicio
           → Puede agregar notas clínicas
           → Toma foto de evidencia (si aplica)
```

### 5.3 Finalizar Servicio
```
[Enfermera] → "Servicio Completado"
           → Confirma servicios realizados
           → Agrega notas finales
           → Solicitud pasa a "completed"
           → Se dispara flujo de pago
           → Paciente recibe solicitud de reseña
```

---

## 6. Flujo de Pagos

### 6.1 Modelo de Comisiones
```
Precio del servicio: S/ 50.00
Comisión plataforma: 15% = S/ 7.50
Ganancia enfermera: 85% = S/ 42.50
```

### 6.2 Opciones de Pago (Paciente)

#### Opción A: Pago en App (Recomendado)
```
[Paciente] → Al confirmar solicitud:
          → Selecciona método de pago:
             - Tarjeta guardada
             - Nueva tarjeta (Stripe/Culqi)
             - Yape/Plin (QR)
          → Monto se retiene (hold) al crear solicitud
          → Al completar servicio:
             - Se cobra el monto retenido
             - Comisión va a la plataforma
             - Resto se acumula en wallet de enfermera
```

#### Opción B: Pago en Efectivo
```
[Paciente] → Selecciona "Pago en efectivo"
          → Paga directamente a la enfermera al terminar
          → Enfermera confirma pago recibido
          → Sistema registra deuda de comisión:
             - Enfermera debe S/ 7.50 a la plataforma
          → Comisiones se liquidan semanalmente
```

### 6.3 Wallet de Enfermera
```
[Enfermera] → "Mis Ganancias" → Ve:
           - Balance disponible
           - Ganancias del día/semana/mes
           - Historial de transacciones
           - Comisiones pendientes (si pago efectivo)
           → "Retirar Fondos":
              - Mínimo: S/ 50.00
              - Transferencia a cuenta bancaria
              - Tiempo: 1-3 días hábiles
```

### 6.4 Liquidación Semanal (Pago Efectivo)
```
[Sistema] → Cada lunes calcula:
         - Total servicios en efectivo de la semana
         - Total comisiones adeudadas
         → Opciones de cobro:
            A) Descuento automático del wallet
            B) Cobro a tarjeta registrada
            C) Generación de recibo para pago manual
```

---

## 7. Flujo de Reseñas y Calificaciones

### 7.1 Solicitar Reseña (Post-Servicio)
```
[Sistema] → Servicio completado
         → Espera 1 hora
         → Envía notificación a paciente:
            "¿Cómo fue tu experiencia con [Enfermera]?"
         → Paciente puede calificar 1-5 estrellas
         → Puede dejar comentario (opcional)
```

### 7.2 Publicación de Reseña
```
[Paciente] → Envía reseña
          → Se muestra inmediatamente en perfil de enfermera
          → Promedio de rating se actualiza
          → Enfermera recibe notificación de nueva reseña
```

### 7.3 Respuesta de Enfermera
```
[Enfermera] → Puede responder a reseñas públicamente
           → Respuesta visible para todos los usuarios
```

---

## 8. Flujo de Cancelación

### 8.1 Cancelación por Paciente
```
[Paciente] → "Cancelar Solicitud"
          → Si es ANTES de aceptación: Sin penalidad
          → Si es DESPUÉS de aceptación:
             - Más de 2 horas antes: Sin penalidad
             - Menos de 2 horas: Cargo de S/ 10.00
             - Enfermera en camino: Cargo de S/ 20.00
          → Motivo de cancelación (obligatorio)
          → Reembolso procesado en 3-5 días
```

### 8.2 Cancelación por Enfermera
```
[Enfermera] → "No puedo asistir"
           → Motivo obligatorio
           → Penalidades:
              - Primera vez: Advertencia
              - Segunda vez: Suspensión 24h
              - Tercera vez: Revisión de cuenta
           → Paciente notificado
           → Se ofrecen enfermeras alternativas
```

---

## 9. Flujo de Emergencias/Soporte

### 9.1 Reportar Problema
```
[Usuario] → "Reportar Problema" durante servicio activo
         → Categorías:
            - Enfermera no llegó
            - Paciente no disponible
            - Problema de seguridad
            - Disputa de pago
            - Otro
         → Se notifica a soporte inmediatamente
         → Ticket creado con prioridad alta
```

### 9.2 Chat de Soporte
```
[Usuario] → "Ayuda" → Chat con soporte
         → Horario: 24/7 para emergencias
         → Tiempo respuesta: < 15 min servicios activos
```

---

## 10. Métricas y KPIs

### Para Enfermeras
- Servicios completados (día/semana/mes)
- Rating promedio
- Tasa de aceptación de solicitudes
- Tasa de cancelación
- Ganancias totales
- Tiempo promedio de respuesta

### Para la Plataforma
- Usuarios activos (pacientes/enfermeras)
- Solicitudes por día
- Tasa de conversión (solicitud → servicio completado)
- Ingresos por comisiones
- NPS (Net Promoter Score)

---

## 11. Notificaciones del Sistema

### Para Pacientes
| Evento | Notificación |
|--------|-------------|
| Solicitud aceptada | "¡Genial! [Enfermera] ha aceptado tu solicitud" |
| Enfermera en camino | "[Enfermera] está en camino. Llegada estimada: 15 min" |
| Enfermera llegó | "[Enfermera] ha llegado a tu ubicación" |
| Servicio completado | "Servicio completado. ¿Cómo fue tu experiencia?" |
| Solicitud cancelada | "Tu solicitud ha sido cancelada" |

### Para Enfermeras
| Evento | Notificación |
|--------|-------------|
| Nueva solicitud | "Nueva solicitud de [Paciente] - [Servicio] - [Distancia]" |
| Solicitud cancelada | "[Paciente] ha cancelado la solicitud" |
| Nueva reseña | "[Paciente] te ha dejado una reseña ⭐⭐⭐⭐⭐" |
| Pago recibido | "Has recibido S/ 42.50 por tu servicio" |
| Recordatorio | "Tienes una cita programada en 1 hora" |

---

## 12. Consideraciones de Seguridad

### Verificación de Identidad
- Enfermeras: Validación de CEP obligatoria
- Pacientes: Verificación de teléfono (SMS OTP)

### Durante el Servicio
- GPS compartido entre ambas partes
- Botón de emergencia disponible
- Historial de servicios auditado

### Datos Sensibles
- Información médica encriptada
- Cumplimiento con ley de protección de datos
- Acceso restringido a información personal

---

## Próximos Pasos de Implementación

1. [ ] Implementar registro de enfermera con documentos
2. [ ] Panel de admin para verificación
3. [ ] Sistema de disponibilidad con GPS
4. [ ] Flujo de solicitudes completo
5. [ ] Integración de pagos (Stripe/Culqi)
6. [ ] Sistema de wallet para enfermeras
7. [ ] Chat en tiempo real
8. [ ] Tracking de ubicación
9. [ ] Sistema de reseñas
10. [ ] Notificaciones push
