# ÍNDICE DE DOCUMENTOS LEGALES
## NurseLite - Plataforma de Enfermería a Domicilio

---

## DOCUMENTOS PRINCIPALES

### 📜 [TÉRMINOS Y CONDICIONES](./TERMINOS-Y-CONDICIONES.md)
**Tamaño:** 28 KB | **Líneas:** 668 | **Versión:** 1.0

Documento contractual completo que regula la relación entre Histora, Pacientes y Profesionales de Enfermería.

**Contenido principal:**
- Naturaleza del servicio (intermediación)
- Proceso de verificación triple (CEP + RENIEC + Biometría)
- Responsabilidades de cada parte
- Políticas de pago y comisiones (15%)
- Políticas de cancelación escalonadas
- Limitación de responsabilidad
- Jurisdicción y ley aplicable (Perú)

**Cumplimiento:** Ley 29414, Ley 29571, INDECOPI

---

### 🔒 [POLÍTICA DE PRIVACIDAD](./POLITICA-DE-PRIVACIDAD.md)
**Tamaño:** 26 KB | **Líneas:** 661 | **Versión:** 1.0

Documento que detalla el tratamiento de datos personales en cumplimiento con la legislación peruana.

**Contenido principal:**
- Tipos de datos recopilados (personales, sensibles/salud, biométricos)
- Finalidades del tratamiento
- Derechos ARCO (Acceso, Rectificación, Cancelación, Oposición)
- Medidas de seguridad técnicas
- Plazos de conservación
- Compartición y transferencia de datos
- Cookies y tecnologías

**Cumplimiento:** Ley 29733, DS 003-2013-JUS

---

### ❓ [CENTRO DE AYUDA](./CENTRO-DE-AYUDA.md)
**Tamaño:** 35 KB | **Líneas:** 1,066 | **Versión:** 1.0

FAQs completas organizadas por tipo de usuario con más de 60 preguntas respondidas.

**Contenido principal:**

**Para Pacientes:**
- Registro y primeros pasos
- Solicitar servicios
- Pagos y métodos
- Cancelaciones y cambios
- Seguridad y confianza

**Para Profesionales:**
- Registro y verificación CEP
- Aceptar servicios
- Cobros y pagos (comisión 15%)
- Calificaciones y reseñas
- Mejores prácticas

**General:**
- Contacto y soporte
- Quejas y reclamos (Libro de Reclamaciones)
- Emergencias (NO es servicio de emergencia)
- Cuenta y privacidad

---

## DOCUMENTOS DE IMPLEMENTACIÓN

### 💻 [EJEMPLOS DE IMPLEMENTACIÓN](./EJEMPLOS-IMPLEMENTACION.md)
**Tamaño:** 35 KB | **Líneas:** 1,420

Guía técnica completa con código y ejemplos para implementar los requerimientos legales en la app.

**Contenido:**
1. Pantalla de registro con aceptación de T&C
2. Modal de documentos legales
3. Consentimiento para datos sensibles (salud)
4. Servicio de gestión legal (Angular)
5. Pantalla de configuración de privacidad
6. Endpoints de API (NestJS)
7. Modelos de datos (MongoDB)
8. Sistema de notificación de cambios

**Tecnologías:** Ionic/Angular, NestJS, MongoDB

---

### 📧 [PLANTILLAS DE EMAIL](./PLANTILLAS-EMAIL.md)
**Tamaño:** 30 KB | **Líneas:** 837

Plantillas HTML completas para todas las notificaciones legales requeridas.

**Plantillas incluidas:**
1. Confirmación de registro
2. Actualización de Términos y Condiciones
3. Exportación de datos lista (ARCO)
4. Confirmación de eliminación de cuenta
5. Notificación de brecha de seguridad
6. Recordatorio de renovación de consentimiento
7. Respuesta a solicitud de derechos ARCO
8. Confirmación de recepción de reclamo

**Formato:** HTML con Handlebars, responsive, branding NurseLite

---

### 📋 [README - GUÍA DE IMPLEMENTACIÓN](./README.md)
**Tamaño:** 11 KB | **Líneas:** 336

Documento maestro con la guía completa de implementación y checklist de cumplimiento.

**Contenido:**
- Resumen de cada documento legal
- Aspectos clave de cumplimiento regulatorio
- Tareas pendientes antes del lanzamiento (CRÍTICAS, IMPORTANTES, RECOMENDADAS)
- Checklist de implementación en la app
- Endpoints de API necesarios
- Proceso de mantenimiento y actualizaciones
- Recomendaciones de consultoría legal
- Recursos externos y legislación aplicable
- Checklist final antes del lanzamiento

---

## ESTRUCTURA DE ARCHIVOS

```
histora-care/docs/legal/
├── INDEX.md                          # Este archivo (índice visual)
├── README.md                         # Guía de implementación
├── TERMINOS-Y-CONDICIONES.md         # T&C completos (668 líneas)
├── POLITICA-DE-PRIVACIDAD.md         # Política completa (661 líneas)
├── CENTRO-DE-AYUDA.md                # FAQs (1,066 líneas)
├── EJEMPLOS-IMPLEMENTACION.md        # Código y ejemplos (1,420 líneas)
└── PLANTILLAS-EMAIL.md               # Templates de emails (837 líneas)

Total: 4,988 líneas | 165 KB
```

---

## LEGISLACIÓN PERUANA APLICABLE

### Protección de Datos Personales
- ✅ **Ley 29733** - Ley de Protección de Datos Personales
- ✅ **DS 003-2013-JUS** - Reglamento de la Ley 29733

### Protección al Consumidor
- ✅ **Ley 29571** - Código de Protección y Defensa del Consumidor
- ✅ Normativa **INDECOPI** sobre publicidad y contratación electrónica

### Sector Salud
- ✅ **Ley 29414** - Derechos de Usuarios de Servicios de Salud
- ✅ Normativa **MINSA** sobre servicios de salud
- ✅ Regulación **CEP** (Colegio de Enfermeros del Perú)

---

## AUTORIDADES COMPETENTES

### Protección de Datos
**Autoridad Nacional de Protección de Datos Personales**
- Entidad: MINJUS - Dirección General de Transparencia
- Dirección: Calle 17 N° 355, Urb. El Palomar - San Isidro, Lima
- Teléfono: (01) 224-7777
- Web: www.minjus.gob.pe

### Protección al Consumidor
**INDECOPI**
- Instituto Nacional de Defensa de la Competencia y de la Protección de la Propiedad Intelectual
- Teléfono: 224-7777 (Lima) / 0-800-4-4040 (Provincias)
- Web: www.indecopi.gob.pe

### Sector Salud
**MINSA / DIGEMID**
- Ministerio de Salud
- Web: www.minsa.gob.pe
- DIGEMID: www.digemid.minsa.gob.pe

**Colegio de Enfermeros del Perú**
- Web: www.cep.org.pe
- Verificación: www.cep.org.pe (validar/pagina/view.php)

---

## TAREAS CRÍTICAS ANTES DEL LANZAMIENTO

### 🔴 URGENTE - Completar AHORA

1. **Datos de la empresa**
   - [ ] Completar razón social en todos los documentos
   - [ ] Completar RUC en todos los documentos
   - [ ] Completar domicilio fiscal completo
   - [ ] Completar teléfonos de contacto
   - [ ] Buscar `[Completar con...]` y reemplazar

2. **Inscripción RNPDP**
   - [ ] Inscribir Banco de Datos "Usuarios NurseLite"
   - [ ] Actualizar número de inscripción en Política de Privacidad
   - [ ] Conservar certificado de inscripción

3. **Libro de Reclamaciones**
   - [ ] Implementar Libro Digital en la app
   - [ ] Crear formulario web en care.nurselite.pe/reclamos
   - [ ] Imprimir Libro físico (si hay oficina física)
   - [ ] Configurar correo reclamos@nurselite.pe

4. **Correos específicos**
   - [ ] privacidad@nurselite.pe
   - [ ] reclamos@nurselite.pe
   - [ ] legal@nurselite.pe
   - [ ] seguridad@nurselite.pe

5. **Publicación de documentos**
   - [ ] Subir documentos a care.nurselite.pe/terminos
   - [ ] Subir a care.nurselite.pe/privacidad
   - [ ] Subir a care.nurselite.pe/ayuda
   - [ ] Accesibles SIN login

### 🟡 IMPORTANTE - Primera semana

6. **Implementación técnica**
   - [ ] Checkboxes de aceptación en registro
   - [ ] Consentimiento expreso para datos de salud
   - [ ] Banner de cookies
   - [ ] Exportar datos (derecho ARCO)
   - [ ] Eliminar cuenta
   - [ ] Botón de pánico en servicios activos

7. **Procesos internos**
   - [ ] Protocolo de respuesta a solicitudes ARCO (10 días)
   - [ ] Protocolo de respuesta a reclamos (30 días)
   - [ ] Protocolo de notificación de brechas de seguridad (72 horas)
   - [ ] Capacitación del equipo

### 🟢 RECOMENDADO - Primer mes

8. **Consultoría legal**
   - [ ] Revisión por abogado especializado en datos personales
   - [ ] Revisión por abogado de protección al consumidor
   - [ ] Consulta con experto en regulación de salud
   - [ ] Contratar Data Protection Officer (DPO) o consultor

9. **Seguros y registros**
   - [ ] Seguro de responsabilidad civil para la empresa
   - [ ] Registro de marca "NurseLite" en INDECOPI
   - [ ] Contratos específicos con proveedores (cláusulas DPA)

---

## CALENDARIO DE REVISIÓN

### Revisión Obligatoria
- ✅ **Cada 6 meses:** Revisar todos los documentos legales
- ✅ **Cuando haya cambios en la ley:** Actualizar inmediatamente
- ✅ **Antes de nuevas funcionalidades:** Evaluar impacto en privacidad
- ✅ **Después de incidentes de seguridad:** Revisar políticas

### Actualización de Versiones
Cuando actualices documentos:
1. Incrementar número de versión
2. Actualizar fecha de "Última actualización"
3. Notificar a usuarios (email + push)
4. Si es cambio sustancial, requerir re-aceptación
5. Conservar versiones anteriores para auditoría

---

## CONTACTO PARA TEMAS LEGALES

### Internos
- **Oficial de Protección de Datos:** privacidad@nurselite.pe
- **Asuntos Legales Generales:** legal@nurselite.pe
- **Seguridad:** seguridad@nurselite.pe
- **Reclamos:** reclamos@nurselite.pe

### Externos (Proveedores recomendados)
- **Estudio Legal:** [A contratar - especializado en healthtech]
- **DPO externo:** [A contratar - certificado en Ley 29733]
- **Auditoría de Seguridad:** [A contratar - ISO 27001]

---

## RECURSOS ADICIONALES

### Documentación oficial
- [Guía de la Ley 29733 - MINJUS](https://www.minjus.gob.pe)
- [Directivas APDP](https://www.minjus.gob.pe/proteccion-de-datos-personales/)
- [Código de Consumo - INDECOPI](https://www.indecopi.gob.pe)

### Herramientas
- [Generador de Política de Cookies](https://www.cookiebot.com)
- [Verificador de cumplimiento GDPR](https://gdpr.eu) (referencia internacional)
- [Plantilla de DPA (Data Processing Agreement)](https://ico.org.uk)

### Comunidad
- LinkedIn: Grupo "Privacidad y Protección de Datos - Perú"
- Eventos: IAPP (International Association of Privacy Professionals)

---

## MÉTRICAS DE CUMPLIMIENTO

### KPIs a monitorear
- ✅ **Tasa de aceptación de T&C:** Target 100%
- ✅ **Respuesta a solicitudes ARCO:** <10 días (legal: 10 días)
- ✅ **Respuesta a reclamos:** <15 días (legal: 30 días)
- ✅ **Tiempo de notificación de brechas:** <72 horas
- ✅ **Tasa de quejas de privacidad:** <0.1%
- ✅ **Auditorías de seguridad:** 2 al año mínimo

### Dashboard recomendado
```
CUMPLIMIENTO LEGAL - HISTORA CARE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Inscripción RNPDP:           [✅] Completa
Libro de Reclamaciones:      [✅] Digital + Físico
Documentos publicados:       [✅] T&C, PP, Ayuda

Solicitudes ARCO (últimos 30 días)
  - Acceso:                  12 → 10 días promedio ✅
  - Rectificación:           5 → 3 días promedio ✅
  - Cancelación:             2 → 5 días promedio ✅
  - Oposición:               1 → 2 días promedio ✅

Reclamos (últimos 30 días)
  - Recibidos:               8
  - Resueltos:               7
  - Pendientes:              1
  - Promedio de resolución:  12 días ✅

Brechas de seguridad:        0 ✅
Última auditoría:            2025-12-15 ✅
Próxima auditoría:           2026-06-15

Consentimientos activos:     2,450 / 2,500 (98%) ✅
Próximos a expirar (30d):   45
```

---

## VERSIÓN Y MANTENIMIENTO

**Versión de documentación:** 1.0
**Fecha de creación:** 19 de enero de 2026
**Última actualización:** 19 de enero de 2026
**Próxima revisión:** 19 de julio de 2026

**Responsable:** Equipo Legal y Compliance NurseLite
**Contacto:** legal@nurselite.pe

---

## NOTAS FINALES

### ⚠️ DISCLAIMERS IMPORTANTES

1. **Consulta legal obligatoria:** Estos documentos fueron elaborados con base en las mejores prácticas y conocimiento de la legislación peruana. **Es OBLIGATORIO que sean revisados por un abogado especializado** antes del lanzamiento.

2. **No sustituye asesoría legal profesional:** Esta documentación es un punto de partida. Cada negocio tiene particularidades que deben ser evaluadas por un profesional.

3. **Legislación actualizada:** Verifica que la legislación referenciada siga vigente. Las leyes pueden cambiar.

4. **Adaptación continua:** La protección de datos es un proceso continuo, no un evento único. Requiere monitoreo y actualización constante.

5. **Cultura de privacidad:** Más allá del cumplimiento legal, fomenta una cultura de respeto a la privacidad en toda la organización.

---

**¿Tienes dudas sobre estos documentos?**

Contacta a:
- **Email:** legal@nurselite.pe
- **Para implementación técnica:** dev@nurselite.pe
- **Para consultas de privacidad:** privacidad@nurselite.pe

---

© 2026 Histora Health. Todos los derechos reservados.

**Hecho con ❤️ en Lima, Perú**
