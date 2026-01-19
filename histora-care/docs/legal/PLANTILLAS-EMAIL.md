# PLANTILLAS DE EMAIL
## Notificaciones Legales - NurseLite

Este documento contiene plantillas de correos electrónicos para cumplir con las obligaciones de notificación establecidas en los documentos legales.

---

## 1. CONFIRMACIÓN DE REGISTRO

**Asunto:** ¡Bienvenido a NurseLite! Tu cuenta ha sido creada

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="text-align: center; padding: 20px 0;">
      <img src="https://care.nurselite.pe/assets/logo.png" alt="NurseLite" style="width: 150px;">
    </div>

    <!-- Contenido -->
    <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
      <h1 style="color: #2D7FF9; margin-top: 0;">¡Bienvenido a NurseLite, {{nombre}}!</h1>

      <p>Tu cuenta ha sido creada exitosamente. Ahora puedes acceder a servicios de enfermería profesional a domicilio con solo unos clics.</p>

      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #2D7FF9;">Información de tu cuenta:</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Tipo de cuenta:</strong> {{tipoUsuario}}</li>
          <li><strong>Email:</strong> {{email}}</li>
          <li><strong>Fecha de registro:</strong> {{fechaRegistro}}</li>
        </ul>
      </div>

      <h3>Documentos que aceptaste:</h3>
      <ul>
        <li><a href="https://care.nurselite.pe/terminos" style="color: #2D7FF9;">Términos y Condiciones</a> (v1.0)</li>
        <li><a href="https://care.nurselite.pe/privacidad" style="color: #2D7FF9;">Política de Privacidad</a> (v1.0)</li>
      </ul>

      {{#if isPaciente}}
      <div style="background: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0;">
        <strong>Importante:</strong> Para solicitar servicios, necesitaremos tu consentimiento para compartir información de salud con los profesionales. Puedes otorgarlo en el próximo paso.
      </div>
      {{/if}}

      <!-- CTA -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://care.nurselite.pe/login" style="background: #2D7FF9; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Ir a la App
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p>Si no creaste esta cuenta, por favor contáctanos inmediatamente en <a href="mailto:hola@nurselite.pe">hola@nurselite.pe</a></p>

      <p style="margin-top: 20px;">
        <a href="https://care.nurselite.pe/terminos" style="color: #666; margin: 0 10px;">Términos</a> |
        <a href="https://care.nurselite.pe/privacidad" style="color: #666; margin: 0 10px;">Privacidad</a> |
        <a href="https://care.nurselite.pe/ayuda" style="color: #666; margin: 0 10px;">Ayuda</a>
      </p>

      <p style="margin-top: 10px;">
        © 2026 Histora Health. Todos los derechos reservados.<br>
        Lima, Perú
      </p>
    </div>
  </div>
</body>
</html>
```

---

## 2. ACTUALIZACIÓN DE TÉRMINOS Y CONDICIONES

**Asunto:** [IMPORTANTE] Actualizamos nuestros Términos y Condiciones

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; padding: 20px 0;">
      <img src="https://care.nurselite.pe/assets/logo.png" alt="NurseLite" style="width: 150px;">
    </div>

    <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
      <h1 style="color: #2D7FF9; margin-top: 0;">Actualizamos nuestros Términos y Condiciones</h1>

      <p>Hola {{nombre}},</p>

      <p>Te escribimos para informarte que hemos actualizado nuestros <strong>Términos y Condiciones</strong> para mejorar la claridad y transparencia de nuestro servicio.</p>

      <div style="background: #E3F2FD; border-left: 4px solid #2D7FF9; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #2D7FF9;">Principales cambios:</h3>
        <ul>
          {{#each cambios}}
          <li>{{this}}</li>
          {{/each}}
        </ul>
      </div>

      <p><strong>Fecha de entrada en vigor:</strong> {{fechaVigencia}}</p>

      <div style="background: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0;">
        <strong>Acción requerida:</strong> Para continuar usando NurseLite, necesitamos que revises y aceptes los nuevos términos antes del {{fechaLimite}}.
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://care.nurselite.pe/accept-updated-terms?token={{token}}" style="background: #2D7FF9; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Revisar y Aceptar
        </a>
      </div>

      <p style="font-size: 14px; color: #666;">
        También puedes revisar los términos completos en:
        <a href="https://care.nurselite.pe/terminos">care.nurselite.pe/terminos</a>
      </p>

      <p style="font-size: 14px; color: #666;">
        Si tienes alguna pregunta, no dudes en contactarnos en <a href="mailto:hola@nurselite.pe">hola@nurselite.pe</a>
      </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p>© 2026 Histora Health. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
```

---

## 3. CONFIRMACIÓN DE EXPORTACIÓN DE DATOS

**Asunto:** Tu exportación de datos está lista

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; padding: 20px 0;">
      <img src="https://care.nurselite.pe/assets/logo.png" alt="NurseLite" style="width: 150px;">
    </div>

    <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
      <h1 style="color: #2D7FF9; margin-top: 0;">Tu exportación de datos está lista</h1>

      <p>Hola {{nombre}},</p>

      <p>Hemos preparado la exportación completa de tus datos personales que solicitaste el {{fechaSolicitud}}.</p>

      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #2D7FF9;">Detalles de la exportación:</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>ID de exportación:</strong> {{exportId}}</li>
          <li><strong>Formato:</strong> ZIP</li>
          <li><strong>Tamaño:</strong> {{fileSize}} MB</li>
          <li><strong>Disponible hasta:</strong> {{fechaExpiracion}} (7 días)</li>
        </ul>
      </div>

      <div style="background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
        <strong>Tu exportación incluye:</strong>
        <ul>
          <li>Datos de perfil y cuenta</li>
          <li>Historial de servicios</li>
          <li>Información de salud (si otorgaste consentimiento)</li>
          <li>Historial de pagos</li>
          <li>Calificaciones y reseñas</li>
          <li>Consentimientos otorgados</li>
          <li>Comunicaciones con soporte</li>
        </ul>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://api.nurselite.pe/legal/data-export/{{exportId}}/download?token={{downloadToken}}" style="background: #4CAF50; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Descargar Mis Datos
        </a>
      </div>

      <div style="background: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0;">
        <strong>Importante:</strong>
        <ul style="margin: 5px 0;">
          <li>Este enlace es personal e intransferible</li>
          <li>Expirará en 7 días por seguridad</li>
          <li>El archivo está protegido con tu contraseña de NurseLite</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #666;">
        ¿Necesitas ayuda? Escríbenos a <a href="mailto:privacidad@nurselite.pe">privacidad@nurselite.pe</a>
      </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p>Este correo fue enviado en respuesta a tu solicitud de exportación de datos conforme a la Ley 29733 de Protección de Datos Personales del Perú.</p>
      <p>© 2026 Histora Health. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
```

---

## 4. CONFIRMACIÓN DE ELIMINACIÓN DE CUENTA

**Asunto:** Confirmación de solicitud de eliminación de cuenta

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; padding: 20px 0;">
      <img src="https://care.nurselite.pe/assets/logo.png" alt="NurseLite" style="width: 150px;">
    </div>

    <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
      <h1 style="color: #FF6B6B; margin-top: 0;">Sentimos verte partir</h1>

      <p>Hola {{nombre}},</p>

      <p>Hemos recibido tu solicitud para eliminar tu cuenta de NurseLite.</p>

      <div style="background: #FFEBEE; border-left: 4px solid #FF6B6B; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #FF6B6B;">Proceso de eliminación:</h3>
        <ul>
          <li><strong>Período de gracia:</strong> 30 días calendario</li>
          <li><strong>Fecha de solicitud:</strong> {{fechaSolicitud}}</li>
          <li><strong>Eliminación programada:</strong> {{fechaEliminacion}}</li>
        </ul>
      </div>

      <h3>¿Qué pasará con tus datos?</h3>
      <ul>
        <li>✅ Tu cuenta quedará inactiva inmediatamente</li>
        <li>✅ No recibirás más notificaciones</li>
        <li>✅ Tu perfil dejará de ser visible</li>
        <li>✅ Después de 30 días, eliminaremos permanentemente:
          <ul>
            <li>Datos personales de identificación</li>
            <li>Información de salud</li>
            <li>Historial de servicios</li>
            <li>Calificaciones y reseñas</li>
          </ul>
        </li>
        <li>⚠️ Conservaremos (por obligación legal):
          <ul>
            <li>Registros de transacciones (7 años - ley tributaria)</li>
            <li>Información necesaria para disputas pendientes</li>
            <li>Datos anonimizados para estadísticas</li>
          </ul>
        </li>
      </ul>

      <div style="background: #E3F2FD; border-left: 4px solid #2D7FF9; padding: 15px; margin: 20px 0;">
        <strong>¿Cambiaste de opinión?</strong><br>
        Puedes cancelar la eliminación en cualquier momento durante los próximos 30 días iniciando sesión en tu cuenta o contactándonos.
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://care.nurselite.pe/cancel-deletion?token={{token}}" style="background: #2D7FF9; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Cancelar Eliminación
        </a>
      </div>

      <p style="font-size: 14px; color: #666;">
        Nos gustaría saber por qué decidiste irte. ¿Podrías tomarte un momento para responder esta breve encuesta?
        <a href="https://care.nurselite.pe/feedback?reason=deletion">Dejar mi opinión</a>
      </p>

      <p>Gracias por haber sido parte de NurseLite.</p>
    </div>

    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p>Si no solicitaste esta eliminación, contacta inmediatamente a <a href="mailto:hola@nurselite.pe">hola@nurselite.pe</a></p>
      <p>© 2026 Histora Health. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
```

---

## 5. NOTIFICACIÓN DE BRECHA DE SEGURIDAD

**Asunto:** [URGENTE] Notificación de seguridad - NurseLite

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; padding: 20px 0;">
      <img src="https://care.nurselite.pe/assets/logo.png" alt="NurseLite" style="width: 150px;">
    </div>

    <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
      <div style="background: #FFEBEE; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <h1 style="color: #FF6B6B; margin: 0;">Notificación de Seguridad</h1>
      </div>

      <p>Hola {{nombre}},</p>

      <p>Te escribimos para informarte sobre un incidente de seguridad que puede haber afectado algunos de tus datos personales.</p>

      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #FF6B6B;">
        <h3 style="margin-top: 0; color: #FF6B6B;">Detalles del incidente:</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Fecha del incidente:</strong> {{fechaIncidente}}</li>
          <li><strong>Fecha de detección:</strong> {{fechaDeteccion}}</li>
          <li><strong>Tipo de incidente:</strong> {{tipoIncidente}}</li>
        </ul>
      </div>

      <h3>Datos potencialmente afectados:</h3>
      <ul>
        {{#each datosAfectados}}
        <li>{{this}}</li>
        {{/each}}
      </ul>

      <div style="background: #E3F2FD; border-left: 4px solid #2D7FF9; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #2D7FF9;">Datos NO comprometidos:</h3>
        <ul>
          <li>❌ Contraseñas (están encriptadas)</li>
          <li>❌ Información de pago completa (tokenizada)</li>
          <li>❌ Datos de salud sensibles (encriptados)</li>
        </ul>
      </div>

      <h3>Medidas que hemos tomado:</h3>
      <ul>
        {{#each medidasTomadas}}
        <li>✅ {{this}}</li>
        {{/each}}
      </ul>

      <div style="background: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Recomendaciones para ti:</h3>
        <ol>
          <li><strong>Cambia tu contraseña inmediatamente</strong></li>
          <li>Activa la autenticación de dos factores (2FA)</li>
          <li>Revisa la actividad reciente en tu cuenta</li>
          <li>Mantente alerta ante correos sospechosos (phishing)</li>
          <li>Si usas la misma contraseña en otros sitios, cámbiala también</li>
        </ol>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://care.nurselite.pe/security/change-password?token={{token}}" style="background: #FF6B6B; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Cambiar Mi Contraseña Ahora
        </a>
      </div>

      <h3>Información adicional:</h3>
      <p>Este incidente ha sido reportado a la Autoridad Nacional de Protección de Datos Personales conforme a la Ley 29733.</p>

      <p>Si tienes preguntas o inquietudes, nuestro equipo de seguridad está disponible en:</p>
      <ul>
        <li>📧 Email: <a href="mailto:seguridad@nurselite.pe">seguridad@nurselite.pe</a></li>
        <li>📞 Teléfono: [Número de emergencias de seguridad]</li>
        <li>💬 Chat prioritario en la app</li>
      </ul>

      <p>Lamentamos profundamente este incidente y te aseguramos que la protección de tus datos es nuestra máxima prioridad.</p>
    </div>

    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p>Este correo contiene información importante sobre la seguridad de tu cuenta.</p>
      <p>© 2026 Histora Health. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
```

---

## 6. RECORDATORIO DE CONSENTIMIENTO PRÓXIMO A EXPIRAR

**Asunto:** Recordatorio: Renueva tu consentimiento para datos de salud

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; padding: 20px 0;">
      <img src="https://care.nurselite.pe/assets/logo.png" alt="NurseLite" style="width: 150px;">
    </div>

    <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
      <h1 style="color: #2D7FF9; margin-top: 0;">Renueva tu consentimiento</h1>

      <p>Hola {{nombre}},</p>

      <p>Te escribimos para recordarte que tu consentimiento para el tratamiento de datos de salud expirará próximamente.</p>

      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <ul style="list-style: none; padding: 0;">
          <li><strong>Fecha de otorgamiento:</strong> {{fechaConsentimiento}}</li>
          <li><strong>Fecha de expiración:</strong> {{fechaExpiracion}}</li>
          <li><strong>Días restantes:</strong> {{diasRestantes}}</li>
        </ul>
      </div>

      <div style="background: #FFF3CD; border-left: 4px solid #FFC107; padding: 15px; margin: 20px 0;">
        <strong>¿Por qué necesitamos renovar tu consentimiento?</strong>
        <p style="margin: 10px 0;">
          Por cumplimiento con la Ley 29733 de Protección de Datos Personales, el consentimiento para datos sensibles (como información de salud) debe renovarse periódicamente para asegurar que sigues de acuerdo con el tratamiento.
        </p>
      </div>

      <p>Si no renuevas tu consentimiento:</p>
      <ul>
        <li>⚠️ No podrás solicitar nuevos servicios de enfermería</li>
        <li>⚠️ Los profesionales no tendrán acceso a tu historial médico</li>
        <li>✅ Tu cuenta permanecerá activa</li>
        <li>✅ Podrás renovar el consentimiento en cualquier momento</li>
      </ul>

      <!-- CTA -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://care.nurselite.pe/renew-consent?token={{token}}" style="background: #2D7FF9; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Renovar Consentimiento
        </a>
      </div>

      <p style="font-size: 14px; color: #666;">
        También puedes renovar tu consentimiento desde la app en: Perfil > Privacidad > Consentimientos
      </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p>© 2026 Histora Health. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
```

---

## 7. RESPUESTA A SOLICITUD DE DERECHOS ARCO

**Asunto:** Respuesta a tu solicitud de [Acceso/Rectificación/Cancelación/Oposición]

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; padding: 20px 0;">
      <img src="https://care.nurselite.pe/assets/logo.png" alt="NurseLite" style="width: 150px;">
    </div>

    <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
      <h1 style="color: #2D7FF9; margin-top: 0;">Respuesta a tu solicitud</h1>

      <p>Hola {{nombre}},</p>

      <p>Hemos procesado tu solicitud de <strong>{{tipoDerecho}}</strong> presentada el {{fechaSolicitud}}.</p>

      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #2D7FF9;">Detalles de la solicitud:</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>N° de caso:</strong> {{numeroCaso}}</li>
          <li><strong>Tipo de solicitud:</strong> {{tipoDerecho}}</li>
          <li><strong>Estado:</strong> <span style="color: #4CAF50; font-weight: bold;">{{estado}}</span></li>
          <li><strong>Fecha de resolución:</strong> {{fechaResolucion}}</li>
        </ul>
      </div>

      {{#if aprobada}}
      <div style="background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #4CAF50;">✅ Solicitud Aprobada</h3>
        <p>{{mensajeAprobacion}}</p>

        {{#if requiereAccion}}
        <p><strong>Acción realizada:</strong></p>
        <ul>
          {{#each acciones}}
          <li>{{this}}</li>
          {{/each}}
        </ul>
        {{/if}}
      </div>
      {{/if}}

      {{#if rechazada}}
      <div style="background: #FFEBEE; border-left: 4px solid #FF6B6B; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #FF6B6B;">❌ Solicitud No Procedente</h3>
        <p><strong>Motivo:</strong> {{motivoRechazo}}</p>

        <p>Si no estás de acuerdo con esta decisión, puedes:</p>
        <ul>
          <li>Presentar una reclamación ante la Autoridad Nacional de Protección de Datos Personales</li>
          <li>Contactarnos para más información en <a href="mailto:privacidad@nurselite.pe">privacidad@nurselite.pe</a></li>
        </ul>
      </div>
      {{/if}}

      <h3>Información de contacto:</h3>
      <p>Si tienes preguntas sobre esta resolución:</p>
      <ul>
        <li>📧 Email: <a href="mailto:privacidad@nurselite.pe">privacidad@nurselite.pe</a></li>
        <li>💬 Chat en la app</li>
      </ul>

      <h3>Autoridad de Protección de Datos:</h3>
      <p>Si deseas presentar una reclamación:</p>
      <ul>
        <li><strong>Entidad:</strong> Autoridad Nacional de Protección de Datos Personales</li>
        <li><strong>Dirección:</strong> Calle 17 N° 355, Urb. El Palomar - San Isidro, Lima</li>
        <li><strong>Teléfono:</strong> (01) 224-7777</li>
        <li><strong>Web:</strong> www.minjus.gob.pe</li>
      </ul>
    </div>

    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p>Esta respuesta se ha enviado conforme a los plazos establecidos en la Ley 29733.</p>
      <p>© 2026 Histora Health. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
```

---

## 8. CONFIRMACIÓN DE RECEPCIÓN DE RECLAMO

**Asunto:** Hemos recibido tu reclamo - Caso #{{numeroCaso}}

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; padding: 20px 0;">
      <img src="https://care.nurselite.pe/assets/logo.png" alt="NurseLite" style="width: 150px;">
    </div>

    <div style="background: #f9f9f9; padding: 30px; border-radius: 10px;">
      <h1 style="color: #2D7FF9; margin-top: 0;">Hemos recibido tu {{tipoSolicitud}}</h1>

      <p>Hola {{nombre}},</p>

      <p>Confirmamos la recepción de tu {{tipoSolicitud}} registrado en nuestro Libro de Reclamaciones.</p>

      <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #2D7FF9;">
        <h3 style="margin-top: 0; color: #2D7FF9;">Información de tu caso:</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>N° de caso:</strong> {{numeroCaso}}</li>
          <li><strong>Tipo:</strong> {{tipoSolicitud}}</li>
          <li><strong>Fecha de registro:</strong> {{fechaRegistro}}</li>
          <li><strong>Motivo:</strong> {{motivo}}</li>
        </ul>
      </div>

      <div style="background: #E3F2FD; border-left: 4px solid #2D7FF9; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0;">¿Qué sigue?</h3>
        <ol>
          <li>Nuestro equipo revisará tu caso en detalle</li>
          <li>Te contactaremos si necesitamos información adicional</li>
          <li>Recibirás una respuesta en un plazo <strong>máximo de 30 días calendario</strong></li>
          <li>Puedes hacer seguimiento con el N° de caso {{numeroCaso}}</li>
        </ol>
      </div>

      <p><strong>Plazo legal de respuesta:</strong> {{fechaLimiteRespuesta}}</p>

      <!-- Seguimiento -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://care.nurselite.pe/seguimiento-reclamo?caso={{numeroCaso}}" style="background: #2D7FF9; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Ver Estado de Mi Caso
        </a>
      </div>

      <h3>Información de INDECOPI:</h3>
      <p>Conforme al Código de Protección del Consumidor, si no estás satisfecho con nuestra respuesta, puedes presentar tu reclamo ante INDECOPI:</p>
      <ul>
        <li><strong>Teléfono:</strong> 224-7777 (Lima) / 0-800-4-4040 (Provincias)</li>
        <li><strong>Web:</strong> www.indecopi.gob.pe</li>
        <li><strong>App:</strong> INDECOPI Móvil</li>
      </ul>

      <p>Nuestro compromiso es resolver tu caso de la mejor manera posible.</p>
    </div>

    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p>Guarda este correo para hacer seguimiento de tu caso.</p>
      <p>© 2026 Histora Health. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
```

---

## VARIABLES DISPONIBLES PARA PLANTILLAS

### Variables Comunes
```javascript
{
  nombre: string,              // Nombre del usuario
  email: string,               // Email del usuario
  tipoUsuario: 'Paciente' | 'Profesional de Enfermería',
  fechaRegistro: string,       // Formato: "19 de enero de 2026"
  token: string                // Token de seguridad para enlaces
}
```

### Variables Específicas

**Registro:**
```javascript
{
  isPaciente: boolean,
  isEnfermera: boolean
}
```

**Actualización de Términos:**
```javascript
{
  cambios: string[],           // Lista de cambios principales
  fechaVigencia: string,
  fechaLimite: string
}
```

**Exportación de Datos:**
```javascript
{
  exportId: string,
  fechaSolicitud: string,
  fileSize: number,
  fechaExpiracion: string,
  downloadToken: string
}
```

**Eliminación de Cuenta:**
```javascript
{
  fechaSolicitud: string,
  fechaEliminacion: string     // 30 días después
}
```

**Brecha de Seguridad:**
```javascript
{
  fechaIncidente: string,
  fechaDeteccion: string,
  tipoIncidente: string,
  datosAfectados: string[],
  medidasTomadas: string[]
}
```

**Renovación de Consentimiento:**
```javascript
{
  fechaConsentimiento: string,
  fechaExpiracion: string,
  diasRestantes: number
}
```

**Derechos ARCO:**
```javascript
{
  tipoDerecho: 'Acceso' | 'Rectificación' | 'Cancelación' | 'Oposición',
  numeroCaso: string,
  fechaSolicitud: string,
  estado: 'Aprobada' | 'Rechazada' | 'En Proceso',
  fechaResolucion: string,
  aprobada: boolean,
  rechazada: boolean,
  mensajeAprobacion: string,
  motivoRechazo: string,
  requiereAccion: boolean,
  acciones: string[]
}
```

**Reclamos:**
```javascript
{
  tipoSolicitud: 'Queja' | 'Reclamo',
  numeroCaso: string,
  fechaRegistro: string,
  motivo: string,
  fechaLimiteRespuesta: string // 30 días después
}
```

---

## IMPLEMENTACIÓN EN EL BACKEND

### Service de Emails (NestJS)

```typescript
// email.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    this.loadTemplates();
  }

  private async loadTemplates() {
    const templates = [
      'welcome',
      'terms-updated',
      'data-export-ready',
      'account-deletion',
      'security-breach',
      'consent-renewal',
      'arco-response',
      'complaint-received'
    ];

    for (const template of templates) {
      const filePath = path.join(__dirname, '..', '..', 'email-templates', `${template}.hbs`);
      const content = await fs.readFile(filePath, 'utf-8');
      this.templates.set(template, handlebars.compile(content));
    }
  }

  async sendWelcomeEmail(to: string, data: any) {
    const html = this.templates.get('welcome')(data);

    await this.transporter.sendMail({
      from: '"NurseLite" <hola@nurselite.pe>',
      to,
      subject: '¡Bienvenido a NurseLite! Tu cuenta ha sido creada',
      html
    });
  }

  async sendTermsUpdatedEmail(to: string, data: any) {
    const html = this.templates.get('terms-updated')(data);

    await this.transporter.sendMail({
      from: '"NurseLite" <hola@nurselite.pe>',
      to,
      subject: '[IMPORTANTE] Actualizamos nuestros Términos y Condiciones',
      html,
      priority: 'high'
    });
  }

  // ... Métodos para otros tipos de email
}
```

---

## CHECKLIST DE IMPLEMENTACIÓN

```
PLANTILLAS DE EMAIL
[ ] Convertir plantillas MD a archivos .hbs (Handlebars)
[ ] Crear assets (logo, iconos) para emails
[ ] Configurar SMTP (Amazon SES, SendGrid, Mailgun, etc.)
[ ] Implementar EmailService en el backend
[ ] Crear tests para cada tipo de email
[ ] Configurar tracking de emails (aperturas, clicks)

TRIGGERS DE ENVÍO
[ ] Registro de usuario → Welcome email
[ ] Actualización de T&C → Terms updated email
[ ] Exportación completada → Data export ready
[ ] Solicitud de eliminación → Account deletion email
[ ] Brecha de seguridad → Security breach email
[ ] 30 días antes de expiración → Consent renewal
[ ] Respuesta ARCO → ARCO response email
[ ] Reclamo recibido → Complaint received

CUMPLIMIENTO
[ ] Incluir botón de "Unsubscribe" en emails promocionales
[ ] No incluir "Unsubscribe" en emails transaccionales críticos
[ ] Agregar texto legal en footer
[ ] Respetar CAN-SPAM Act y normativa de email marketing
[ ] Implementar rate limiting para evitar spam

MONITOREO
[ ] Configurar alertas de bounces
[ ] Monitorear tasa de apertura
[ ] Monitorear tasa de clicks
[ ] Revisar quejas de spam
[ ] Analytics de engagement
```

---

**Última actualización:** 19 de enero de 2026

© 2026 Histora Health. Todos los derechos reservados.
