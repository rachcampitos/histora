import { formatDate } from '@angular/common';
export class UpcomingAppointment {
  id: number;
  doctor: string;
  date: string;
  time: string;
  injury: string;
  location: string;
  status: string;
  notes: string;
  constructor(appointment: UpcomingAppointment) {
    {
      this.id = appointment.id || this.getRandomID();
      this.doctor = appointment.doctor || '';
      this.date = formatDate(new Date(), 'yyyy-MM-dd', 'en') || '';
      this.time = appointment.time || '';
      this.injury = appointment.injury || '';
      this.location = appointment.location || '';
      this.status = appointment.status || '';
      this.notes = appointment.notes || '';
    }
  }
  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
