# DOCUMENTOS LEGALES - HISTORA CARE
## Guía de Implementación

Este directorio contiene los documentos legales completos para la plataforma NurseLite, elaborados en cumplimiento con la legislación peruana aplicable.

---

## DOCUMENTOS DISPONIBLES

### 1. Términos y Condiciones (`TERMINOS-Y-CONDICIONES.md`)

Documento completo de 20 secciones que regula la relación contractual entre Histora, los Pacientes y los Profesionales de Enfermería.

**Aspectos clave:**
- Naturaleza de intermediación de la plataforma
- Proceso de verificación de profesionales (CEP + RENIEC + Biometría)
- Responsabilidades de cada parte
- Políticas de pago y comisiones (15%)
- Políticas de cancelación escalonadas
- Limitación de responsabilidad
- Jurisdicción peruana

**Cumplimiento regulatorio:**
- ✅ Ley 29414 - Derechos de usuarios de servicios de salud
- ✅ Ley 29571 - Código de Protección del Consumidor
- ✅ Ley 29733 - Protección de Datos Personales
- ✅ Normativa INDECOPI sobre publicidad y contratación electrónica

### 2. Política de Privacidad (`POLITICA-DE-PRIVACIDAD.md`)

Documento de 16 secciones que detalla el tratamiento de datos personales en la plataforma.

**Aspectos clave:**
- Tipos de datos recopilados (personales, sensibles/salud, biométricos)
- Finalidades del tratamiento
- Derechos ARCO (Acceso, Rectificación, Cancelación, Oposición)
- Medidas de seguridad técnicas y organizacionales
- Plazos de conservación
- Compartición con terceros (profesionales, procesadores de pago)
- Transferencia internacional de datos
- Cookies y tecnologías similares

**Cumplimiento regulatorio:**
- ✅ Ley 29733 - Ley de Protección de Datos Personales
- ✅ Decreto Supremo 003-2013-JUS - Reglamento
- ✅ Directivas de la Autoridad Nacional de Protección de Datos Personales
- ✅ Consentimiento expreso para datos sensibles (salud)

### 3. Centro de Ayuda (`CENTRO-DE-AYUDA.md`)

FAQs completas organizadas en 3 secciones principales con más de 60 preguntas respondidas.

**Contenido:**
- **Para Pacientes:** Registro, solicitud de servicios, pagos, cancelaciones, seguridad
- **Para Profesionales:** Verificación, aceptar servicios, cobros, calificaciones, mejores prácticas
- **General:** Contacto, quejas/reclamos, emergencias, cuenta/privacidad

---

## TAREAS ANTES DEL LANZAMIENTO

### COMPLETADO (18/02/2026)

1. **Datos de la empresa:** COMPLETADO
   - [x] Razon social: Code Media EIRL (RUC 20615496074)
   - [x] Domicilio fiscal: Cal. Tiahuanaco 145, Dpto 201, Urb. Portada del Sol Et. Dos, La Molina
   - [x] Telefono: +51 939 175 392 / Email: admin@nurselite.com
   - [x] Placeholders reemplazados en todos los documentos

2. **Libro de Reclamaciones:** COMPLETADO
   - [x] Libro de Reclamaciones digital en la app (modulo complaints)
   - [x] Formulario reclamo/queja con numero correlativo
   - [x] Lista de reclamos del usuario
   - [x] Backend con endpoints REST + admin
   - [ ] Configurar correo reclamos@nurselite.pe (pendiente)

3. **Paginas legales en la app:** COMPLETADO
   - [x] Terminos y Condiciones (13 secciones, incluye derechos paciente)
   - [x] Politica de Privacidad (datos reales, ARCO 10 dias)
   - [x] Centro de Ayuda (+30 FAQs)
   - [x] Accesibles sin login

### PENDIENTE

4. **Inscripcion RNPDP:**
   - [ ] Inscribir Banco de Datos "Usuarios NurseLite" en RNPDP
   - [ ] Actualizar numero de inscripcion en Politica de Privacidad
   - [ ] Mas informacion: www.minjus.gob.pe

5. **Correos especificos:**
   - [ ] Configurar privacidad@nurselite.pe
   - [ ] Configurar reclamos@nurselite.pe

### 🟡 IMPORTANTE - Completar en las primeras semanas

6. **Consentimientos:**
   - [ ] Implementar checkbox de aceptación en registro (Términos + Privacidad)
   - [ ] Implementar consentimiento expreso para datos sensibles (pantalla separada con énfasis)
   - [ ] Implementar gestión de cookies (banner al entrar a la web)
   - [ ] Almacenar registros de consentimientos con timestamp

7. **Ejercicio de derechos ARCO:**
   - [ ] Implementar "Exportar mis datos" en la app
   - [ ] Implementar "Eliminar cuenta" en la app
   - [ ] Crear formulario de solicitud de derechos ARCO por correo
   - [ ] Establecer proceso interno para responder en plazos legales

8. **Botón de pánico:**
   - [ ] Implementar botón de emergencia durante servicios activos
   - [ ] Configurar notificaciones al equipo de soporte 24/7
   - [ ] Establecer protocolo de respuesta a emergencias

9. **Notificaciones de cambios:**
   - [ ] Sistema para notificar cambios en Términos/Política por email y push
   - [ ] Requerir re-aceptación si hay cambios sustanciales

### 🟢 RECOMENDADO - Mejora continua

10. **Seguridad:**
    - [ ] Auditoría de seguridad de la plataforma
    - [ ] Implementar autenticación de dos factores (2FA)
    - [ ] Encriptación de datos sensibles en reposo
    - [ ] Logs de auditoría de accesos a datos

11. **Transparencia:**
    - [ ] Publicar resumen ejecutivo de la Política de Privacidad (1 página)
    - [ ] Crear videos tutoriales sobre ejercicio de derechos
    - [ ] Traducir documentos a inglés u otros idiomas (si aplica)

12. **Capacitación:**
    - [ ] Capacitar al equipo de soporte en estos documentos
    - [ ] Capacitar al equipo técnico en protección de datos
    - [ ] Establecer política interna de seguridad de la información

---

## IMPLEMENTACIÓN EN LA APP

### Pantallas requeridas

**1. Registro de Usuario:**
```
[ ] He leído y acepto los [Términos y Condiciones]
[ ] He leído y acepto la [Política de Privacidad]
[Botón: Crear Cuenta]
```

**2. Consentimiento para Datos Sensibles (Pacientes):**
```
IMPORTANTE: Tratamiento de Datos de Salud

Para que el profesional de enfermería pueda brindarte
atención segura y adecuada, necesitamos tu consentimiento
para recopilar y compartir información sobre tu salud.

Estos datos serán:
- Compartidos con el profesional asignado
- Almacenados en tu historial médico digital
- Protegidos conforme a la Ley 29733

Puedes revocar este consentimiento en cualquier momento,
pero no podremos brindarte servicios sin esta información.

[ ] Doy mi consentimiento expreso para el tratamiento
    de mis datos de salud

[Más información] [Continuar]
```

**3. Pantalla de Privacidad en Perfil:**
```
Mi Privacidad

- Ver Política de Privacidad
- Gestionar notificaciones
- Gestionar cookies
- Exportar mis datos
- Ejercer derechos ARCO
- Eliminar mi cuenta
```

**4. Footer de la App/Web:**
```
Términos y Condiciones | Política de Privacidad |
Centro de Ayuda | Libro de Reclamaciones
```

### Endpoints de API

```typescript
// Consentimientos (pendiente)
POST /api/users/consent
GET /api/users/consent/history
PUT /api/users/consent/revoke

// Ejercicio de derechos (pendiente)
POST /api/users/data-export
POST /api/users/data-rectification
DELETE /api/users/account

// Libro de Reclamaciones - IMPLEMENTADO 18/02/2026
POST /complaints          // Crear reclamo/queja (auth)
GET /complaints/mine      // Mis reclamos (auth)
GET /complaints           // Todos los reclamos (admin)
PATCH /complaints/:id/respond  // Responder reclamo (admin)
```

---

## MANTENIMIENTO Y ACTUALIZACIONES

### Cuándo actualizar estos documentos

**Obligatorio actualizar cuando:**
- Cambien las leyes o regulaciones aplicables
- Implementes nuevas funcionalidades que afecten la privacidad
- Cambies proveedores de servicios (procesadores de pago, hosting, etc.)
- Modifiques las políticas de cancelación o comisiones
- Cambies la naturaleza del servicio

**Proceso de actualización:**
1. Revisar y actualizar el documento correspondiente
2. Actualizar la fecha de "Última actualización"
3. Incrementar el número de versión
4. Notificar a usuarios por email y push
5. Si el cambio es sustancial, requerir re-aceptación

**Recomendación:** Revisar estos documentos cada 6 meses o cuando haya cambios regulatorios.

---

## CONSULTORÍA LEGAL

**IMPORTANTE:** Estos documentos fueron elaborados con base en las mejores practicas y el conocimiento de la legislacion peruana al 18 de febrero de 2026.

**Recomendamos encarecidamente:**
1. Revisión por un abogado especializado en:
   - Derecho de protección de datos personales
   - Derecho de protección al consumidor
   - Derecho de salud (regulación de servicios de salud)

2. Consultoría con:
   - Un estudio legal especializado en healthtech
   - Un oficial de protección de datos (Data Protection Officer)
   - Un experto en cumplimiento regulatorio (compliance)

3. Consideraciones adicionales:
   - Seguro de responsabilidad civil profesional para la empresa
   - Registro de marca "NurseLite"
   - Contratos específicos con profesionales y proveedores
   - Protocolos de respuesta a incidentes de seguridad

---

## CONTACTO PARA TEMAS LEGALES

**Contacto general:**
- Email: admin@nurselite.com
- WhatsApp: +51 939 175 392

**Proteccion de datos (pendiente configurar):**
- Correo: privacidad@nurselite.pe

**Autoridad competente:**
- Autoridad Nacional de Protección de Datos Personales
- Dirección General de Transparencia, Acceso a la Información Pública y Protección de Datos Personales - MINJUS
- Web: www.minjus.gob.pe
- Teléfono: (01) 224-7777

---

## RECURSOS EXTERNOS

### Legislación peruana aplicable

- **Ley 29733** - Ley de Protección de Datos Personales
  https://www.minjus.gob.pe/wp-content/uploads/2013/12/LEY-29733.pdf

- **DS 003-2013-JUS** - Reglamento de la Ley 29733
  https://www.minjus.gob.pe/wp-content/uploads/2014/03/DS-003-2013-JUS.pdf

- **Ley 29571** - Código de Protección y Defensa del Consumidor
  https://www.indecopi.gob.pe/documents/51771/196221/CodigoProteccionyDefensadelConsumidor.pdf

- **Ley 29414** - Derechos de Usuarios de Servicios de Salud
  http://www.minsa.gob.pe/portada/Especiales/2010/derechos/archivos/ley29414.pdf

### Instituciones relevantes

- **INDECOPI:** www.indecopi.gob.pe
- **MINSA:** www.minsa.gob.pe
- **DIGEMID:** www.digemid.minsa.gob.pe
- **Colegio de Enfermeros del Perú:** www.cep.org.pe
- **Superintendencia de Banca y Seguros (SBS):** www.sbs.gob.pe

---

## CHECKLIST FINAL ANTES DEL LANZAMIENTO

```
DOCUMENTACION LEGAL
[x] Todos los placeholders fueron reemplazados (18/02/2026)
[ ] Documentos revisados por abogado
[x] Paginas legales implementadas en la app (18/02/2026)
[x] Accesibles sin login

INSCRIPCIONES Y REGISTROS
[ ] Banco de Datos inscrito en RNPDP
[ ] Libro de Reclamaciones fisico impreso (si aplica)
[x] Libro de Reclamaciones digital funcional (18/02/2026)
[ ] Correos especificos configurados

IMPLEMENTACION TECNICA
[ ] Checkboxes de aceptacion en registro
[ ] Consentimiento expreso para datos sensibles
[ ] Banner de cookies funcional
[ ] Exportar datos implementado
[ ] Eliminar cuenta implementado
[ ] Boton de panico implementado
[ ] Sistema de notificacion de cambios
[ ] Logs de consentimientos con timestamp

PROCESOS INTERNOS
[ ] Protocolo de respuesta a solicitudes ARCO
[ ] Protocolo de respuesta a emergencias
[ ] Protocolo de notificacion de brechas de seguridad
[ ] Capacitacion del equipo completada

SEGURIDAD
[x] Encriptacion SSL/TLS activa
[x] Contrasenas hasheadas (bcrypt)
[ ] Datos sensibles encriptados en reposo
[ ] Auditoria de seguridad realizada
[ ] Plan de respuesta a incidentes documentado
```

---

**Ultima actualizacion:** 18 de febrero de 2026

2026 Code Media EIRL. Todos los derechos reservados.
