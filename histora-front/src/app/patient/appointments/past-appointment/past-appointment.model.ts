import { formatDate } from '@angular/common';

export class PastAppointment {
  id: number;
  img: string;
  email: string;
  date: string;
  time: string;
  mobile: string;
  doctor: string;
  injury: string;
  appointmentType: string;
  status: string;
  location: string;
  notes: string;
  prescriptions: string;
  nextAppointment: string;
  createdAt: string;
  modifiedAt: string;

  constructor(appointment: Partial<PastAppointment>) {
    this.id = appointment.id || this.getRandomID();
    this.img = appointment.img || 'assets/images/user/new.jpg';
    this.email = appointment.email || '';
    this.date = appointment.date || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.time = appointment.time || '';
    this.mobile = appointment.mobile || '';
    this.doctor = appointment.doctor || '';
    this.injury = appointment.injury || '';
    this.appointmentType = appointment.appointmentType || '';
    this.status = appointment.status || 'Completed';
    this.location = appointment.location || '';
    this.notes = appointment.notes || '';
    this.prescriptions = appointment.prescriptions || '';
    this.nextAppointment = appointment.nextAppointment || '';
    this.createdAt =
      appointment.createdAt ||
      formatDate(new Date(), 'yyyy-MM-ddTHH:mm:ssZ', 'en');
    this.modifiedAt =
      appointment.modifiedAt ||
      formatDate(new Date(), 'yyyy-MM-ddTHH:mm:ssZ', 'en');
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
