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

  lastUpdated = signal('19 de enero de 2026');

  sections = signal<Section[]>([
    {
      title: '1. Naturaleza del Servicio',
      content: `NurseLite es una plataforma tecnológica de intermediación que conecta a pacientes con profesionales de enfermería independientes debidamente certificados. NurseLite NO es un prestador directo de servicios de salud, sino un facilitador tecnológico que permite la conexión entre usuarios y profesionales.

Los profesionales de enfermería que ofrecen sus servicios a través de la plataforma son independientes y responsables de sus propias acciones, decisiones clínicas y cumplimiento de las normativas aplicables a su profesión.`
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
      title: '4. Pagos y Comisiones',
      content: `Los pagos se procesan a través de la plataforma utilizando métodos seguros (tarjetas, Yape, efectivo).

• El precio del servicio es establecido por el profesional
• NurseLite cobra una comisión del 15% sobre el precio del servicio, la cual es asumida por el profesional
• Los pagos a profesionales se liberan una vez completado el servicio satisfactoriamente
• En caso de pago en efectivo, el profesional recibe el pago directamente del paciente`
    },
    {
      title: '5. Cancelaciones y Reembolsos',
      content: `Política de cancelación para pacientes:

• Cancelación con más de 24 horas de anticipación: Reembolso completo
• Cancelación entre 12-24 horas: Reembolso del 50%
• Cancelación con menos de 12 horas: Sin reembolso
• No presentarse sin aviso: Sin reembolso y posible suspensión

Política de cancelación para profesionales:
• Cancelaciones repetidas pueden resultar en suspensión de la cuenta
• Debe notificar al paciente con la mayor anticipación posible`
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
      title: '7. Limitación de Responsabilidad',
      content: `NurseLite no será responsable por:

• Daños derivados de la prestación de servicios de salud por parte de los profesionales
• Decisiones médicas o de enfermería tomadas por los profesionales
• Complicaciones de salud preexistentes o derivadas del tratamiento
• Pérdidas económicas indirectas
• Interrupciones del servicio por causas de fuerza mayor

La responsabilidad máxima de NurseLite se limita al monto de las comisiones cobradas en los últimos 12 meses.`
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
      title: '12. Contacto',
      content: `Para consultas sobre estos términos:

• Email: legal@nurselite.pe
• Teléfono: +51 1 XXX-XXXX
• Dirección: Lima, Perú

Libro de Reclamaciones disponible en la aplicación.`
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
