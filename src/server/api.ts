import { Router, Request, Response } from 'express';
import { db } from './db';
import { MenuItem, OrderStatus, UserRole } from '../types';

export const apiRouter = Router();

// Middleware: Extract current simulated user from header or fallback
const getCurrentUser = (req: Request) => {
  const userId = (req.headers['x-user-id'] as string) || 'user_student_1';
  return db.getUser(userId) || db.getUser('user_student_1')!;
};

// ----------------------------------------------------
// 1. AUTH & PROFILE
// ----------------------------------------------------
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = getCurrentUser(req);
  res.json({ success: true, user });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, role } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }
  let user = db.getUserByEmail(email);
  if (!user) {
    // Demo auto-provisioning for hackathon ease of access
    const assignedRole: UserRole = role || 'student';
    let canteenId: string | undefined = undefined;
    if (assignedRole === 'owner') {
      canteenId = email.includes('b') ? 'canteen_b' : 'canteen_a';
    }
    user = db.createUser({
      id: `user_${Date.now()}`,
      name: email.split('@')[0],
      email,
      role: assignedRole,
      canteenId,
      studentId: assignedRole === 'student' ? `STU-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
    });
  }
  res.json({ success: true, user });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, role, studentId, canteenId } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ success: false, error: 'Missing mandatory registration fields.' });
  }
  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ success: false, error: 'User with this email already exists.' });
  }
  const newUser = db.createUser({
    id: `user_${Date.now()}`,
    name,
    email,
    role,
    studentId,
    canteenId: role === 'owner' ? (canteenId || 'canteen_a') : undefined,
  });
  res.json({ success: true, user: newUser });
});

apiRouter.get('/auth/demo-users', (_req: Request, res: Response) => {
  res.json({ success: true, users: db.getAllUsers() });
});

// ----------------------------------------------------
// 2. CANTEENS & COMPARISON
// ----------------------------------------------------
apiRouter.get('/canteens', (_req: Request, res: Response) => {
  const canteens = db.getAllCanteens();
  res.json({ success: true, canteens });
});

apiRouter.get('/canteens/comparison', (_req: Request, res: Response) => {
  const canteens = db.getAllCanteens();
  const canteenA = canteens.find((c) => c.id === 'canteen_a')!;
  const canteenB = canteens.find((c) => c.id === 'canteen_b')!;

  let recommendation = '';
  if (canteenA.crowdIndex < canteenB.crowdIndex) {
    recommendation = `${canteenA.name} currently has a lower estimated workload (${canteenA.crowdIndex}% vs ${canteenB.crowdIndex}%).`;
  } else if (canteenB.crowdIndex < canteenA.crowdIndex) {
    recommendation = `${canteenB.name} currently has a lower estimated workload (${canteenB.crowdIndex}% vs ${canteenA.crowdIndex}%).`;
  } else {
    recommendation = 'Both campus canteens have comparable active workloads at this moment.';
  }

  res.json({
    success: true,
    canteenA,
    canteenB,
    recommendation,
    lastUpdated: new Date().toISOString(),
  });
});

apiRouter.post('/canteens/:id/status', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const canteenId = req.params.id;

  if (currentUser.role !== 'admin' && (currentUser.role !== 'owner' || currentUser.canteenId !== canteenId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized to modify this canteen configuration.' });
  }

  const { isOpen, lunchActive } = req.body;
  const updated = db.updateCanteenStatus(canteenId, isOpen, lunchActive);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Canteen not found' });
  }
  res.json({ success: true, canteen: updated });
});

// ----------------------------------------------------
// 3. MENU ITEMS & SEARCH
// ----------------------------------------------------
apiRouter.get('/menu', (req: Request, res: Response) => {
  const { canteenId, category, search, availableOnly } = req.query;
  let items = db.getMenuItems(canteenId as string);

  if (category && category !== 'all') {
    items = items.filter((i) => i.category === category);
  }

  if (search) {
    const q = (search as string).toLowerCase().trim();
    items = items.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
  }

  if (availableOnly === 'true') {
    items = items.filter((i) => i.isAvailable && i.stockQuantity > 0);
  }

  res.json({ success: true, items });
});

apiRouter.get('/menu/:id', (req: Request, res: Response) => {
  const item = db.getMenuItem(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, error: 'Item not found' });
  }
  res.json({ success: true, item });
});

apiRouter.post('/menu/create', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const itemData = req.body as Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>;

  if (currentUser.role !== 'admin' && (currentUser.role !== 'owner' || currentUser.canteenId !== itemData.canteenId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized: Only authorized canteen owners can add menu items.' });
  }

  const created = db.createMenuItem(itemData);
  res.json({ success: true, item: created });
});

apiRouter.put('/menu/:id/update', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const existing = db.getMenuItem(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Item not found' });
  }

  if (currentUser.role !== 'admin' && (currentUser.role !== 'owner' || currentUser.canteenId !== existing.canteenId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized: You do not own this canteen item.' });
  }

  const updated = db.updateMenuItem(req.params.id, req.body);
  res.json({ success: true, item: updated });
});

apiRouter.post('/menu/:id/stock', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const existing = db.getMenuItem(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Item not found' });
  }

  if (currentUser.role !== 'admin' && (currentUser.role !== 'owner' || currentUser.canteenId !== existing.canteenId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized: Cannot modify inventory for this canteen.' });
  }

  const { newStock } = req.body;
  if (typeof newStock !== 'number' || newStock < 0) {
    return res.status(400).json({ success: false, error: 'Invalid stock quantity' });
  }

  const updated = db.adjustItemStock(req.params.id, newStock, currentUser.name);
  res.json({ success: true, item: updated });
});

// ----------------------------------------------------
// 4. ORDERS & CONCURRENCY-SAFE TRANSACTIONS
// ----------------------------------------------------
apiRouter.post('/orders/create', async (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const { canteenId, items, paymentMethod, specialInstructions } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Cart is empty. Please select food items.' });
  }

  const result = await db.createOrderSafe({
    canteenId,
    studentId: currentUser.id,
    studentName: currentUser.name,
    items,
    paymentMethod: paymentMethod || 'online',
    specialInstructions,
  });

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }

  res.status(201).json({ success: true, order: result.order });
});

apiRouter.get('/orders/student', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const orders = db.getOrdersByStudent(currentUser.id);
  res.json({ success: true, orders });
});

apiRouter.get('/orders/owner/:canteenId', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const canteenId = req.params.canteenId;

  if (currentUser.role !== 'admin' && (currentUser.role !== 'owner' || currentUser.canteenId !== canteenId)) {
    return res.status(403).json({ success: false, error: 'Access denied: You are not authorized to view orders for this canteen.' });
  }

  const orders = db.getOrdersByCanteen(canteenId);
  res.json({ success: true, orders });
});

apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const order = db.getOrder(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  // Authorization check: student can only view their own order; owner can only view their canteen's orders
  if (currentUser.role === 'student' && order.studentId !== currentUser.id) {
    return res.status(403).json({ success: false, error: 'Access denied: Not your order.' });
  }
  if (currentUser.role === 'owner' && order.canteenId !== currentUser.canteenId) {
    return res.status(403).json({ success: false, error: 'Access denied: Order belongs to another canteen.' });
  }

  res.json({ success: true, order });
});

apiRouter.post('/orders/:id/status', async (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const order = db.getOrder(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  if (currentUser.role !== 'admin' && (currentUser.role !== 'owner' || currentUser.canteenId !== order.canteenId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized to alter order workflow state.' });
  }

  const { newStatus, rejectionReason } = req.body as { newStatus: OrderStatus; rejectionReason?: string };
  const result = await db.updateOrderStatus(order.id, newStatus, currentUser.id, rejectionReason);

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }

  res.json({ success: true, order: result.order });
});

// ----------------------------------------------------
// 5. QR PICKUP VERIFICATION (ANTI-REPLAY PROTECTED)
// ----------------------------------------------------
apiRouter.post('/orders/verify-pickup', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const { canteenId, qrOrToken } = req.body;

  if (currentUser.role !== 'admin' && (currentUser.role !== 'owner' || currentUser.canteenId !== canteenId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized: Only authorized canteen staff can verify pickups.' });
  }

  if (!qrOrToken || typeof qrOrToken !== 'string') {
    return res.status(400).json({ success: false, error: 'QR Code payload or pickup token string required.' });
  }

  const result = db.verifyAndCollectPickup(canteenId, qrOrToken, currentUser.id);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }

  res.json({ success: true, order: result.order, message: `Order ${result.order?.token} verified and collected successfully!` });
});

// ----------------------------------------------------
// 6. PAYMENTS & REMINDERS
// ----------------------------------------------------
apiRouter.post('/payments/:orderId/simulate-success', (req: Request, res: Response) => {
  const orderId = req.params.orderId;
  const result = db.confirmOrderPayment(orderId, `txn_demo_${Date.now()}`);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }
  res.json({ success: true, order: result.order });
});

apiRouter.post('/payments/:orderId/simulate-fail', (req: Request, res: Response) => {
  const orderId = req.params.orderId;
  const result = db.failOrderPayment(orderId, 'Bank declined test simulation transaction.');
  res.json({ success: true, order: result.order });
});

apiRouter.post('/payments/expire-check', async (_req: Request, res: Response) => {
  const expiredCount = await db.checkAndExpireUnpaidOrders();
  res.json({ success: true, expiredCount });
});

// ----------------------------------------------------
// 7. SMART BREAK-TIME RECOMMENDATION
// ----------------------------------------------------
apiRouter.post('/recommendations/break-time', (req: Request, res: Response) => {
  const { breakMinutes, maxWaitMinutes, category, maxBudget } = req.body;
  if (!breakMinutes || breakMinutes <= 0) {
    return res.status(400).json({ success: false, error: 'Please specify remaining break duration in minutes.' });
  }

  const result = db.getSmartBreakRecommendations({
    breakMinutes: Number(breakMinutes),
    maxWaitMinutes: maxWaitMinutes ? Number(maxWaitMinutes) : undefined,
    category: category || 'all',
    maxBudget: maxBudget ? Number(maxBudget) : undefined,
  });

  res.json({ success: true, ...result });
});

// ----------------------------------------------------
// 8. NOTIFICATIONS
// ----------------------------------------------------
apiRouter.get('/notifications', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const notifications = db.getNotificationsByUser(currentUser.id);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  res.json({ success: true, notifications, unreadCount });
});

apiRouter.post('/notifications/:id/read', (req: Request, res: Response) => {
  const success = db.markNotificationAsRead(req.params.id);
  res.json({ success });
});

apiRouter.post('/notifications/read-all', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  db.markAllNotificationsAsRead(currentUser.id);
  res.json({ success: true });
});

// ----------------------------------------------------
// 9. FEEDBACK & REVIEWS
// ----------------------------------------------------
apiRouter.post('/feedback/submit', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const { orderId, itemId, rating, comment } = req.body;

  if (!orderId || !itemId || !rating) {
    return res.status(400).json({ success: false, error: 'Missing required feedback fields.' });
  }

  const result = db.submitFeedback({
    orderId,
    studentId: currentUser.id,
    studentName: currentUser.name,
    itemId,
    rating: Number(rating),
    comment: comment || '',
  });

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }

  res.status(201).json({ success: true, feedback: result.feedback });
});

apiRouter.get('/feedback/canteen/:canteenId', (req: Request, res: Response) => {
  const feedback = db.getFeedbackByCanteen(req.params.canteenId);
  res.json({ success: true, feedback });
});

// ----------------------------------------------------
// 10. OWNER ANALYTICS & REPORTS
// ----------------------------------------------------
apiRouter.get('/analytics/:canteenId', (req: Request, res: Response) => {
  const currentUser = getCurrentUser(req);
  const canteenId = req.params.canteenId;

  if (currentUser.role !== 'admin' && (currentUser.role !== 'owner' || currentUser.canteenId !== canteenId)) {
    return res.status(403).json({ success: false, error: 'Unauthorized: Cannot access financial analytics for this canteen.' });
  }

  const analytics = db.getCanteenAnalytics(canteenId);
  res.json({ success: true, analytics });
});

// ----------------------------------------------------
// 11. SYSTEM & DEMO SEED RESET
// ----------------------------------------------------
apiRouter.post('/system/reset-seed', (_req: Request, res: Response) => {
  db.seedInitialData();
  res.json({ success: true, message: 'Initial seed data reset successfully.' });
});
