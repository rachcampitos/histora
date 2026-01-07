import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface Education {
  institution: string;
  degree: string;
  year?: number;
  country?: string;
}

export interface Experience {
  position: string;
  institution: string;
  startYear?: number;
  endYear?: number;
  currentlyWorking?: boolean;
  description?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  year?: number;
  expiryYear?: number;
  licenseNumber?: string;
}

export interface Skill {
  name: string;
  percentage: number;
}

export interface DoctorProfile {
  _id: string;
  userId: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  specialty: string;
  subspecialties?: string[];
  licenseNumber?: string;
  phone?: string;
  email?: string;
  bio?: string;
  education?: Education[];
  experience?: Experience[];
  certifications?: Certification[];
  skills?: Skill[];
  profileImage?: string;
  cvUrl?: string;
  cvFormat?: string;
  isPublicProfile: boolean;
  averageRating: number;
  totalReviews: number;
  consultationFee?: number;
  currency?: string;
  address?: string;
  city?: string;
  country?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicDoctorFilters {
  specialty?: string;
  minRating?: number;
  search?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DoctorsService {
  private readonly apiUrl = `${environment.apiUrl}/doctors`;
  private readonly publicApiUrl = `${environment.apiUrl}/public/doctors`;

  constructor(private http: HttpClient) {}

  // Get current doctor's profile
  getMyProfile(): Observable<DoctorProfile> {
    return this.http.get<DoctorProfile>(`${this.apiUrl}/me`);
  }

  // Update current doctor's profile
  updateMyProfile(data: Partial<DoctorProfile>): Observable<DoctorProfile> {
    return this.http.patch<DoctorProfile>(`${this.apiUrl}/me`, data);
  }

  // Public: Get all public doctors
  getPublicDoctors(filters?: PublicDoctorFilters): Observable<DoctorProfile[]> {
    let params = new HttpParams();
    if (filters?.specialty) {
      params = params.set('specialty', filters.specialty);
    }
    if (filters?.minRating) {
      params = params.set('minRating', filters.minRating.toString());
    }
    return this.http.get<DoctorProfile[]>(this.publicApiUrl, { params });
  }

  // Public: Get doctor by ID
  getPublicDoctorById(id: string): Observable<DoctorProfile> {
    return this.http.get<DoctorProfile>(`${this.publicApiUrl}/${id}`);
  }

  // Get full name
  getFullName(doctor: DoctorProfile): string {
    return `Dr. ${doctor.firstName} ${doctor.lastName}`;
  }
}
