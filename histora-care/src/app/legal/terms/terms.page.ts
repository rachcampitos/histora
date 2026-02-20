import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Location } from '@angular/common';

interface Section {
  title: string;
  content: string;
  paragraphs?: string[];
}

@Component({
  selector: 'app-terms',
  templateUrl: './terms.page.html',
  standalone: false,
  styleUrls: ['./terms.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsPage implements OnInit {
  private location = inject(Location);

  lastUpdated = signal('18 de febrero de 2026');

  sections = signal<Section[]>([
    {
      title: '1. Identificacion y Naturaleza del Servicio',
      content: `Code Media Empresa Individual de Responsabilidad Limitada (Code Media EIRL), constituida al amparo del Decreto Ley N° 21621, con RUC 20615496074, inscrita en la Partida N° 16142535 de la Zona Registral N° IX - Sede Lima de SUNARP, con domicilio fiscal en Cal. Tiahuanaco 145, Dpto 201, Urb. Portada del Sol Et. Dos, La Molina, Lima, opera bajo el nombre comercial "NurseLite".

NurseLite es una plataforma tecnologica de intermediacion que conecta a pacientes con profesionales de enfermeria independientes debidamente certificados.

Code Media EIRL (NurseLite) NO es:
• Establecimiento de salud (clinica, hospital, centro medico)
• Prestador directo de servicios de enfermeria
• Empleador de los profesionales registrados en la plataforma
• Responsable de decisiones clinicas, diagnosticos o tratamientos

Code Media EIRL (NurseLite) SI es:
• Plataforma tecnologica de intermediacion entre pacientes y profesionales
• Facilitador del contacto y la contratacion de servicios
• Procesador de pagos por cuenta de las partes
• Verificador de credenciales CEP al momento del registro del profesional

Los profesionales de enfermeria que ofrecen sus servicios a traves de la plataforma son independientes y responsables de sus propias acciones, decisiones clinicas y cumplimiento de las normativas aplicables a su profesion. Cada profesional es responsable de mantener vigente su colegiatura CEP y cumplir los protocolos del Colegio de Enfermeros del Peru.

Marco normativo aplicable:
• Plataforma digital: Ley N° 29571 (Proteccion al Consumidor), Ley N° 29733 (Datos Personales)
• Profesionales de enfermeria: Ley N° 27669 (Trabajo de la Enfermera/o), Codigo de Etica del CEP
• Relacion terapeutica: Ley N° 26842 (Ley General de Salud), Ley N° 29414 (Derechos del Usuario de Servicios de Salud)`
    },
    {
      title: '2. Requisitos de Uso',
      content: `Para utilizar NurseLite, debes:

• Ser mayor de 18 años o contar con autorización de un tutor legal
• Proporcionar información veraz y actualizada durante el registro
• No utilizar la plataforma para fines ilegales o no autorizados
• Mantener la confidencialidad de tus credenciales de acceso

Para profesionales de enfermería:
• Contar con título profesional válido y colegiatura vigente (CEP)
• Estar habilitado para ejercer según el Colegio de Enfermeros del Perú
• Completar el proceso de verificación de identidad`
    },
    {
      title: '3. Proceso de Contratación',
      content: `El proceso de contratación de servicios funciona de la siguiente manera:

1. Búsqueda: El paciente busca profesionales según ubicación, especialidad y disponibilidad
2. Selección: El paciente selecciona un profesional y solicita el servicio
3. Confirmación: El profesional acepta o rechaza la solicitud
4. Pago: El paciente realiza el pago a través de la plataforma
5. Servicio: El profesional brinda el servicio en el lugar acordado
6. Evaluación: Ambas partes pueden evaluar la experiencia`
    },
    {
      title: '4. Pagos y Modelo de Suscripcion',
      content: `4.1 Pagos por servicios
Los pagos por servicios de enfermeria se procesan a traves de la plataforma utilizando metodos seguros (tarjetas de credito/debito, Yape, efectivo).

• El precio del servicio es establecido por el profesional
• El paciente paga el precio del servicio sin cargos adicionales de la plataforma
• Los pagos electronicos se procesan a traves de pasarelas certificadas
• En caso de pago en efectivo, el paciente paga directamente al profesional al finalizar el servicio

4.2 Suscripcion para profesionales
NurseLite opera bajo un modelo de suscripcion mensual para profesionales de enfermeria:

• Plan Basico (Gratuito): Hasta 10 solicitudes al mes, perfil verificado, notificaciones en tiempo real
• Plan Pro (S/39/mes): Solicitudes ilimitadas, mayor visibilidad en busquedas, estadisticas avanzadas, soporte prioritario
• Plan Premium (S/79/mes): Todo del Plan Pro mas perfil destacado, maxima visibilidad, dashboard profesional, soporte por WhatsApp

NurseLite NO cobra comision por servicio realizado. El profesional recibe el 100% del precio del servicio.

4.3 Forma de pago de la suscripcion
El pago de la suscripcion se realiza por Yape. La activacion del plan se confirma en un plazo maximo de 24 horas habiles.

4.4 Cancelacion de la suscripcion
El profesional puede cancelar su suscripcion en cualquier momento. La cancelacion se hace efectiva al termino del periodo pagado. No se realizan reembolsos parciales por periodos no utilizados.`
    },
    {
      title: '5. Cancelaciones y Reembolsos de Servicios',
      content: `Politica de cancelacion para pacientes:

• Cancelacion con mas de 4 horas de anticipacion: Sin cargo
• Cancelacion entre 1 y 4 horas antes del servicio: Cargo de S/15 por gestion
• Cancelacion con menos de 1 hora: 50% del precio del servicio
• Profesional en camino (confirmado por GPS): 75% del precio del servicio
• No presentarse sin aviso: 100% del precio del servicio y posible suspension

Politica de cancelacion para profesionales:
• Cancelacion con mas de 4 horas de anticipacion y motivo valido: Sin penalidad
• Cancelacion con menos de 4 horas: Penalidad en reputacion
• No presentarse sin aviso: Suspension temporal de 72 horas
• Patron de cancelaciones (mas de 2 en 30 dias): Revision administrativa

Los cargos por cancelacion protegen a los profesionales que reservaron su tiempo para atenderte. En caso de pagos electronicos, los montos retenidos se liberan o cobran segun la politica aplicable.`
    },
    {
      title: '6. Responsabilidades',
      content: `Responsabilidades de NurseLite:
• Mantener la plataforma operativa y segura
• Verificar la identidad y credenciales de los profesionales
• Procesar pagos de forma segura
• Atender reclamos y disputas

Responsabilidades del Profesional:
• Brindar servicios con la calidad y ética profesional requerida
• Cumplir con las normativas sanitarias vigentes
• Mantener actualizada su información y documentación
• Respetar la privacidad del paciente

Responsabilidades del Paciente:
• Proporcionar información precisa sobre su condición
• Facilitar un ambiente seguro para el servicio
• Realizar los pagos oportunamente
• Tratar con respeto al profesional`
    },
    {
      title: '7. Responsabilidades y Limitaciones',
      content: `7.1 Naturaleza de la Relacion
NurseLite actua exclusivamente como plataforma tecnologica de intermediacion. Los servicios de enfermeria son prestados de manera independiente por profesionales licenciados con quienes NurseLite no mantiene relacion laboral.

7.2 Responsabilidad de NurseLite
Como plataforma, NurseLite es responsable de:
• Verificar la vigencia de la colegiatura CEP al momento del registro del profesional
• Garantizar la operatividad de la plataforma tecnologica
• Procesar pagos de manera segura a traves de pasarelas certificadas
• Atender reclamos en un plazo maximo de 30 dias calendario (D.S. 011-2011-PCM)
• Facilitar el acceso al Libro de Reclamaciones virtual

7.3 Limitacion de Responsabilidad por Actos de Terceros
Conforme al Art. 50 de la Ley N° 29571, NurseLite NO es responsable por:
• Decisiones clinicas, diagnosticos o tratamientos realizados por los profesionales
• Complicaciones medicas derivadas de condiciones preexistentes del paciente
• Danos causados por negligencia profesional del enfermero(a), sin perjuicio del derecho del usuario de reclamar directamente al profesional responsable

7.4 Responsabilidad Maxima
En caso de fallas en la plataforma tecnologica atribuibles a NurseLite, la responsabilidad maxima sera equivalente al monto total de las comisiones cobradas al usuario afectado en los ultimos 12 meses.

7.5 Obligacion de Cooperacion
NurseLite facilitara la identificacion del profesional responsable y cooperara con las autoridades competentes (SUSALUD, Colegio de Enfermeros del Peru, Fiscalia, INDECOPI) en caso de investigaciones o procedimientos derivados de la prestacion de servicios.`
    },
    {
      title: '8. Propiedad Intelectual',
      content: `Todos los derechos de propiedad intelectual sobre la plataforma, incluyendo pero no limitado a: diseño, código fuente, marcas, logotipos y contenido, pertenecen a NurseLite o sus licenciantes.

Los usuarios no están autorizados a:
• Copiar, modificar o distribuir el contenido de la plataforma
• Realizar ingeniería inversa del software
• Usar las marcas sin autorización escrita`
    },
    {
      title: '9. Privacidad y Datos Personales',
      content: `El tratamiento de datos personales se rige por nuestra Política de Privacidad, la cual cumple con la Ley 29733 - Ley de Protección de Datos Personales del Perú y su Reglamento.

Al usar la plataforma, consientes el tratamiento de tus datos conforme a dicha política.`
    },
    {
      title: '10. Modificaciones',
      content: `NurseLite se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a través de la plataforma y/o correo electrónico con al menos 15 días de anticipación.

El uso continuado de la plataforma después de los cambios implica la aceptación de los nuevos términos.`
    },
    {
      title: '11. Ley Aplicable y Jurisdicción',
      content: `Estos términos se rigen por las leyes de la República del Perú. Cualquier controversia será sometida a los tribunales competentes de Lima, Perú, renunciando las partes a cualquier otro fuero que pudiera corresponderles.`
    },
    {
      title: '12. Derechos del Paciente',
      content: `Conforme a la Ley N° 29414 (Derechos de los Usuarios de Servicios de Salud) y la Ley N° 29571 (Codigo de Proteccion y Defensa del Consumidor), los pacientes que contratan servicios a traves de NurseLite tienen derecho a:

a) Atencion oportuna: Recibir el servicio en el horario y condiciones pactadas
b) Informacion: Conocer datos completos del profesional (nombre, numero CEP, especialidad) antes de contratar
c) Consentimiento informado: Otorgar o denegar consentimiento antes de cualquier procedimiento
d) Confidencialidad: Proteccion de su informacion medica y datos personales
e) Trato digno: Recibir un trato respetuoso y sin discriminacion
f) Reclamos: Presentar reclamos ante NurseLite, SUSALUD o INDECOPI por deficiencias en la calidad del servicio
g) Documentacion: Solicitar copia de cualquier registro o reporte elaborado por el profesional

NurseLite garantiza el acceso a estos derechos facilitando:
• Perfil verificado del profesional visible antes de la contratacion
• Canal de reclamos: admin@nurselite.com
• Acceso al Libro de Reclamaciones virtual en la aplicacion
• Cooperacion con investigaciones de SUSALUD o el Colegio de Enfermeros del Peru`
    },
    {
      title: '13. Contacto y Libro de Reclamaciones',
      content: `Para consultas sobre estos terminos:

• Email: admin@nurselite.com
• Telefono: +51 939 175 392
• Direccion: Cal. Tiahuanaco 145, Dpto 201, Urb. Portada del Sol Et. Dos, La Molina, Lima
• Horario de atencion: Lunes a sabado, 8:00 a.m. a 8:00 p.m.

LIBRO DE RECLAMACIONES VIRTUAL

Conforme al D.S. 011-2011-PCM y al Art. 25 de la Ley N° 29571 (Codigo de Proteccion y Defensa del Consumidor), Code Media EIRL pone a disposicion de sus usuarios un Libro de Reclamaciones Virtual accesible en:

a) Aplicacion movil: Ayuda > Libro de Reclamaciones
b) Correo electronico: admin@nurselite.com (asunto: "LIBRO DE RECLAMACIONES")

Diferencia entre Reclamo y Queja:
• RECLAMO: Disconformidad relacionada con los servicios contratados a traves de la plataforma (ej: profesional no se presento, cobro indebido, servicio defectuoso)
• QUEJA: Disconformidad respecto a la atencion al usuario por parte de NurseLite (ej: demora en responder, mala atencion de soporte)

Procedimiento:
1. El usuario completa el formulario con el detalle del reclamo o queja
2. Recibe un numero de seguimiento automatico
3. NurseLite responde en un plazo maximo de 30 dias calendario
4. Si no se alcanza una solucion satisfactoria, el usuario puede acudir a INDECOPI

El acceso al Libro de Reclamaciones es GRATUITO y no requiere ser usuario registrado.

INDECOPI - Servicio de Atencion al Ciudadano:
• Telefono: 224-7777 (Lima) / 0-800-4-4040 (provincias, gratuito)
• Web: www.indecopi.gob.pe`
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
