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

## TAREAS PENDIENTES ANTES DEL LANZAMIENTO

### 🔴 CRÍTICO - Completar antes del lanzamiento

1. **Datos de la empresa:**
   - [ ] Completar razón social
   - [ ] Completar RUC
   - [ ] Completar domicilio fiscal completo
   - [ ] Completar teléfono de contacto
   - [ ] Buscar y reemplazar `[Completar con...]` en todos los documentos

2. **Inscripción RNPDP:**
   - [ ] Inscribir el Banco de Datos "Usuarios NurseLite" en el Registro Nacional de Protección de Datos Personales
   - [ ] Actualizar el número de inscripción en `POLITICA-DE-PRIVACIDAD.md`
   - [ ] Más información: www.minjus.gob.pe

3. **Libro de Reclamaciones:**
   - [ ] Habilitar Libro de Reclamaciones digital en la app
   - [ ] Crear formulario web en care.nurselite.pe/reclamos
   - [ ] Imprimir Libro de Reclamaciones físico para oficinas (si las hay)
   - [ ] Configurar correo reclamos@nurselite.pe

4. **Correos específicos:**
   - [ ] Configurar privacidad@nurselite.pe
   - [ ] Configurar reclamos@nurselite.pe
   - [ ] Configurar hola@nurselite.pe (ya existe)

5. **Versiones en la app:**
   - [ ] Subir versiones HTML de los documentos legales
   - [ ] Crear páginas en care.nurselite.pe/terminos, /privacidad, /ayuda
   - [ ] Asegurar que sean accesibles sin login

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

### Endpoints de API necesarios

```typescript
// Consentimientos
POST /api/users/consent
GET /api/users/consent/history
PUT /api/users/consent/revoke

// Ejercicio de derechos
POST /api/users/data-export
POST /api/users/data-rectification
DELETE /api/users/account

// Libro de Reclamaciones
POST /api/complaints
GET /api/complaints/:id
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

**IMPORTANTE:** Estos documentos fueron elaborados con base en las mejores prácticas y el conocimiento de la legislación peruana al 19 de enero de 2026.

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

**Responsable de Protección de Datos:**
- Correo: privacidad@nurselite.pe

**Asuntos legales generales:**
- Correo: legal@nurselite.pe [Crear este correo]

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
DOCUMENTACIÓN LEGAL
[ ] Todos los [Completar con...] fueron reemplazados
[ ] Documentos revisados por abogado
[ ] Versiones HTML creadas y subidas al servidor
[ ] URLs públicas funcionando (sin requerir login)

INSCRIPCIONES Y REGISTROS
[ ] Banco de Datos inscrito en RNPDP
[ ] Libro de Reclamaciones físico impreso (si aplica)
[ ] Libro de Reclamaciones digital funcional
[ ] Correos específicos configurados y funcionando

IMPLEMENTACIÓN TÉCNICA
[ ] Checkboxes de aceptación en registro
[ ] Consentimiento expreso para datos sensibles
[ ] Banner de cookies funcional
[ ] Exportar datos implementado
[ ] Eliminar cuenta implementado
[ ] Botón de pánico implementado
[ ] Sistema de notificación de cambios
[ ] Logs de consentimientos con timestamp

PROCESOS INTERNOS
[ ] Protocolo de respuesta a solicitudes ARCO
[ ] Protocolo de respuesta a emergencias
[ ] Protocolo de notificación de brechas de seguridad
[ ] Capacitación del equipo completada

SEGURIDAD
[ ] Encriptación SSL/TLS activa
[ ] Contraseñas hasheadas (bcrypt)
[ ] Datos sensibles encriptados en reposo
[ ] Auditoría de seguridad realizada
[ ] Plan de respuesta a incidentes documentado
```

---

**Última actualización:** 19 de enero de 2026

© 2026 Histora Health. Todos los derechos reservados.
