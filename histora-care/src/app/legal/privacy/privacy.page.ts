import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Location } from '@angular/common';

interface Section {
  title: string;
  content: string;
  paragraphs?: string[];
}

@Component({
  selector: 'app-privacy',
  templateUrl: './privacy.page.html',
  standalone: false,
  styleUrls: ['./privacy.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPage implements OnInit {
  private location = inject(Location);

  lastUpdated = signal('19 de enero de 2026');

  sections = signal<Section[]>([
    {
      title: '1. Informacion General',
      content: `NurseLite, en cumplimiento de la Ley N° 29733 - Ley de Proteccion de Datos Personales del Peru y su Reglamento aprobado por Decreto Supremo N° 003-2013-JUS, pone a disposicion de sus usuarios la presente Politica de Privacidad.

Esta politica describe como recopilamos, usamos, almacenamos y protegemos tu informacion personal cuando utilizas nuestra plataforma.`
    },
    {
      title: '2. Responsable del Tratamiento',
      content: `El responsable del tratamiento de tus datos personales es:

• Razon Social: NurseLite S.A.C.
• RUC: [Pendiente de registro]
• Domicilio: Lima, Peru
• Email: privacidad@nurselite.pe

Contamos con un banco de datos personales registrado ante la Autoridad Nacional de Proteccion de Datos Personales del Ministerio de Justicia y Derechos Humanos.`
    },
    {
      title: '3. Datos que Recopilamos',
      content: `Recopilamos los siguientes tipos de datos:

DATOS DE IDENTIFICACION:
• Nombre completo
• DNI o documento de identidad
• Fotografia de perfil
• Fecha de nacimiento
• Genero

DATOS DE CONTACTO:
• Correo electronico
• Numero de telefono
• Direccion de domicilio

DATOS PROFESIONALES (solo enfermeras):
• Numero de colegiatura CEP
• Especialidades y certificaciones
• Experiencia laboral
• Documentos de verificacion

DATOS DE SALUD (con consentimiento expreso):
• Condicion de salud del paciente
• Historial de servicios recibidos
• Notas de atencion

DATOS TECNICOS:
• Direccion IP
• Tipo de dispositivo y navegador
• Ubicacion geografica (con permiso)
• Datos de uso de la aplicacion`
    },
    {
      title: '4. Finalidad del Tratamiento',
      content: `Utilizamos tus datos personales para:

FINALIDADES PRINCIPALES:
• Crear y gestionar tu cuenta de usuario
• Conectar pacientes con profesionales de enfermeria
• Procesar pagos y transacciones
• Enviar notificaciones sobre servicios
• Verificar la identidad y credenciales de profesionales

FINALIDADES ADICIONALES (con consentimiento):
• Enviar comunicaciones de marketing
• Mejorar nuestros servicios mediante analisis
• Realizar encuestas de satisfaccion
• Personalizar tu experiencia en la plataforma`
    },
    {
      title: '5. Base Legal del Tratamiento',
      content: `El tratamiento de tus datos se basa en:

• Ejecucion de contrato: Para prestarte nuestros servicios
• Consentimiento: Para datos sensibles y marketing
• Obligacion legal: Para cumplir con normativas tributarias y sanitarias
• Interes legitimo: Para mejorar la seguridad y prevenir fraudes`
    },
    {
      title: '6. Comparticion de Datos',
      content: `Compartimos tus datos unicamente en los siguientes casos:

ENTRE USUARIOS:
• Cuando solicitas un servicio, compartimos tus datos de contacto con el profesional seleccionado y viceversa

PROVEEDORES DE SERVICIOS:
• Procesadores de pago (Culqi)
• Servicios de almacenamiento en la nube
• Servicios de verificacion de identidad

AUTORIDADES:
• Cuando la ley lo exija o en respuesta a procesos legales

No vendemos ni alquilamos tus datos personales a terceros.`
    },
    {
      title: '7. Tus Derechos (ARCO)',
      content: `Tienes derecho a:

ACCESO:
Conocer que datos personales tenemos sobre ti y como los tratamos.

RECTIFICACION:
Solicitar la correccion de datos inexactos o incompletos.

CANCELACION:
Solicitar la eliminacion de tus datos cuando ya no sean necesarios.

OPOSICION:
Oponerte al tratamiento de tus datos para fines especificos.

Para ejercer estos derechos, envia un correo a: privacidad@nurselite.pe
Responderemos en un plazo maximo de 10 dias habiles.`
    },
    {
      title: '8. Seguridad de los Datos',
      content: `Implementamos medidas de seguridad tecnicas y organizativas:

MEDIDAS TECNICAS:
• Encriptacion SSL/TLS para transmision de datos
• Encriptacion de datos sensibles en reposo
• Autenticacion de dos factores disponible
• Monitoreo continuo de seguridad

MEDIDAS ORGANIZATIVAS:
• Acceso restringido a personal autorizado
• Capacitacion en proteccion de datos
• Politicas internas de seguridad
• Evaluaciones periodicas de riesgos`
    },
    {
      title: '9. Conservacion de Datos',
      content: `Conservamos tus datos durante los siguientes plazos:

• Datos de cuenta: Mientras mantengas una cuenta activa, mas 2 años despues del cierre
• Datos de transacciones: 10 años (obligacion tributaria)
• Datos de salud: 5 años desde el ultimo servicio
• Datos de marketing: Hasta que retires tu consentimiento

Pasados estos plazos, los datos seran eliminados o anonimizados.`
    },
    {
      title: '10. Cookies y Tecnologias Similares',
      content: `Utilizamos cookies para:

• Mantener tu sesion iniciada
• Recordar tus preferencias
• Analizar el uso de la plataforma
• Mejorar la experiencia de usuario

Puedes gestionar las cookies desde la configuracion de tu navegador. Desactivar ciertas cookies puede afectar la funcionalidad de la plataforma.`
    },
    {
      title: '11. Transferencias Internacionales',
      content: `Algunos de nuestros proveedores de servicios pueden estar ubicados fuera del Peru. En estos casos, garantizamos que:

• Existen clausulas contractuales de proteccion
• Los paises de destino cuentan con nivel adecuado de proteccion
• Se aplican las salvaguardas requeridas por la normativa peruana`
    },
    {
      title: '12. Menores de Edad',
      content: `NurseLite esta dirigido a mayores de 18 años. No recopilamos intencionalmente datos de menores sin el consentimiento de sus padres o tutores.

Cuando un menor requiera servicios de enfermeria, el adulto responsable debera crear la cuenta y gestionar la solicitud.`
    },
    {
      title: '13. Cambios a esta Politica',
      content: `Podemos actualizar esta politica periodicamente. Te notificaremos sobre cambios significativos a traves de:

• Notificacion en la aplicacion
• Correo electronico
• Aviso destacado en nuestra web

La fecha de ultima actualizacion se indica al inicio del documento.`
    },
    {
      title: '14. Contacto',
      content: `Para consultas sobre privacidad:

• Email: privacidad@nurselite.pe
• Telefono: +51 1 XXX-XXXX
• Direccion: Lima, Peru

Tambien puedes presentar un reclamo ante la Autoridad Nacional de Proteccion de Datos Personales (ANPDP) del Ministerio de Justicia:
• Web: www.minjus.gob.pe/proteccion-de-datos-personales`
    }
  ]);

  ngOnInit() {
    // Process sections to split content into paragraphs
    const processed = this.sections().map(section => ({
      ...section,
      paragraphs: section.content.split('\n\n').map(p => p.replace(/\n/g, '<br>'))
    }));
    this.sections.set(processed);
  }

  goBack() {
    this.location.back();
  }
}
