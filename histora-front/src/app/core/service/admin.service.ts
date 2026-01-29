import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, interval, Subscription, BehaviorSubject } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { environment } from 'environments/environment';

// ============= DASHBOARD INTERFACES =============

export interface NurseStats {
  total: number;
  active: number;
  available: number;
  pendingVerification: number;
  verified: number;
}

export interface ServiceStats {
  total: number;
  pending: number;
  accepted: number;
  inProgress: number;
  completedToday: number;
  cancelledToday: number;
  completedThisWeek: number;
  revenueThisWeek: number;
}

export interface SafetyStats {
  activePanicAlerts: number;
  activeEmergencies: number;
  pendingIncidents: number;
  resolvedThisMonth: number;
}

export interface RatingsStats {
  averageRating: number;
  totalReviews: number;
  lowRatedCount: number;
  excellentCount: number;
}

export interface ReniecStats {
  used: number;
  limit: number;
  remaining: number;
  provider: string;
}

export interface BusinessMetrics {
  mrr: number;
  mrrGrowth: number;
  gmv: number;
  gmvGrowth: number;
  totalUsers: number;
  newUsersThisMonth: number;
  churnRate: number;
  arpu: number;
}

export interface ModerationStats {
  atRiskNurses: number;
  atRiskPatients: number;
  pendingReports: number;
  suspendedUsers: number;
  recentComplaints: number;
}

export interface AtRiskUser {
  id: string;
  type: 'nurse' | 'patient';
  name: string;
  avatar?: string;
  riskScore: number;
  riskReasons: string[];
  lastIncidentAt?: Date;
  totalComplaints: number;
  averageRating?: number;
}

export interface DashboardStats {
  nurses: NurseStats;
  services: ServiceStats;
  safety: SafetyStats;
  ratings: RatingsStats;
  reniec: ReniecStats;
  business?: BusinessMetrics;
  moderation?: ModerationStats;
}

export interface PanicAlert {
  id: string;
  nurseId: string;
  nurseName: string;
  nurseAvatar: string;
  level: 'help_needed' | 'emergency';
  status: 'active' | 'acknowledged' | 'responding' | 'resolved' | 'false_alarm';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  message?: string;
  serviceRequestId?: string;
  createdAt: Date;
  policeContacted: boolean;
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  severity?: 'info' | 'warning' | 'critical';
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PendingVerification {
  id: string;
  nurseId: string;
  nurseName: string;
  nurseAvatar: string;
  cepNumber: string;
  dniNumber: string;
  status: string;
  waitingDays: number;
  createdAt: Date;
  hasCepValidation: boolean;
  cepPhotoUrl?: string;
}

export interface ServiceChartData {
  date: string;
  completed: number;
  cancelled: number;
  revenue: number;
}

export interface LowRatedReview {
  id: string;
  serviceRequestId: string;
  patientName: string;
  nurseName: string;
  rating: number;
  review: string;
  reviewedAt: Date;
  hasResponse: boolean;
}

export interface ExpiringVerification {
  nurseId: string;
  nurseName: string;
  cepNumber: string;
  lastVerifiedAt: Date;
  daysUntilExpiry: number;
  hasActiveServices: boolean;
}

// ============= NURSE MANAGEMENT INTERFACES =============

export interface AdminNurse {
  id: string;
  userId: string;
  cepNumber: string;
  cepVerified: boolean;
  cepVerifiedAt?: Date;
  verificationStatus: string;
  specialties: string[];
  bio?: string;
  yearsOfExperience: number;
  serviceRadius: number;
  isAvailable: boolean;
  isActive: boolean;
  averageRating: number;
  totalReviews: number;
  totalServicesCompleted: number;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    isActive?: boolean;
  } | null;
  location?: {
    address?: string;
    district?: string;
    city?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface NurseListResponse {
  data: AdminNurse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface NurseQueryParams {
  search?: string;
  verificationStatus?: string;
  status?: string;
  availability?: string;
  district?: string;
  page?: number;
  limit?: number;
}

export interface UpdateNurseDto {
  specialties?: string[];
  bio?: string;
  yearsOfExperience?: number;
  serviceRadius?: number;
  extraChargePerKm?: number;
  minimumServiceFee?: number;
  isActive?: boolean;
  isAvailable?: boolean;
}

// ============= PATIENT MANAGEMENT INTERFACES =============

export interface AdminPatient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  authProvider: string;
  totalServicesRequested: number;
  totalServicesCompleted: number;
  createdAt: Date;
  lastServiceAt?: Date;
}

export interface PatientListResponse {
  data: AdminPatient[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PatientQueryParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// ============= USER MANAGEMENT INTERFACES =============

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
export class AdminService implements OnDestroy {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  // Signals for reactive dashboard data
  private _dashboardStats = signal<DashboardStats | null>(null);
  private _panicAlerts = signal<PanicAlert[]>([]);
  private _activity = signal<ActivityItem[]>([]);
  private _pendingVerifications = signal<PendingVerification[]>([]);

  // Public readonly signals
  readonly dashboardStats = this._dashboardStats.asReadonly();
  readonly panicAlerts = this._panicAlerts.asReadonly();
  readonly activity = this._activity.asReadonly();
  readonly pendingVerifications = this._pendingVerifications.asReadonly();

  // Computed values
  readonly hasActiveEmergencies = computed(() => {
    const stats = this._dashboardStats();
    return stats ? stats.safety.activeEmergencies > 0 : false;
  });

  readonly hasCriticalAlerts = computed(() => {
    const alerts = this._panicAlerts();
    return alerts.some(a => a.level === 'emergency' && a.status === 'active');
  });

  // Polling subscriptions
  private alertsPolling$: Subscription | null = null;
  private statsPolling$: Subscription | null = null;
  private isPolling = false;

  constructor(private http: HttpClient) {}

  ngOnDestroy(): void {
    this.stopPolling();
  }

  // ============= DASHBOARD API METHODS =============

  /**
   * Get consolidated dashboard statistics
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`).pipe(
      tap(stats => this._dashboardStats.set(stats))
    );
  }

  /**
   * Get active panic alerts
   */
  getActivePanicAlerts(): Observable<PanicAlert[]> {
    return this.http.get<PanicAlert[]>(`${this.apiUrl}/dashboard/alerts`).pipe(
      tap(alerts => this._panicAlerts.set(alerts))
    );
  }

  /**
   * Get recent activity feed
   */
  getRecentActivity(limit = 20): Observable<ActivityItem[]> {
    return this.http.get<ActivityItem[]>(`${this.apiUrl}/dashboard/activity`, {
      params: { limit: limit.toString() }
    }).pipe(
      tap(activity => this._activity.set(activity))
    );
  }

  /**
   * Get pending verifications
   */
  getPendingVerificationsList(): Observable<PendingVerification[]> {
    return this.http.get<PendingVerification[]>(`${this.apiUrl}/dashboard/verifications/pending`).pipe(
      tap(verifications => this._pendingVerifications.set(verifications))
    );
  }

  /**
   * Get service chart data (last 7 days)
   */
  getServiceChartData(): Observable<ServiceChartData[]> {
    return this.http.get<ServiceChartData[]>(`${this.apiUrl}/dashboard/services/chart`);
  }

  /**
   * Get low rated reviews
   */
  getLowRatedReviews(): Observable<LowRatedReview[]> {
    return this.http.get<LowRatedReview[]>(`${this.apiUrl}/dashboard/reviews/low-rated`);
  }

  /**
   * Get expiring verifications
   */
  getExpiringVerifications(): Observable<ExpiringVerification[]> {
    return this.http.get<ExpiringVerification[]>(`${this.apiUrl}/dashboard/verifications/expiring`);
  }

  /**
   * Get business metrics (MRR, GMV, churn, etc.)
   */
  getBusinessMetrics(): Observable<BusinessMetrics> {
    return this.http.get<BusinessMetrics>(`${this.apiUrl}/dashboard/metrics/business`);
  }

  /**
   * Get moderation statistics
   */
  getModerationStats(): Observable<ModerationStats> {
    return this.http.get<ModerationStats>(`${this.apiUrl}/dashboard/moderation/stats`);
  }

  /**
   * Get users at risk for moderation
   */
  getAtRiskUsers(limit = 10): Observable<AtRiskUser[]> {
    return this.http.get<AtRiskUser[]>(`${this.apiUrl}/dashboard/moderation/at-risk`, {
      params: { limit: limit.toString() }
    });
  }

  // ============= POLLING METHODS =============

  /**
   * Start polling for dashboard data with different intervals
   * - Alerts: every 10 seconds
   * - Stats: every 30 seconds
   */
  startPolling(): void {
    if (this.isPolling) return;
    this.isPolling = true;

    // Poll alerts every 10 seconds
    this.alertsPolling$ = interval(10000).pipe(
      switchMap(() => this.getActivePanicAlerts()),
      catchError(err => {
        console.error('Error polling alerts:', err);
        return [];
      })
    ).subscribe();

    // Poll stats every 30 seconds
    this.statsPolling$ = interval(30000).pipe(
      switchMap(() => this.getDashboardStats()),
      catchError(err => {
        console.error('Error polling stats:', err);
        return [];
      })
    ).subscribe();
  }

  /**
   * Stop all polling
   */
  stopPolling(): void {
    this.isPolling = false;
    this.alertsPolling$?.unsubscribe();
    this.statsPolling$?.unsubscribe();
    this.alertsPolling$ = null;
    this.statsPolling$ = null;
  }

  /**
   * Load all dashboard data at once
   */
  loadDashboardData(): void {
    this.getDashboardStats().subscribe();
    this.getActivePanicAlerts().subscribe();
    this.getRecentActivity().subscribe();
    this.getPendingVerificationsList().subscribe();
  }

  // ============= USER MANAGEMENT METHODS =============

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

  // ============= NURSE VERIFICATION METHODS =============

  private readonly nursesApiUrl = `${environment.apiUrl}/nurses`;

  /**
   * Get nurse verification statistics
   */
  getNurseVerificationStats(): Observable<{
    pending: number;
    underReview: number;
    approved: number;
    rejected: number;
    total: number;
  }> {
    return this.http.get<{
      pending: number;
      underReview: number;
      approved: number;
      rejected: number;
      total: number;
    }>(`${this.nursesApiUrl}/admin/verifications/stats`);
  }

  /**
   * Get paginated list of nurse verifications
   */
  getNurseVerifications(params: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Observable<{
    verifications: unknown[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    let httpParams = new HttpParams();

    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<{
      verifications: unknown[];
      total: number;
      page: number;
      totalPages: number;
    }>(`${this.nursesApiUrl}/admin/verifications`, { params: httpParams });
  }

  /**
   * Get nurse verification detail
   */
  getNurseVerificationDetail(verificationId: string): Observable<unknown> {
    return this.http.get(`${this.nursesApiUrl}/admin/verifications/${verificationId}`);
  }

  /**
   * Mark verification as under review
   */
  markNurseVerificationUnderReview(verificationId: string): Observable<unknown> {
    return this.http.patch(
      `${this.nursesApiUrl}/admin/verifications/${verificationId}/under-review`,
      {}
    );
  }

  /**
   * Approve or reject nurse verification
   */
  reviewNurseVerification(
    verificationId: string,
    review: {
      status: 'approved' | 'rejected';
      reviewNotes?: string;
      rejectionReason?: string;
    }
  ): Observable<unknown> {
    return this.http.patch(
      `${this.nursesApiUrl}/admin/verifications/${verificationId}/review`,
      review
    );
  }

  // ============= NURSE MANAGEMENT METHODS =============

  /**
   * Get paginated list of nurses with filters
   */
  getNurses(params: NurseQueryParams = {}): Observable<NurseListResponse> {
    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.verificationStatus) {
      httpParams = httpParams.set('verificationStatus', params.verificationStatus);
    }
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.availability) {
      httpParams = httpParams.set('availability', params.availability);
    }
    if (params.district) {
      httpParams = httpParams.set('district', params.district);
    }
    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<NurseListResponse>(`${this.apiUrl}/nurses`, { params: httpParams });
  }

  /**
   * Get single nurse by ID
   */
  getNurse(id: string): Observable<AdminNurse> {
    return this.http.get<AdminNurse>(`${this.apiUrl}/nurses/${id}`);
  }

  /**
   * Update nurse
   */
  updateNurse(id: string, data: UpdateNurseDto): Observable<{ id: string; message: string }> {
    return this.http.patch<{ id: string; message: string }>(`${this.apiUrl}/nurses/${id}`, data);
  }

  /**
   * Delete nurse (soft delete)
   */
  deleteNurse(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/nurses/${id}`);
  }

  /**
   * Toggle nurse active status
   */
  toggleNurseStatus(id: string): Observable<{ id: string; isActive: boolean; isAvailable: boolean; message: string }> {
    return this.http.patch<{ id: string; isActive: boolean; isAvailable: boolean; message: string }>(
      `${this.apiUrl}/nurses/${id}/toggle-status`,
      {}
    );
  }

  /**
   * Toggle nurse availability
   */
  toggleNurseAvailability(id: string): Observable<{ id: string; isAvailable: boolean; message: string }> {
    return this.http.patch<{ id: string; isAvailable: boolean; message: string }>(
      `${this.apiUrl}/nurses/${id}/toggle-availability`,
      {}
    );
  }

  // ============= PATIENT MANAGEMENT METHODS =============

  /**
   * Get paginated list of patients with filters
   */
  getPatients(params: PatientQueryParams = {}): Observable<PatientListResponse> {
    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
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

    return this.http.get<PatientListResponse>(`${this.apiUrl}/patients`, { params: httpParams });
  }

  /**
   * Get single patient by ID
   */
  getPatient(id: string): Observable<AdminPatient> {
    return this.http.get<AdminPatient>(`${this.apiUrl}/patients/${id}`);
  }

  /**
   * Toggle patient active status
   */
  togglePatientStatus(id: string): Observable<{ id: string; isActive: boolean; status: string; message: string }> {
    return this.http.patch<{ id: string; isActive: boolean; status: string; message: string }>(
      `${this.apiUrl}/patients/${id}/toggle-status`,
      {}
    );
  }

  /**
   * Delete patient (soft delete)
   */
  deletePatient(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/patients/${id}`);
  }
}
