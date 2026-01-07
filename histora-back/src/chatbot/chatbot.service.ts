import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WhatsAppApiProvider } from './providers/whatsapp-api.provider';
import { Patient, PatientDocument } from '../patients/schemas/patients.schema';
import { Doctor } from '../doctors/schema/doctor.schema';
import { Appointment } from '../appointments/schema/appointment.schema';

// Conversation state stored in memory (for production, use Redis)
interface ConversationState {
  step: string;
  data: Record<string, any>;
  lastActivity: Date;
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private conversations: Map<string, ConversationState> = new Map();

  constructor(
    private whatsAppApi: WhatsAppApiProvider,
    @InjectModel(Patient.name) private patientModel: Model<Patient>,
    @InjectModel(Doctor.name) private doctorModel: Model<Doctor>,
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
  ) {
    // Clean up old conversations every hour
    setInterval(() => this.cleanupOldConversations(), 60 * 60 * 1000);
  }

  /**
   * Main entry point for processing incoming messages
   */
  async processMessage(
    phoneNumber: string,
    messageText: string,
    messageId: string,
    contactName: string,
  ): Promise<void> {
    this.logger.log(`Message from ${phoneNumber} (${contactName}): ${messageText}`);

    // Mark message as read
    await this.whatsAppApi.markAsRead(messageId);

    // Get or create conversation state
    let state = this.conversations.get(phoneNumber);
    if (!state) {
      state = { step: 'initial', data: { contactName }, lastActivity: new Date() };
      this.conversations.set(phoneNumber, state);
    }
    state.lastActivity = new Date();

    // Process based on current step
    const normalizedMessage = messageText.toLowerCase().trim();

    // Check for reset commands
    if (['menu', 'inicio', 'hola', 'hi', 'hello', 'reiniciar'].includes(normalizedMessage)) {
      state.step = 'initial';
      state.data = { contactName };
    }

    // Route to appropriate handler
    switch (state.step) {
      case 'initial':
        await this.handleInitial(phoneNumber, contactName);
        break;
      case 'awaiting_option':
        await this.handleMainMenuOption(phoneNumber, normalizedMessage, state);
        break;
      case 'awaiting_specialty':
        await this.handleSpecialtySelection(phoneNumber, normalizedMessage, state);
        break;
      case 'awaiting_doctor':
        await this.handleDoctorSelection(phoneNumber, normalizedMessage, state);
        break;
      case 'awaiting_confirmation':
        await this.handleAppointmentConfirmation(phoneNumber, normalizedMessage, state);
        break;
      default:
        await this.handleInitial(phoneNumber, contactName);
    }
  }

  /**
   * Process button/list replies
   */
  async processInteractiveReply(
    phoneNumber: string,
    replyId: string,
    messageId: string,
  ): Promise<void> {
    this.logger.log(`Interactive reply from ${phoneNumber}: ${replyId}`);

    await this.whatsAppApi.markAsRead(messageId);

    const state = this.conversations.get(phoneNumber);
    if (!state) {
      await this.handleInitial(phoneNumber, 'Usuario');
      return;
    }
    state.lastActivity = new Date();

    // Route based on reply ID prefix
    if (replyId.startsWith('menu_')) {
      await this.handleMainMenuOption(phoneNumber, replyId.replace('menu_', ''), state);
    } else if (replyId.startsWith('specialty_')) {
      state.data.selectedSpecialty = replyId.replace('specialty_', '');
      await this.handleSpecialtySelection(phoneNumber, state.data.selectedSpecialty, state);
    } else if (replyId.startsWith('doctor_')) {
      state.data.selectedDoctorId = replyId.replace('doctor_', '');
      await this.handleDoctorSelection(phoneNumber, state.data.selectedDoctorId, state);
    } else if (replyId.startsWith('confirm_')) {
      await this.handleAppointmentConfirmation(phoneNumber, replyId.replace('confirm_', ''), state);
    } else if (replyId === 'back_menu') {
      await this.handleInitial(phoneNumber, state.data.contactName || 'Usuario');
    }
  }

  /**
   * Initial greeting and main menu
   */
  private async handleInitial(phoneNumber: string, contactName: string): Promise<void> {
    const state = this.conversations.get(phoneNumber) || {
      step: 'initial',
      data: { contactName },
      lastActivity: new Date(),
    };

    // Check if patient exists
    const patient = await this.findPatientByPhone(phoneNumber);

    let greeting: string;
    if (patient) {
      greeting = `¡Hola ${patient.firstName}! 👋`;
      state.data.patientId = patient._id;
      state.data.patientName = `${patient.firstName} ${patient.lastName}`;
    } else {
      greeting = `¡Hola ${contactName}! 👋`;
    }

    state.step = 'awaiting_option';
    this.conversations.set(phoneNumber, state);

    await this.whatsAppApi.sendButtonMessage(
      phoneNumber,
      `${greeting}\n\nSoy el asistente virtual de *Histora*. ¿En qué puedo ayudarte hoy?`,
      [
        { id: 'menu_citas', title: '📅 Mis Citas' },
        { id: 'menu_agendar', title: '🩺 Agendar Cita' },
        { id: 'menu_medicos', title: '👨‍⚕️ Ver Médicos' },
      ],
      'Histora',
      'Escribe "menu" en cualquier momento para volver aquí',
    );
  }

  /**
   * Handle main menu selection
   */
  private async handleMainMenuOption(
    phoneNumber: string,
    option: string,
    state: ConversationState,
  ): Promise<void> {
    switch (option) {
      case 'citas':
      case '1':
        await this.showUserAppointments(phoneNumber, state);
        break;
      case 'agendar':
      case '2':
        await this.startBookingFlow(phoneNumber, state);
        break;
      case 'medicos':
      case '3':
        await this.showDoctorsList(phoneNumber, state);
        break;
      default:
        await this.whatsAppApi.sendTextMessage(
          phoneNumber,
          'No entendí tu selección. Por favor, elige una opción del menú o escribe "menu" para ver las opciones.',
        );
    }
  }

  /**
   * Show user's appointments
   */
  private async showUserAppointments(phoneNumber: string, state: ConversationState): Promise<void> {
    const patient = await this.findPatientByPhone(phoneNumber);

    if (!patient) {
      await this.whatsAppApi.sendTextMessage(
        phoneNumber,
        '❌ No encontré tu perfil de paciente.\n\nPor favor, regístrate primero en nuestra plataforma o contacta a la clínica.',
      );
      return;
    }

    const appointments = await this.appointmentModel
      .find({
        patientId: patient._id,
        scheduledDate: { $gte: new Date() },
        status: { $in: ['scheduled', 'confirmed'] },
      })
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ scheduledDate: 1 })
      .limit(5)
      .exec();

    if (appointments.length === 0) {
      await this.whatsAppApi.sendButtonMessage(
        phoneNumber,
        '📅 No tienes citas programadas.\n\n¿Te gustaría agendar una cita ahora?',
        [
          { id: 'menu_agendar', title: '✅ Sí, agendar' },
          { id: 'back_menu', title: '↩️ Volver al menú' },
        ],
      );
      return;
    }

    let message = '📅 *Tus próximas citas:*\n\n';

    for (const apt of appointments) {
      const doctor = apt.doctorId as any;
      const date = new Date(apt.scheduledDate);
      const dateStr = date.toLocaleDateString('es-PE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      message += `🩺 *Dr. ${doctor.firstName} ${doctor.lastName}*\n`;
      message += `   📋 ${doctor.specialty || 'Medicina General'}\n`;
      message += `   📆 ${dateStr}\n`;
      message += `   ⏰ ${apt.startTime} - ${apt.endTime}\n`;
      message += `   📍 Estado: ${this.translateStatus(apt.status)}\n\n`;
    }

    await this.whatsAppApi.sendTextMessage(phoneNumber, message);

    await this.whatsAppApi.sendButtonMessage(
      phoneNumber,
      '¿Qué deseas hacer?',
      [
        { id: 'menu_agendar', title: '➕ Nueva cita' },
        { id: 'back_menu', title: '↩️ Menú principal' },
      ],
    );
  }

  /**
   * Start the booking flow - show specialties
   */
  private async startBookingFlow(phoneNumber: string, state: ConversationState): Promise<void> {
    // Get available specialties from doctors
    const specialties = await this.doctorModel.distinct('specialty', { isActive: true });

    if (specialties.length === 0) {
      await this.whatsAppApi.sendTextMessage(
        phoneNumber,
        '❌ No hay médicos disponibles en este momento. Por favor, intenta más tarde.',
      );
      return;
    }

    state.step = 'awaiting_specialty';
    this.conversations.set(phoneNumber, state);

    const sections = [
      {
        title: 'Especialidades',
        rows: specialties.slice(0, 10).map((spec: string) => ({
          id: `specialty_${spec.toLowerCase().replace(/\s/g, '_')}`,
          title: spec,
          description: 'Ver médicos disponibles',
        })),
      },
    ];

    await this.whatsAppApi.sendListMessage(
      phoneNumber,
      '🩺 Agendar Cita',
      'Selecciona la especialidad médica que necesitas:',
      'Ver especialidades',
      sections,
      'Puedes escribir "menu" para volver',
    );
  }

  /**
   * Handle specialty selection - show doctors
   */
  private async handleSpecialtySelection(
    phoneNumber: string,
    specialty: string,
    state: ConversationState,
  ): Promise<void> {
    // Normalize specialty name
    const normalizedSpecialty = specialty.replace(/_/g, ' ');

    const doctors = await this.doctorModel
      .find({
        specialty: { $regex: new RegExp(normalizedSpecialty, 'i') },
        isActive: true,
      })
      .limit(10)
      .exec();

    if (doctors.length === 0) {
      await this.whatsAppApi.sendButtonMessage(
        phoneNumber,
        `❌ No encontré médicos disponibles en ${normalizedSpecialty}.\n\n¿Deseas buscar otra especialidad?`,
        [
          { id: 'menu_agendar', title: '🔍 Otra especialidad' },
          { id: 'back_menu', title: '↩️ Menú principal' },
        ],
      );
      return;
    }

    state.step = 'awaiting_doctor';
    state.data.specialty = normalizedSpecialty;
    state.data.availableDoctors = doctors;
    this.conversations.set(phoneNumber, state);

    let message = `👨‍⚕️ *Médicos en ${normalizedSpecialty}:*\n\n`;

    for (let i = 0; i < doctors.length; i++) {
      const doc = doctors[i];
      const rating = doc.averageRating ? `⭐ ${doc.averageRating.toFixed(1)}` : '⭐ Nuevo';
      const fee = doc.consultationFee
        ? `💰 ${doc.currency || 'PEN'} ${doc.consultationFee}`
        : '';

      message += `*${i + 1}. Dr. ${doc.firstName} ${doc.lastName}*\n`;
      message += `   ${rating} ${fee}\n`;
      if (doc.subspecialties && doc.subspecialties.length > 0) {
        message += `   📋 ${doc.subspecialties.slice(0, 2).join(', ')}\n`;
      }
      message += '\n';
    }

    message += '_Responde con el número del médico para ver disponibilidad_';

    await this.whatsAppApi.sendTextMessage(phoneNumber, message);
  }

  /**
   * Handle doctor selection - show available slots
   */
  private async handleDoctorSelection(
    phoneNumber: string,
    selection: string,
    state: ConversationState,
  ): Promise<void> {
    const doctors = state.data.availableDoctors || [];
    let selectedDoctor: any = null;

    // Check if selection is a number
    const index = parseInt(selection) - 1;
    if (!isNaN(index) && index >= 0 && index < doctors.length) {
      selectedDoctor = doctors[index];
    } else {
      // Try to find by ID
      selectedDoctor = doctors.find((d: any) => d._id.toString() === selection);
    }

    if (!selectedDoctor) {
      await this.whatsAppApi.sendTextMessage(
        phoneNumber,
        '❌ No encontré ese médico. Por favor, responde con el número del médico de la lista.',
      );
      return;
    }

    state.data.selectedDoctor = selectedDoctor;
    state.step = 'awaiting_confirmation';
    this.conversations.set(phoneNumber, state);

    // For now, show a simple confirmation (in production, you'd check actual availability)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const message =
      `✅ *Confirmar Cita*\n\n` +
      `👨‍⚕️ *Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}*\n` +
      `📋 ${selectedDoctor.specialty}\n` +
      `📆 ${dateStr}\n` +
      `⏰ 10:00 AM\n` +
      `💰 ${selectedDoctor.currency || 'PEN'} ${selectedDoctor.consultationFee || 'Consultar'}\n\n` +
      `¿Confirmas esta cita?`;

    await this.whatsAppApi.sendButtonMessage(
      phoneNumber,
      message,
      [
        { id: 'confirm_yes', title: '✅ Confirmar' },
        { id: 'confirm_no', title: '❌ Cancelar' },
        { id: 'back_menu', title: '↩️ Menú' },
      ],
    );
  }

  /**
   * Handle appointment confirmation
   */
  private async handleAppointmentConfirmation(
    phoneNumber: string,
    response: string,
    state: ConversationState,
  ): Promise<void> {
    if (response === 'yes' || response === 'si' || response === 'sí' || response === '1') {
      const patient = await this.findPatientByPhone(phoneNumber);

      if (!patient) {
        await this.whatsAppApi.sendTextMessage(
          phoneNumber,
          '❌ Para agendar citas necesitas estar registrado.\n\n' +
            'Por favor, regístrate en nuestra plataforma web o contacta a la clínica.',
        );
        return;
      }

      // In production, create the actual appointment here
      // For now, just send confirmation message

      const doctor = state.data.selectedDoctor;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await this.whatsAppApi.sendTextMessage(
        phoneNumber,
        `🎉 *¡Cita Agendada!*\n\n` +
          `Tu cita ha sido reservada:\n\n` +
          `👨‍⚕️ Dr. ${doctor.firstName} ${doctor.lastName}\n` +
          `📋 ${doctor.specialty}\n` +
          `📆 ${tomorrow.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}\n` +
          `⏰ 10:00 AM\n\n` +
          `📱 Te enviaremos un recordatorio 24 horas antes.\n\n` +
          `Escribe "menu" para volver al menú principal.`,
      );

      // Reset conversation
      state.step = 'initial';
      state.data = { contactName: state.data.contactName };
      this.conversations.set(phoneNumber, state);
    } else {
      await this.whatsAppApi.sendButtonMessage(
        phoneNumber,
        'Cita cancelada. ¿Qué deseas hacer?',
        [
          { id: 'menu_agendar', title: '🔄 Intentar de nuevo' },
          { id: 'back_menu', title: '↩️ Menú principal' },
        ],
      );

      state.step = 'awaiting_option';
      this.conversations.set(phoneNumber, state);
    }
  }

  /**
   * Show list of doctors
   */
  private async showDoctorsList(phoneNumber: string, state: ConversationState): Promise<void> {
    const doctors = await this.doctorModel
      .find({ isActive: true })
      .limit(10)
      .exec();

    if (doctors.length === 0) {
      await this.whatsAppApi.sendTextMessage(
        phoneNumber,
        '❌ No hay médicos disponibles en este momento.',
      );
      return;
    }

    let message = '👨‍⚕️ *Nuestros Médicos:*\n\n';

    for (const doc of doctors) {
      const rating = doc.averageRating ? `⭐ ${doc.averageRating.toFixed(1)}` : '⭐ Nuevo';
      const fee = doc.consultationFee
        ? `💰 ${doc.currency || 'PEN'} ${doc.consultationFee}`
        : '';

      message += `*Dr. ${doc.firstName} ${doc.lastName}*\n`;
      message += `📋 ${doc.specialty || 'Medicina General'}\n`;
      message += `${rating} ${fee}\n\n`;
    }

    await this.whatsAppApi.sendTextMessage(phoneNumber, message);

    await this.whatsAppApi.sendButtonMessage(
      phoneNumber,
      '¿Te gustaría agendar una cita?',
      [
        { id: 'menu_agendar', title: '📅 Agendar cita' },
        { id: 'back_menu', title: '↩️ Menú principal' },
      ],
    );
  }

  /**
   * Find patient by phone number
   */
  private async findPatientByPhone(phone: string): Promise<PatientDocument | null> {
    // Normalize phone number for search
    const normalizedPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    const phoneVariants = [
      normalizedPhone,
      '+' + normalizedPhone,
      normalizedPhone.replace(/^51/, ''),
      '+51' + normalizedPhone.replace(/^51/, ''),
    ];

    return this.patientModel.findOne({
      $or: [
        { phone: { $in: phoneVariants } },
        { mobile: { $in: phoneVariants } },
      ],
    }).exec();
  }

  /**
   * Translate appointment status to Spanish
   */
  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      scheduled: '📋 Programada',
      confirmed: '✅ Confirmada',
      completed: '✔️ Completada',
      cancelled: '❌ Cancelada',
      'no-show': '⚠️ No asistió',
    };
    return translations[status] || status;
  }

  /**
   * Clean up old conversations (older than 24 hours)
   */
  private cleanupOldConversations(): void {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [phone, state] of this.conversations.entries()) {
      if (now.getTime() - state.lastActivity.getTime() > maxAge) {
        this.conversations.delete(phone);
      }
    }

    this.logger.log(`Cleaned up conversations. Active: ${this.conversations.size}`);
  }
}
