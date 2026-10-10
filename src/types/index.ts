export type UserRole = 'student' | 'owner' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  canteenId?: string; // If owner, which canteen they own (canteen_a or canteen_b)
  studentId?: string;
  avatarUrl?: string;
}

export type MealCategory = 'breakfast' | 'lunch' | 'snacks' | 'meals' | 'beverages';

export interface CustomizationOption {
  id: string;
  name: string;
  priceDelta: number; // e.g. +10, 0
  isAvailable: boolean;
  isDefault?: boolean;
}

export interface CustomizationGroup {
  id: string;
  title: string;
  description?: string;
  minSelections: number; // 0 for optional, 1 for required
  maxSelections: number; // 1 for radio, >1 for multi-select
  isRequired: boolean;
  options: CustomizationOption[];
}

export interface MenuItem {
  id: string;
  canteenId: string; // 'canteen_a' | 'canteen_b'
  name: string;
  description: string;
  category: MealCategory;
  basePrice: number;
  imageUrl: string;
  prepTimeMinutes: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isAvailable: boolean;
  isLunchOnly?: boolean;
  isActive: boolean;
  customizationGroups: CustomizationGroup[];
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'pending_payment'
  | 'awaiting_acceptance'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'collected'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
export type PaymentMethod = 'online' | 'cash';

export interface SelectedCustomization {
  groupId: string;
  groupTitle: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
}

export interface OrderItemSnapshot {
  itemId: string;
  name: string;
  category: MealCategory;
  basePrice: number;
  quantity: number;
  prepTimeMinutes: number;
  customizations: SelectedCustomization[];
  itemTotal: number;
}

export interface Order {
  id: string;
  token: string; // e.g. A101, B204
  canteenId: string;
  studentId: string;
  studentName: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  taxCharges: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDeadline: string; // ISO string 10 mins after creation
  qrToken: string; // cryptographic pickup verification token
  specialInstructions?: string;
  estimatedReadyTime: string; // ISO string
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  collectedAt?: string;
}

export interface Canteen {
  id: string;
  name: string;
  campusLocation: string;
  isOpen: boolean;
  lunchActive: boolean;
  capacityRate: number; // Max concurrent kitchen workload capacity in minutes
  currentWorkloadMinutes: number;
  crowdIndex: number; // 0-100
  crowdLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  activeOrderCount: number;
  availableItemCount: number;
  unavailableItemCount: number;
  soldOutItemCount: number;
  totalItemCount: number;
  estimatedWaitMinutes: number;
  lastUpdated: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  orderId?: string;
  canteenId?: string;
  type:
    | 'order_placed'
    | 'order_accepted'
    | 'order_rejected'
    | 'order_preparing'
    | 'ready_for_pickup'
    | 'order_collected'
    | 'payment_pending'
    | 'payment_reminder'
    | 'payment_success'
    | 'payment_expired'
    | 'low_stock'
    | 'feedback_reminder';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface FeedbackReview {
  id: string;
  orderId: string;
  canteenId: string;
  studentId: string;
  studentName: string;
  itemId: string;
  itemName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface CanteenAnalytics {
  canteenId: string;
  canteenName: string;
  todayOrdersCount: number;
  activeOrdersCount: number;
  completedOrdersCount: number;
  cancelledOrdersCount: number;
  paidOrdersCount: number;
  pendingPaymentOrdersCount: number;
  confirmedRevenue: number;
  popularItems: { name: string; count: number; revenue: number }[];
  lowStockItems: { name: string; stock: number; threshold: number }[];
  averageRating: number;
  totalReviews: number;
  crowdIndex: number;
}
