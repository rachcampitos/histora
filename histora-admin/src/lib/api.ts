import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.historahealth.com';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  logout: async () => {
    await api.post('/auth/logout');
  },
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// Dashboard endpoints
export const dashboardApi = {
  getStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },
  getRecentActivity: async (limit = 20) => {
    const response = await api.get(`/admin/dashboard/activity?limit=${limit}`);
    return response.data;
  },
  getAlerts: async () => {
    const response = await api.get('/admin/dashboard/alerts');
    return response.data;
  },
  getServicesChart: async (period: '7d' | '30d' = '7d') => {
    const response = await api.get(`/admin/dashboard/services/chart?period=${period}`);
    return response.data;
  },
  getLowRatedReviews: async () => {
    const response = await api.get('/admin/dashboard/reviews/low-rated');
    return response.data;
  },
  getExpiringVerifications: async () => {
    const response = await api.get('/admin/dashboard/verifications/expiring');
    return response.data;
  },
};

// Nurses endpoints
export const nursesApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    verificationStatus?: string;
    availability?: string;
    district?: string;
    search?: string;
  }) => {
    const response = await api.get('/admin/nurses', { params });
    // Backend returns { data: [...], pagination: {...} }
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/admin/nurses/${id}`);
    return response.data;
  },
  getPendingVerifications: async () => {
    const response = await api.get('/admin/dashboard/verifications/pending');
    return response.data;
  },
  toggleStatus: async (id: string) => {
    const response = await api.patch(`/admin/nurses/${id}/toggle-status`);
    return response.data;
  },
  toggleAvailability: async (id: string) => {
    const response = await api.patch(`/admin/nurses/${id}/toggle-availability`);
    return response.data;
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const response = await api.patch(`/admin/nurses/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/admin/nurses/${id}`);
    return response.data;
  },
};

// Services endpoints
export const servicesApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    category?: string;
    district?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    minRating?: number;
    maxRating?: number;
  }) => {
    const response = await api.get('/admin/services', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/admin/services/${id}`);
    return response.data;
  },
  getAnalytics: async () => {
    const response = await api.get('/admin/services/analytics');
    return response.data;
  },
  adminAction: async (id: string, action: 'cancel' | 'refund', reason?: string, adminNotes?: string) => {
    const response = await api.patch(`/admin/services/${id}/action`, {
      action,
      reason,
      adminNotes,
    });
    return response.data;
  },
};

// Patients endpoints
export const patientsApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const response = await api.get('/admin/patients', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/admin/patients/${id}`);
    return response.data;
  },
};

// Finance/Payments endpoints
export const financeApi = {
  getPayments: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    method?: string;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: number;
    maxAmount?: number;
  }) => {
    const response = await api.get('/admin/payments', { params });
    return response.data;
  },
  getPaymentById: async (id: string) => {
    const response = await api.get(`/admin/payments/${id}`);
    return response.data;
  },
  getAnalytics: async () => {
    const response = await api.get('/admin/payments/analytics');
    return response.data;
  },
  refundPayment: async (id: string, reason?: string, partialAmount?: number) => {
    const response = await api.post(`/admin/payments/${id}/refund`, {
      reason,
      partialAmount,
    });
    return response.data;
  },
  // Legacy aliases
  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
    type?: string;
  }) => {
    // Map old params to new format
    const newParams = {
      page: params?.page,
      limit: params?.limit,
      search: params?.search,
      dateFrom: params?.startDate,
      dateTo: params?.endDate,
      method: params?.type,
    };
    const response = await api.get('/admin/payments', { params: newParams });
    return response.data;
  },
  getMetrics: async () => {
    const response = await api.get('/admin/payments/analytics');
    return response.data;
  },
  getRevenue: async () => {
    const response = await api.get('/admin/payments/analytics');
    return response.data;
  },
};

// Coupons endpoints
export const couponsApi = {
  getAll: async () => {
    const response = await api.get('/admin/coupons');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/admin/coupons/${id}`);
    return response.data;
  },
  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/admin/coupons', data);
    return response.data;
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const response = await api.patch(`/admin/coupons/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/admin/coupons/${id}`);
    return response.data;
  },
};

// Analytics endpoints
export const analyticsApi = {
  getMetrics: async (period: '7d' | '30d' | '90d' = '30d') => {
    const response = await api.get(`/admin/analytics/metrics?period=${period}`);
    return response.data;
  },
  getServicesByCategory: async (period: '7d' | '30d' | '90d' = '30d') => {
    const response = await api.get(`/admin/analytics/services-by-category?period=${period}`);
    return response.data;
  },
  getServicesByDistrict: async (period: '7d' | '30d' | '90d' = '30d') => {
    const response = await api.get(`/admin/analytics/services-by-district?period=${period}`);
    return response.data;
  },
  getHourlyActivity: async (period: '7d' | '30d' | '90d' = '30d') => {
    const response = await api.get(`/admin/analytics/hourly-activity?period=${period}`);
    return response.data;
  },
  getConversionFunnel: async (period: '7d' | '30d' | '90d' = '30d') => {
    const response = await api.get(`/admin/analytics/conversion-funnel?period=${period}`);
    return response.data;
  },
  getTopNurses: async (period: '7d' | '30d' | '90d' = '30d') => {
    const response = await api.get(`/admin/analytics/top-nurses?period=${period}`);
    return response.data;
  },
};

// Marketing endpoints (legacy alias)
export const marketingApi = couponsApi;

// Notifications endpoints
export const notificationsApi = {
  getAll: async (params?: { unreadOnly?: boolean }) => {
    const response = await api.get('/admin/notifications', { params });
    return response.data;
  },
  markAsRead: async (id: string) => {
    const response = await api.patch(`/admin/notifications/${id}/read`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.post('/admin/notifications/mark-all-read');
    return response.data;
  },
};

// Verifications endpoints (CEP)
export const verificationsApi = {
  getAll: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/nurses/admin/verifications', { params });
    // Returns { data: [...], pagination: {...} }
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/nurses/admin/verifications/${id}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/nurses/admin/verifications/stats');
    return response.data;
  },
  getPending: async () => {
    const response = await api.get('/admin/dashboard/verifications/pending');
    return response.data;
  },
  markUnderReview: async (id: string) => {
    const response = await api.patch(`/nurses/admin/verifications/${id}/under-review`);
    return response.data;
  },
  review: async (id: string, status: 'approved' | 'rejected', notes: string) => {
    const response = await api.patch(`/nurses/admin/verifications/${id}/review`, {
      status,
      reviewNotes: notes,
    });
    return response.data;
  },
};

// Admin Users endpoints
export const usersApi = {
  getAll: async (params?: { role?: string; status?: string; search?: string }) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },
  create: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    role: string;
    password: string;
  }) => {
    const response = await api.post('/admin/users', data);
    return response.data;
  },
  update: async (id: string, data: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
  }>) => {
    const response = await api.patch(`/admin/users/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
  toggleStatus: async (id: string) => {
    const response = await api.patch(`/admin/users/${id}/toggle-status`);
    return response.data;
  },
  resetPassword: async (id: string) => {
    const response = await api.post(`/admin/users/${id}/reset-password`);
    return response.data;
  },
};

// Moderation endpoints
export const moderationApi = {
  getAtRiskUsers: async () => {
    const response = await api.get('/admin/dashboard/moderation/at-risk');
    return response.data;
  },
  getLowReviews: async () => {
    const response = await api.get('/admin/dashboard/reviews/low-rated');
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/admin/dashboard/moderation/stats');
    return response.data;
  },
  sendWarning: async (userId: string, message: string) => {
    const response = await api.post(`/admin/moderation/${userId}/warning`, { message });
    return response.data;
  },
  suspendUser: async (userId: string) => {
    const response = await api.post(`/admin/moderation/${userId}/suspend`);
    return response.data;
  },
  respondToReview: async (reviewId: string, response: string) => {
    const res = await api.post(`/admin/reviews/${reviewId}/respond`, { response });
    return res.data;
  },
};

// Subscriptions endpoints
export const subscriptionsApi = {
  getAll: async (params?: { status?: string; plan?: string }) => {
    const response = await api.get('/admin/subscriptions', { params });
    return response.data;
  },
  getMetrics: async () => {
    const response = await api.get('/admin/subscriptions/metrics');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/admin/subscriptions/${id}`);
    return response.data;
  },
};

// Reports endpoints
export const reportsApi = {
  getMetrics: async (period: string) => {
    const response = await api.get(`/admin/reports/metrics?period=${period}`);
    return response.data;
  },
  getServicesChart: async (period: string) => {
    const response = await api.get(`/admin/dashboard/services/chart?period=${period}`);
    return response.data;
  },
  getRegionData: async (period: string) => {
    const response = await api.get(`/admin/reports/by-region?period=${period}`);
    return response.data;
  },
  getCategoryData: async (period: string) => {
    const response = await api.get(`/admin/reports/by-category?period=${period}`);
    return response.data;
  },
  getTopNurses: async (period: string) => {
    const response = await api.get(`/admin/analytics/top-nurses?period=${period}`);
    return response.data;
  },
  exportPdf: async (period: string) => {
    const response = await api.get(`/admin/reports/export/pdf?period=${period}`, {
      responseType: 'blob',
    });
    return response.data;
  },
  exportExcel: async (period: string) => {
    const response = await api.get(`/admin/reports/export/excel?period=${period}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;
