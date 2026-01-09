import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  clinic?: string;
  clinicId?: string;
  status: string;
  isActive: boolean;
  isEmailVerified: boolean;
  authProvider: string;
  avatar?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListResponse {
  data: AdminUser[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  clinicId?: string;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  clinicId?: string;
}

export interface UserQueryParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  /**
   * Get paginated list of users with filters
   */
  getUsers(params: UserQueryParams = {}): Observable<UserListResponse> {
    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.role) {
      httpParams = httpParams.set('role', params.role);
    }
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<UserListResponse>(`${this.apiUrl}/users`, { params: httpParams });
  }

  /**
   * Get single user by ID
   */
  getUser(id: string): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiUrl}/users/${id}`);
  }

  /**
   * Create new user
   */
  createUser(user: CreateUserDto): Observable<{ id: string; message: string }> {
    return this.http.post<{ id: string; message: string }>(`${this.apiUrl}/users`, user);
  }

  /**
   * Update user
   */
  updateUser(id: string, user: UpdateUserDto): Observable<{ id: string; message: string }> {
    return this.http.patch<{ id: string; message: string }>(`${this.apiUrl}/users/${id}`, user);
  }

  /**
   * Delete user (soft delete)
   */
  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${id}`);
  }

  /**
   * Toggle user active status
   */
  toggleUserStatus(id: string): Observable<{ id: string; isActive: boolean; status: string; message: string }> {
    return this.http.patch<{ id: string; isActive: boolean; status: string; message: string }>(
      `${this.apiUrl}/users/${id}/toggle-status`,
      {}
    );
  }

  /**
   * Reset user password
   */
  resetUserPassword(id: string): Observable<{ message: string; temporaryPassword?: string }> {
    return this.http.post<{ message: string; temporaryPassword?: string }>(
      `${this.apiUrl}/users/${id}/reset-password`,
      {}
    );
  }
}
