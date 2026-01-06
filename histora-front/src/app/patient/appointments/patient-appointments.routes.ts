import { Route } from "@angular/router";
import { Page404Component } from "../../authentication/page404/page404.component";
import { UpcomingAppointmentComponent } from "./upcoming-appointment/upcoming-appointment.component";
import { PastAppointmentComponent } from "./past-appointment/past-appointment.component";
import { TodayAppointmentComponent } from "./today-appointment/today-appointment.component";
import { BookAppointmentComponent } from "./book-appointment/book-appointment.component";

export const PATIENT_APPOINTMENT_ROUTE: Route[] = [
  {
    path: "book",
    component: BookAppointmentComponent,
  },
  {
    path: "today",
    component: TodayAppointmentComponent,
  },
  {
    path: "upcoming",
    component: UpcomingAppointmentComponent,
  },
  {
    path: "past",
    component: PastAppointmentComponent,
  },
  { path: "**", component: Page404Component },
];

