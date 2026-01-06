import { Component, input } from '@angular/core';

interface Appointment {
  name: string;
  diseases: string;
  date: string;
  time: string;
  imageUrl: string;
}

@Component({
  selector: 'app-appointment-widget',
  imports: [],
  templateUrl: './appointment-widget.component.html',
  styleUrl: './appointment-widget.component.scss',
})
export class AppointmentWidgetComponent {
  readonly appointments = input<Appointment[]>([]);
}
