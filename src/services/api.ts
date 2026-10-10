import {
  Canteen,
  MenuItem,
  Order,
  UserProfile,
  InAppNotification,
  FeedbackReview,
  CanteenAnalytics,
  OrderStatus,
} from '../types';

let currentUserId = 'user_student_1';

export const setCurrentUserHeaderId = (userId: string) => {
  currentUserId = userId;
};

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-user-id': currentUserId,
});

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `/api${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

export const api = {
  // Auth
  getCurrentUser: () => request<{ success: boolean; user: UserProfile }>('/auth/me'),
  getDemoUsers: () => request<{ success: boolean; users: UserProfile[] }>('/auth/demo-users'),
  login: (email: string, role?: string) =>
    request<{ success: boolean; user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),
  register: (payload: { name: string; email: string; role: string; studentId?: string; canteenId?: string }) =>
    request<{ success: boolean; user: UserProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Canteens
  getCanteens: () => request<{ success: boolean; canteens: Canteen[] }>('/canteens'),
  getCanteenComparison: () =>
    request<{ success: boolean; canteenA: Canteen; canteenB: Canteen; recommendation: string; lastUpdated: string }>(
      '/canteens/comparison'
    ),
  updateCanteenStatus: (canteenId: string, isOpen: boolean, lunchActive?: boolean) =>
    request<{ success: boolean; canteen: Canteen }>(`/canteens/${canteenId}/status`, {
      method: 'POST',
      body: JSON.stringify({ isOpen, lunchActive }),
    }),

  // Menu
  getMenuItems: (params?: { canteenId?: string; category?: string; search?: string; availableOnly?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.canteenId) q.append('canteenId', params.canteenId);
    if (params?.category) q.append('category', params.category);
    if (params?.search) q.append('search', params.search);
    if (params?.availableOnly) q.append('availableOnly', 'true');
    return request<{ success: boolean; items: MenuItem[] }>(`/menu?${q.toString()}`);
  },
  getMenuItem: (id: string) => request<{ success: boolean; item: MenuItem }>(`/menu/${id}`),
  createMenuItem: (itemData: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) =>
    request<{ success: boolean; item: MenuItem }>('/menu/create', {
      method: 'POST',
      body: JSON.stringify(itemData),
    }),
  updateMenuItem: (id: string, updates: Partial<MenuItem>) =>
    request<{ success: boolean; item: MenuItem }>(`/menu/${id}/update`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  adjustStock: (id: string, newStock: number) =>
    request<{ success: boolean; item: MenuItem }>(`/menu/${id}/stock`, {
      method: 'POST',
      body: JSON.stringify({ newStock }),
    }),

  // Orders
  createOrder: (payload: {
    canteenId: string;
    items: {
      itemId: string;
      quantity: number;
      selectedCustomizations: { groupId: string; optionId: string }[];
    }[];
    paymentMethod: 'online' | 'cash';
    specialInstructions?: string;
  }) =>
    request<{ success: boolean; order: Order }>('/orders/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getStudentOrders: () => request<{ success: boolean; orders: Order[] }>('/orders/student'),
  getOwnerOrders: (canteenId: string) => request<{ success: boolean; orders: Order[] }>(`/orders/owner/${canteenId}`),
  getOrder: (id: string) => request<{ success: boolean; order: Order }>(`/orders/${id}`),
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, rejectionReason?: string) =>
    request<{ success: boolean; order: Order }>(`/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify({ newStatus, rejectionReason }),
    }),
  verifyPickup: (canteenId: string, qrOrToken: string) =>
    request<{ success: boolean; order: Order; message: string }>('/orders/verify-pickup', {
      method: 'POST',
      body: JSON.stringify({ canteenId, qrOrToken }),
    }),

  // Payments
  simulatePaymentSuccess: (orderId: string) =>
    request<{ success: boolean; order: Order }>(`/payments/${orderId}/simulate-success`, { method: 'POST' }),
  simulatePaymentFail: (orderId: string) =>
    request<{ success: boolean; order: Order }>(`/payments/${orderId}/simulate-fail`, { method: 'POST' }),

  // Smart Break Recommendations
  getBreakRecommendations: (params: {
    breakMinutes: number;
    maxWaitMinutes?: number;
    category?: string;
    maxBudget?: number;
  }) =>
    request<{
      success: boolean;
      recommendations: (MenuItem & { estimatedReadyMinutes: number; fitsBreak: boolean; reason: string })[];
      canteenSummary: { [canteenId: string]: { crowdLevel: string; wait: number } };
    }>('/recommendations/break-time', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // Notifications
  getNotifications: () =>
    request<{ success: boolean; notifications: InAppNotification[]; unreadCount: number }>('/notifications'),
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request<{ success: boolean }>('/notifications/read-all', { method: 'POST' }),

  // Feedback
  submitFeedback: (payload: { orderId: string; itemId: string; rating: number; comment?: string }) =>
    request<{ success: boolean; feedback: FeedbackReview }>('/feedback/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCanteenFeedback: (canteenId: string) =>
    request<{ success: boolean; feedback: FeedbackReview[] }>(`/feedback/canteen/${canteenId}`),

  // Analytics
  getCanteenAnalytics: (canteenId: string) =>
    request<{ success: boolean; analytics: CanteenAnalytics }>(`/analytics/${canteenId}`),

  // System
  resetSeedData: () => request<{ success: boolean; message: string }>('/system/reset-seed', { method: 'POST' }),
};
