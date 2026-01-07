import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface UploadProfilePhotoDto {
  imageData: string; // base64 encoded image data
  mimeType?: string;
}

export interface FileResponseDto {
  success: boolean;
  url?: string;
  thumbnailUrl?: string;
  publicId?: string;
  error?: string;
}

export interface UploadCvDto {
  fileData: string; // base64 encoded file data
  mimeType: string;
}

@Injectable({
  providedIn: 'root',
})
export class UploadsService {
  private readonly API_URL = `${environment.apiUrl}/uploads`;

  constructor(private http: HttpClient) {}

  uploadProfilePhoto(dto: UploadProfilePhotoDto): Observable<FileResponseDto> {
    return this.http
      .post<FileResponseDto>(`${this.API_URL}/profile-photo`, dto)
      .pipe(catchError(this.handleError));
  }

  deleteFile(publicId: string): Observable<{ success: boolean }> {
    return this.http
      .delete<{ success: boolean }>(`${this.API_URL}`, { params: { publicId } })
      .pipe(catchError(this.handleError));
  }

  uploadDoctorCv(fileData: string, mimeType: string): Observable<FileResponseDto> {
    const dto: UploadCvDto = { fileData, mimeType };
    return this.http
      .post<FileResponseDto>(`${this.API_URL}/doctor/cv`, dto)
      .pipe(catchError(this.handleError));
  }

  deleteDoctorCv(): Observable<{ success: boolean }> {
    return this.http
      .delete<{ success: boolean }>(`${this.API_URL}/doctor/cv`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: unknown): Observable<never> {
    console.error('UploadsService error:', error);
    return throwError(() => error);
  }
}
