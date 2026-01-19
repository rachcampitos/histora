import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Location } from '@angular/common';

interface FAQ {
  question: string;
  answer: string;
  expanded?: boolean;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: string;
  faqs: FAQ[];
}

@Component({
  selector: 'app-help',
  templateUrl: './help.page.html',
  standalone: false,
  styleUrls: ['./help.page.scss'],
})
export class HelpPage implements OnInit {
  private location = inject(Location);

  searchQuery = signal('');

  categories = signal<FAQCategory[]>([
    {
      id: 'patients',
      title: 'Para Pacientes',
      icon: 'person-outline',
      faqs: [
        {
          question: 'Como solicito un servicio de enfermeria?',
          answer: 'Desde la pantalla principal, selecciona el tipo de servicio que necesitas, elige la fecha y hora, busca profesionales disponibles en tu zona, selecciona uno y confirma la solicitud. Recibiras una notificacion cuando el profesional acepte.'
        },
        {
          question: 'Como puedo pagar por los servicios?',
          answer: 'Aceptamos multiples metodos de pago: tarjeta de credito/debito (Visa, Mastercard), Yape y efectivo. Los pagos con tarjeta y Yape se procesan de forma segura a traves de Culqi. Si eliges efectivo, pagaras directamente al profesional al finalizar el servicio.'
        },
        {
          question: 'Puedo cancelar un servicio ya solicitado?',
          answer: 'Si, puedes cancelar. Si cancelas con mas de 24 horas de anticipacion, recibiras reembolso completo. Entre 12-24 horas, reembolso del 50%. Con menos de 12 horas, no hay reembolso. Esto protege a los profesionales que reservaron su tiempo para atenderte.'
        },
        {
          question: 'Como se que el profesional es confiable?',
          answer: 'Todos nuestros profesionales pasan por un riguroso proceso de verificacion: validamos su colegiatura con el CEP (Colegio de Enfermeros del Peru), verificamos su identidad con RENIEC, y revisamos sus antecedentes. Ademas, puedes ver las calificaciones y resenas de otros pacientes.'
        },
        {
          question: 'Que hago si tengo un problema durante el servicio?',
          answer: 'Si tienes cualquier inconveniente, puedes contactarnos inmediatamente a traves del boton de ayuda en la app. En caso de emergencia medica, siempre llama al 106 (SAMU) o acude al centro de salud mas cercano. Tambien puedes reportar problemas despues del servicio.'
        },
        {
          question: 'Puedo solicitar el mismo profesional para futuros servicios?',
          answer: 'Si, puedes marcar profesionales como favoritos y solicitarlos directamente para futuros servicios, siempre que esten disponibles en el horario que necesitas.'
        },
        {
          question: 'Los servicios incluyen medicamentos o insumos?',
          answer: 'El precio base del servicio incluye solo la atencion profesional. Medicamentos, insumos especiales o equipos adicionales tienen costo extra y deben coordinarse previamente con el profesional.'
        }
      ]
    },
    {
      id: 'nurses',
      title: 'Para Enfermeras',
      icon: 'medkit-outline',
      faqs: [
        {
          question: 'Como me registro como profesional en NurseLite?',
          answer: 'Descarga la app, selecciona "Soy Enfermera" al registrarte, completa tus datos personales, ingresa tu numero de colegiatura CEP y DNI para verificacion automatica, y sube los documentos requeridos. Nuestro equipo revisara tu solicitud en 24-48 horas.'
        },
        {
          question: 'Que requisitos necesito para registrarme?',
          answer: 'Necesitas: titulo profesional de enfermeria, colegiatura CEP vigente y en estado HABIL, DNI peruano, foto de perfil profesional, y documentos de soporte (titulo, certificados). Opcionalmente puedes agregar certificaciones de especialidad.'
        },
        {
          question: 'Como funciona el sistema de pagos?',
          answer: 'Tu estableces el precio de tus servicios. Cuando un paciente paga con tarjeta o Yape, el dinero se procesa a traves de la plataforma. NurseLite cobra una comision del 15% y el resto se transfiere a tu cuenta. Para pagos en efectivo, recibes el pago directamente del paciente.'
        },
        {
          question: 'Cuando recibo mis pagos?',
          answer: 'Para pagos electronicos, los fondos se liberan una vez que el servicio se marca como completado y el paciente confirma. Las transferencias a tu cuenta bancaria se procesan semanalmente. Los pagos en efectivo los recibes inmediatamente del paciente.'
        },
        {
          question: 'Como me llegan las solicitudes de servicio?',
          answer: 'Recibiras notificaciones push cuando un paciente solicite un servicio en tu zona y horario disponible. Puedes aceptar o rechazar cada solicitud. Tendras unos minutos para responder antes de que la solicitud pase a otro profesional.'
        },
        {
          question: 'Puedo establecer mi propia disponibilidad?',
          answer: 'Si, tienes control total sobre tu horario. Puedes configurar los dias y horas en que estas disponible, bloquear fechas especificas, y pausar tu perfil cuando no puedas atender.'
        },
        {
          question: 'Que pasa si un paciente cancela?',
          answer: 'Si el paciente cancela con menos de 12 horas de anticipacion, recibiras una compensacion parcial. Las cancelaciones frecuentes de pacientes se monitorean y pueden resultar en restricciones para ellos.'
        },
        {
          question: 'Como mejoro mi visibilidad en la plataforma?',
          answer: 'Mantén tu perfil completo con foto profesional, responde rapido a las solicitudes, brinda un servicio de calidad para obtener buenas calificaciones, y considera obtener certificaciones adicionales en especialidades demandadas.'
        }
      ]
    },
    {
      id: 'account',
      title: 'Cuenta y Configuracion',
      icon: 'settings-outline',
      faqs: [
        {
          question: 'Como cambio mi contrasena?',
          answer: 'Ve a Configuracion > Seguridad > Cambiar Contrasena. Ingresa tu contrasena actual y luego la nueva contrasena dos veces para confirmar. Recibirás un correo de confirmacion.'
        },
        {
          question: 'Como actualizo mis datos personales?',
          answer: 'En Configuracion > Perfil puedes actualizar tu nombre, telefono, direccion y foto de perfil. Algunos datos como DNI requieren contactar a soporte para modificarse por seguridad.'
        },
        {
          question: 'Como elimino mi cuenta?',
          answer: 'Puedes solicitar la eliminacion de tu cuenta en Configuracion > Privacidad > Eliminar Cuenta. Tendras 30 dias para revertir la decision. Despues de ese plazo, tus datos seran eliminados permanentemente conforme a la ley.'
        },
        {
          question: 'Como descargo mis datos personales?',
          answer: 'Segun la Ley 29733, tienes derecho a acceder a tus datos. Ve a Configuracion > Privacidad > Descargar mis datos. Prepararemos un archivo con toda tu informacion y te notificaremos cuando este listo.'
        },
        {
          question: 'Como desactivo las notificaciones?',
          answer: 'En Configuracion > Notificaciones puedes personalizar que alertas recibir. Recomendamos mantener activas las notificaciones de servicios para no perder solicitudes importantes.'
        }
      ]
    },
    {
      id: 'safety',
      title: 'Seguridad y Emergencias',
      icon: 'shield-checkmark-outline',
      faqs: [
        {
          question: 'Que hago en caso de emergencia medica?',
          answer: 'NurseLite es para servicios programados, NO para emergencias. En caso de emergencia, llama inmediatamente al 106 (SAMU), 116 (Bomberos) o acude al servicio de emergencias mas cercano. Los profesionales de NurseLite pueden ayudarte con primeros auxilios mientras llega la ayuda.'
        },
        {
          question: 'Como reporto un problema de seguridad?',
          answer: 'Si experimentas cualquier situacion de riesgo o comportamiento inapropiado, usa el boton de emergencia en la app o contactanos inmediatamente. Todos los reportes son confidenciales y se investigan con prioridad.'
        },
        {
          question: 'Mis datos de pago estan seguros?',
          answer: 'Si. No almacenamos los datos completos de tu tarjeta. Los pagos se procesan a traves de Culqi, una pasarela certificada PCI-DSS. Toda la informacion viaja encriptada con SSL.'
        },
        {
          question: 'Como verifican la identidad de los profesionales?',
          answer: 'Realizamos triple verificacion: 1) Validamos la colegiatura en tiempo real con el Colegio de Enfermeros del Peru, 2) Verificamos identidad con RENIEC, 3) Realizamos verificacion biometrica con reconocimiento facial. Ademas, monitoreamos continuamente el estado de las colegaturas.'
        }
      ]
    },
    {
      id: 'general',
      title: 'Preguntas Generales',
      icon: 'help-circle-outline',
      faqs: [
        {
          question: 'Que es NurseLite?',
          answer: 'NurseLite es una plataforma que conecta pacientes con profesionales de enfermeria verificados para servicios a domicilio. Facilitamos la busqueda, contratacion y pago de servicios como cuidado de adultos mayores, curaciones, inyectables, y mas.'
        },
        {
          question: 'En que ciudades esta disponible NurseLite?',
          answer: 'Actualmente operamos en Lima Metropolitana. Estamos expandiendonos gradualmente a otras ciudades del Peru. Siguenos en redes sociales para conocer cuando lleguemos a tu zona.'
        },
        {
          question: 'Cuanto cuesta usar NurseLite?',
          answer: 'Para pacientes, no hay costo de registro ni comisiones adicionales - solo pagas el precio del servicio establecido por el profesional. Para profesionales, NurseLite cobra una comision del 15% sobre cada servicio completado.'
        },
        {
          question: 'Como contacto al soporte de NurseLite?',
          answer: 'Puedes contactarnos por: Email (soporte@nurselite.pe), WhatsApp (+51 XXX XXX XXX), o a traves del chat de ayuda en la app. Nuestro horario de atencion es de lunes a sabado, 8am a 8pm.'
        },
        {
          question: 'Donde encuentro el Libro de Reclamaciones?',
          answer: 'El Libro de Reclamaciones esta disponible en la app en la seccion Ayuda > Libro de Reclamaciones, o en nuestra web. Cumplimos con la normativa de INDECOPI para atencion de reclamos.'
        }
      ]
    }
  ]);

  filteredCategories = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return this.categories();
    }

    return this.categories()
      .map(category => ({
        ...category,
        faqs: category.faqs.filter(
          faq =>
            faq.question.toLowerCase().includes(query) ||
            faq.answer.toLowerCase().includes(query)
        )
      }))
      .filter(category => category.faqs.length > 0);
  });

  ngOnInit() {}

  goBack() {
    this.location.back();
  }

  onSearchChange(event: CustomEvent) {
    this.searchQuery.set(event.detail.value || '');
  }

  toggleFaq(categoryId: string, faqIndex: number) {
    const updated = this.categories().map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          faqs: cat.faqs.map((faq, idx) => ({
            ...faq,
            expanded: idx === faqIndex ? !faq.expanded : false
          }))
        };
      }
      return {
        ...cat,
        faqs: cat.faqs.map(faq => ({ ...faq, expanded: false }))
      };
    });
    this.categories.set(updated);
  }

  contactSupport() {
    window.open('mailto:soporte@nurselite.pe', '_blank');
  }

  openWhatsApp() {
    window.open('https://wa.me/51XXXXXXXXX', '_blank');
  }
}
