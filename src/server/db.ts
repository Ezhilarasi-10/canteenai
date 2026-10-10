import crypto from 'crypto';
import {
  Canteen,
  MenuItem,
  Order,
  UserProfile,
  InAppNotification,
  FeedbackReview,
  CanteenAnalytics,
  OrderStatus,
  PaymentStatus,
  OrderItemSnapshot,
} from '../types';

// Images generated via AI Studio image_generation
export const IMAGES = {
  hero: '/src/assets/images/canteen_hero_banner_1791623245722.jpg',
  dosa: '/src/assets/images/masala_dosa_platter_1791623258104.jpg',
  coffee: '/src/assets/images/filter_coffee_dabarah_1791623272645.jpg',
  burger: '/src/assets/images/campus_burger_fries_1791623284757.jpg',
  biryani: '/src/assets/images/hyderabadi_biryani_meal_1791623297462.jpg',
};

class Database {
  private users: Map<string, UserProfile> = new Map();
  private canteens: Map<string, Canteen> = new Map();
  private menuItems: Map<string, MenuItem> = new Map();
  private orders: Map<string, Order> = new Map();
  private notifications: InAppNotification[] = [];
  private feedback: FeedbackReview[] = [];
  private orderTokenSequences: { [canteenId: string]: number } = { canteen_a: 100, canteen_b: 200 };
  
  // Stock operation mutex lock to guarantee concurrency safety
  private stockLock: Promise<void> = Promise.resolve();

  constructor() {
    this.seedInitialData();
  }

  private async acquireStockLock(): Promise<() => void> {
    let release: () => void;
    const nextLock = new Promise<void>((resolve) => {
      release = resolve;
    });
    const currentLock = this.stockLock;
    this.stockLock = currentLock.then(() => nextLock);
    await currentLock;
    return release!;
  }

  public seedInitialData() {
    this.users.clear();
    this.canteens.clear();
    this.menuItems.clear();
    this.orders.clear();
    this.notifications = [];
    this.feedback = [];
    this.orderTokenSequences = { canteen_a: 100, canteen_b: 200 };

    // 1. Seed Users
    const defaultUsers: UserProfile[] = [
      {
        id: 'user_student_1',
        name: 'Priya Seenivasan',
        email: 'priyaseenivasan0606@gmail.com',
        role: 'student',
        studentId: '2024-CS-042',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      },
      {
        id: 'user_owner_a',
        name: 'Chef Ramanathan (Harvest Grill)',
        email: 'raman@harvestgrill.campus',
        role: 'owner',
        canteenId: 'canteen_a',
        avatarUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&auto=format&fit=crop&q=80',
      },
      {
        id: 'user_owner_b',
        name: 'Chef Anita (Banyan Court)',
        email: 'anita@banyancourt.campus',
        role: 'owner',
        canteenId: 'canteen_b',
        avatarUrl: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=120&auto=format&fit=crop&q=80',
      },
      {
        id: 'user_admin_1',
        name: 'Campus Dining Directorate',
        email: 'admin@campus.edu',
        role: 'admin',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
      },
    ];
    defaultUsers.forEach((u) => this.users.set(u.id, u));

    // 2. Seed Canteens
    const canteenA: Canteen = {
      id: 'canteen_a',
      name: 'Harvest Campus Grill',
      campusLocation: 'Block A, Ground Floor South Wing',
      isOpen: true,
      lunchActive: true,
      capacityRate: 90, // 90 workload minutes max normal capacity
      currentWorkloadMinutes: 28,
      crowdIndex: 31,
      crowdLevel: 'Moderate',
      activeOrderCount: 3,
      availableItemCount: 6,
      unavailableItemCount: 1,
      soldOutItemCount: 1,
      totalItemCount: 8,
      estimatedWaitMinutes: 12,
      lastUpdated: new Date().toISOString(),
    };

    const canteenB: Canteen = {
      id: 'canteen_b',
      name: 'Banyan Court Canteen',
      campusLocation: 'Student Activity Hub, North Courtyard',
      isOpen: true,
      lunchActive: true,
      capacityRate: 120, // 120 workload minutes capacity
      currentWorkloadMinutes: 16,
      crowdIndex: 13,
      crowdLevel: 'Low',
      activeOrderCount: 1,
      availableItemCount: 7,
      unavailableItemCount: 0,
      soldOutItemCount: 0,
      totalItemCount: 7,
      estimatedWaitMinutes: 6,
      lastUpdated: new Date().toISOString(),
    };

    this.canteens.set(canteenA.id, canteenA);
    this.canteens.set(canteenB.id, canteenB);

    // 3. Seed Menu Items with Individual Customization Engine
    const items: MenuItem[] = [
      // CANTEEN A ITEMS
      {
        id: 'item_a_1',
        canteenId: 'canteen_a',
        name: 'Crispy Masala Dosa Platter',
        description: 'Golden fermented rice-lentil crepe stuffed with spiced mustard potato masala, paired with fresh coconut chutney, spicy tomato relish and hot vegetable sambar.',
        category: 'breakfast',
        basePrice: 65,
        imageUrl: IMAGES.dosa,
        prepTimeMinutes: 7,
        stockQuantity: 28,
        lowStockThreshold: 10,
        isAvailable: true,
        isLunchOnly: false,
        isActive: true,
        customizationGroups: [
          {
            id: 'grp_spice',
            title: 'Spice Preference',
            description: 'Choose your masala spice level',
            minSelections: 1,
            maxSelections: 1,
            isRequired: true,
            options: [
              { id: 'opt_sp_mild', name: 'Mild & Buttery', priceDelta: 0, isAvailable: true, isDefault: true },
              { id: 'opt_sp_med', name: 'Traditional Medium Spice', priceDelta: 0, isAvailable: true },
              { id: 'opt_sp_hot', name: 'Extra Gunpowder Podi Spice', priceDelta: 10, isAvailable: true },
            ],
          },
          {
            id: 'grp_chutney',
            title: 'Chutney Selection',
            description: 'Select your preferred chutneys',
            minSelections: 1,
            maxSelections: 2,
            isRequired: true,
            options: [
              { id: 'opt_ch_coconut', name: 'Fresh Coconut Chutney', priceDelta: 0, isAvailable: true, isDefault: true },
              { id: 'opt_ch_tomato', name: 'Spicy Onion-Tomato Chutney', priceDelta: 0, isAvailable: true },
              { id: 'opt_ch_pudina', name: 'Mint & Coriander Chutney', priceDelta: 5, isAvailable: true },
            ],
          },
          {
            id: 'grp_addons_dosa',
            title: 'Accompaniments & Add-ons',
            description: 'Optional extras',
            minSelections: 0,
            maxSelections: 3,
            isRequired: false,
            options: [
              { id: 'opt_add_sambar', name: 'Extra Hot Drumstick Sambar Bowl', priceDelta: 15, isAvailable: true },
              { id: 'opt_add_ghee', name: 'Pure Desi Ghee Roast Roast Upgrade', priceDelta: 20, isAvailable: true },
              { id: 'opt_add_vada', name: 'Single Crispy Medu Vada on Side', priceDelta: 25, isAvailable: true },
            ],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'item_a_2',
        canteenId: 'canteen_a',
        name: 'South Indian Filter Coffee Dabarah',
        description: 'Authentic chicory blend brewed decoction poured with steaming frothy whole milk in a traditional brass dabarah tumbler.',
        category: 'beverages',
        basePrice: 25,
        imageUrl: IMAGES.coffee,
        prepTimeMinutes: 3,
        stockQuantity: 65,
        lowStockThreshold: 15,
        isAvailable: true,
        isLunchOnly: false,
        isActive: true,
        customizationGroups: [
          {
            id: 'grp_strength',
            title: 'Brew Strength',
            description: 'Ratio of dark decoction to hot milk',
            minSelections: 1,
            maxSelections: 1,
            isRequired: true,
            options: [
              { id: 'opt_str_light', name: 'Light Brew (More Milk)', priceDelta: 0, isAvailable: true },
              { id: 'opt_str_med', name: 'Classic Medium', priceDelta: 0, isAvailable: true, isDefault: true },
              { id: 'opt_str_strong', name: 'Strong Dark Roast (Double Shot)', priceDelta: 5, isAvailable: true },
            ],
          },
          {
            id: 'grp_sugar',
            title: 'Sugar Level',
            description: 'Sweetness preference',
            minSelections: 1,
            maxSelections: 1,
            isRequired: true,
            options: [
              { id: 'opt_sug_none', name: 'Zero Sugar', priceDelta: 0, isAvailable: true },
              { id: 'opt_sug_less', name: 'Less Sugar (Half Spoon)', priceDelta: 0, isAvailable: true },
              { id: 'opt_sug_normal', name: 'Standard Cane Sugar', priceDelta: 0, isAvailable: true, isDefault: true },
              { id: 'opt_sug_jaggery', name: 'Organic Nattu Sakkarai (Jaggery)', priceDelta: 8, isAvailable: true },
            ],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'item_a_3',
        canteenId: 'canteen_a',
        name: 'Hyderabadi Dum Biryani Feast',
        description: 'Slow-cooked aromatic long-grain basmati with marinated chicken or spiced paneer, fragrant saffron, fried onions, boiled farm egg, served with cucumber raita & mirchi ka salan.',
        category: 'meals',
        basePrice: 160,
        imageUrl: IMAGES.biryani,
        prepTimeMinutes: 10,
        stockQuantity: 18,
        lowStockThreshold: 8,
        isAvailable: true,
        isLunchOnly: true, // Only when lunch active
        isActive: true,
        customizationGroups: [
          {
            id: 'grp_biryani_size',
            title: 'Portion Size',
            description: 'Select serving weight',
            minSelections: 1,
            maxSelections: 1,
            isRequired: true,
            options: [
              { id: 'opt_sz_regular', name: 'Regular Portion (1 Person)', priceDelta: 0, isAvailable: true, isDefault: true },
              { id: 'opt_sz_jumbo', name: 'Jumbo Student Portion (+30% Rice & Gravy)', priceDelta: 45, isAvailable: true },
            ],
          },
          {
            id: 'grp_biryani_sides',
            title: 'Gravy & Accompaniment Extras',
            description: 'Sides tailored to your taste',
            minSelections: 0,
            maxSelections: 2,
            isRequired: false,
            options: [
              { id: 'opt_side_raita', name: 'Extra Chilled Cucumber-Mint Raita', priceDelta: 15, isAvailable: true },
              { id: 'opt_side_salan', name: 'Extra Spicy Mirchi Ka Salan Gravy', priceDelta: 15, isAvailable: true },
              { id: 'opt_side_egg', name: 'Additional Hard-Boiled Masala Egg', priceDelta: 12, isAvailable: true },
            ],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'item_a_4',
        canteenId: 'canteen_a',
        name: 'Steamed Idli & Crispy Vada Duo',
        description: 'Tender pillow-soft steamed idlis (2 pcs) with one crunchy lentil medu vada, served piping hot with 2 varieties of chutney and aromatic sambar.',
        category: 'breakfast',
        basePrice: 50,
        imageUrl: IMAGES.dosa,
        prepTimeMinutes: 4,
        stockQuantity: 4, // LOW STOCK DEMO EXAMPLE!
        lowStockThreshold: 10,
        isAvailable: true,
        isLunchOnly: false,
        isActive: true,
        customizationGroups: [
          {
            id: 'grp_idli_style',
            title: 'Serving Style',
            description: 'How do you want it served?',
            minSelections: 1,
            maxSelections: 1,
            isRequired: true,
            options: [
              { id: 'opt_idli_sep', name: 'Separate in Compartment Plate', priceDelta: 0, isAvailable: true, isDefault: true },
              { id: 'opt_idli_dip', name: 'Sambar Dip (Drenched in piping hot sambar bowl)', priceDelta: 5, isAvailable: true },
            ],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'item_a_5',
        canteenId: 'canteen_a',
        name: 'Shahi Paneer Butter Masala Thali',
        description: 'Cottage cheese simmered in velvety tomato cashew gravy with 2 butter naans, jeera rice, dal makhani, and gulab jamun.',
        category: 'meals',
        basePrice: 145,
        imageUrl: IMAGES.biryani,
        prepTimeMinutes: 12,
        stockQuantity: 0, // SOLD OUT DEMO EXAMPLE!
        lowStockThreshold: 5,
        isAvailable: false,
        isLunchOnly: true,
        isActive: true,
        customizationGroups: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'item_a_6',
        canteenId: 'canteen_a',
        name: 'Kadak Masala Chai & Osmania Biscuits',
        description: 'Slow-simmered Assam black tea with crushed cardamom, ginger and lemongrass, paired with two melt-in-mouth bakery biscuits.',
        category: 'beverages',
        basePrice: 20,
        imageUrl: IMAGES.coffee,
        prepTimeMinutes: 3,
        stockQuantity: 50,
        lowStockThreshold: 10,
        isAvailable: true,
        isLunchOnly: false,
        isActive: true,
        customizationGroups: [
          {
            id: 'grp_chai_ginger',
            title: 'Ginger Intensity',
            description: 'Adjust adrak flavour',
            minSelections: 1,
            maxSelections: 1,
            isRequired: true,
            options: [
              { id: 'opt_ch_g1', name: 'Mild Elaichi Dominant', priceDelta: 0, isAvailable: true },
              { id: 'opt_ch_g2', name: 'Balanced Ginger-Cardamom', priceDelta: 0, isAvailable: true, isDefault: true },
              { id: 'opt_ch_g3', name: 'Extra Strong Spicy Adrak', priceDelta: 0, isAvailable: true },
            ],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },

      // CANTEEN B ITEMS
      {
        id: 'item_b_1',
        canteenId: 'canteen_b',
        name: 'Campus Smash Cheeseburger & Fries',
        description: 'Double-seared crispy vegetable or chicken patty topped with melted cheddar, fresh pickled gherkins, crisp lettuce, brioche bun, served with seasoned cajun fries.',
        category: 'snacks',
        basePrice: 95,
        imageUrl: IMAGES.burger,
        prepTimeMinutes: 8,
        stockQuantity: 34,
        lowStockThreshold: 10,
        isAvailable: true,
        isLunchOnly: false,
        isActive: true,
        customizationGroups: [
          {
            id: 'grp_patty_type',
            title: 'Patty Selection',
            description: 'Choose your burger core',
            minSelections: 1,
            maxSelections: 1,
            isRequired: true,
            options: [
              { id: 'opt_pt_veg', name: 'Crispy Herbed Veg Patty', priceDelta: 0, isAvailable: true, isDefault: true },
              { id: 'opt_pt_paneer', name: 'Smoked Spiced Paneer Slab', priceDelta: 20, isAvailable: true },
              { id: 'opt_pt_chicken', name: 'Crispy Tender Chicken Patty', priceDelta: 30, isAvailable: true },
            ],
          },
          {
            id: 'grp_cheese_sauce',
            title: 'Sauce & Cheese Upgrades',
            description: 'Custom dressings and toppings',
            minSelections: 0,
            maxSelections: 3,
            isRequired: false,
            options: [
              { id: 'opt_chz_double', name: 'Extra Melted Cheddar Slice', priceDelta: 15, isAvailable: true },
              { id: 'opt_sc_chipotle', name: 'House Smoky Chipotle Mayo', priceDelta: 10, isAvailable: true },
              { id: 'opt_sc_jalapeno', name: 'Pickled Spicy Jalapenos', priceDelta: 10, isAvailable: true },
            ],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'item_b_2',
        canteenId: 'canteen_b',
        name: 'Cold Brew & Hazelnut Cream Frappe',
        description: '16-hour steeped cold brew blended with hazelnut extract, crushed ice and creamy milk, topped with cocoa dust.',
        category: 'beverages',
        basePrice: 70,
        imageUrl: IMAGES.coffee,
        prepTimeMinutes: 4,
        stockQuantity: 40,
        lowStockThreshold: 10,
        isAvailable: true,
        isLunchOnly: false,
        isActive: true,
        customizationGroups: [
          {
            id: 'grp_sweet_level',
            title: 'Sweetness',
            description: 'Sugar and syrup concentration',
            minSelections: 1,
            maxSelections: 1,
            isRequired: true,
            options: [
              { id: 'opt_sw_30', name: 'Low Sweetness (30%)', priceDelta: 0, isAvailable: true },
              { id: 'opt_sw_50', name: 'Balanced Standard (50%)', priceDelta: 0, isAvailable: true, isDefault: true },
              { id: 'opt_sw_100', name: 'Sweet Tooth (100%)', priceDelta: 0, isAvailable: true },
            ],
          },
          {
            id: 'grp_frappe_addons',
            title: 'Toppings',
            description: 'Extra indulgence',
            minSelections: 0,
            maxSelections: 2,
            isRequired: false,
            options: [
              { id: 'opt_f_whip', name: 'Whipped Cream Swirl', priceDelta: 15, isAvailable: true },
              { id: 'opt_f_espresso', name: 'Extra Shot of Espresso', priceDelta: 20, isAvailable: true },
            ],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'item_b_3',
        canteenId: 'canteen_b',
        name: 'Crispy Samosa Chaat & Tangy Dahi',
        description: 'Two golden flaky samosas crushed and smothered with warm spiced chana masala, chilled sweet yoghurt, tamarind chutney and fine sev.',
        category: 'snacks',
        basePrice: 45,
        imageUrl: IMAGES.dosa,
        prepTimeMinutes: 5,
        stockQuantity: 32,
        lowStockThreshold: 10,
        isAvailable: true,
        isLunchOnly: false,
        isActive: true,
        customizationGroups: [
          {
            id: 'grp_chaat_spice',
            title: 'Chutney Balance',
            description: 'Sweet vs Spicy ratio',
            minSelections: 1,
            maxSelections: 1,
            isRequired: true,
            options: [
              { id: 'opt_ch_sweet', name: 'More Meethi Imli Chutney', priceDelta: 0, isAvailable: true },
              { id: 'opt_ch_bal', name: 'Balanced Sweet & Spicy', priceDelta: 0, isAvailable: true, isDefault: true },
              { id: 'opt_ch_teekha', name: 'Teekha (Extra Green Chilli Chutney)', priceDelta: 0, isAvailable: true },
            ],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'item_b_4',
        canteenId: 'canteen_b',
        name: 'South Indian Comfort Curd Rice Bowl',
        description: 'Tempered probiotic curd rice with mustard seeds, curry leaves, ginger, topped with fresh pomegranate seeds and spicy mango pickle.',
        category: 'lunch',
        basePrice: 55,
        imageUrl: IMAGES.biryani,
        prepTimeMinutes: 4,
        stockQuantity: 25,
        lowStockThreshold: 8,
        isAvailable: true,
        isLunchOnly: true,
        isActive: true,
        customizationGroups: [
          {
            id: 'grp_curd_pickle',
            title: 'Pickle Accompaniment',
            description: 'Choose your side pickle',
            minSelections: 1,
            maxSelections: 1,
            isRequired: true,
            options: [
              { id: 'opt_p_mango', name: 'Avakaya Andhra Spicy Mango Pickle', priceDelta: 0, isAvailable: true, isDefault: true },
              { id: 'opt_p_lemon', name: 'Tangy Salted Lemon Pickle', priceDelta: 0, isAvailable: true },
              { id: 'opt_p_none', name: 'No Pickle', priceDelta: 0, isAvailable: true },
            ],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'item_b_5',
        canteenId: 'canteen_b',
        name: 'Club Sandwich Grilled Supreme',
        description: 'Triple-decker butter-grilled whole wheat sandwich stuffed with seasoned corn, bell peppers, cheese spread, served with herb potato chips.',
        category: 'snacks',
        basePrice: 75,
        imageUrl: IMAGES.burger,
        prepTimeMinutes: 6,
        stockQuantity: 22,
        lowStockThreshold: 8,
        isAvailable: true,
        isLunchOnly: false,
        isActive: true,
        customizationGroups: [
          {
            id: 'grp_bread_type',
            title: 'Bread Selection',
            description: 'Choice of loaf',
            minSelections: 1,
            maxSelections: 1,
            isRequired: true,
            options: [
              { id: 'opt_br_white', name: 'Classic White Bread', priceDelta: 0, isAvailable: true },
              { id: 'opt_br_wheat', name: 'Brown Whole Wheat', priceDelta: 0, isAvailable: true, isDefault: true },
              { id: 'opt_br_multigrain', name: 'Artisan Multigrain (+Rs. 10)', priceDelta: 10, isAvailable: true },
            ],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    items.forEach((item) => this.menuItems.set(item.id, item));

    // 4. Seed Representative Sample Orders (to showcase live tracking, crowd indices, and unpaid reminders)
    const now = Date.now();

    // Order 1: Active preparing order in Canteen A
    const order1: Order = {
      id: 'ord_sample_1',
      token: 'A101',
      canteenId: 'canteen_a',
      studentId: 'user_student_1',
      studentName: 'Priya Seenivasan',
      items: [
        {
          itemId: 'item_a_1',
          name: 'Crispy Masala Dosa Platter',
          category: 'breakfast',
          basePrice: 65,
          quantity: 1,
          prepTimeMinutes: 7,
          customizations: [
            { groupId: 'grp_spice', groupTitle: 'Spice Preference', optionId: 'opt_sp_med', optionName: 'Traditional Medium Spice', priceDelta: 0 },
            { groupId: 'grp_chutney', groupTitle: 'Chutney Selection', optionId: 'opt_ch_coconut', optionName: 'Fresh Coconut Chutney', priceDelta: 0 },
          ],
          itemTotal: 65,
        },
        {
          itemId: 'item_a_2',
          name: 'South Indian Filter Coffee Dabarah',
          category: 'beverages',
          basePrice: 25,
          quantity: 1,
          prepTimeMinutes: 3,
          customizations: [
            { groupId: 'grp_strength', groupTitle: 'Brew Strength', optionId: 'opt_str_strong', optionName: 'Strong Dark Roast (Double Shot)', priceDelta: 5 },
            { groupId: 'grp_sugar', groupTitle: 'Sugar Level', optionId: 'opt_sug_less', optionName: 'Less Sugar (Half Spoon)', priceDelta: 0 },
          ],
          itemTotal: 30,
        },
      ],
      subtotal: 95,
      taxCharges: 0,
      total: 95,
      status: 'preparing',
      paymentMethod: 'online',
      paymentStatus: 'paid',
      paymentDeadline: new Date(now + 10 * 60 * 1000).toISOString(),
      qrToken: 'CIQ-QR-A101-7fa1c4d9e2b8451f',
      specialInstructions: 'Please make the dosa extra crisp if possible!',
      estimatedReadyTime: new Date(now + 4 * 60 * 1000).toISOString(),
      createdAt: new Date(now - 8 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 3 * 60 * 1000).toISOString(),
    };

    // Order 2: Sample Pending Payment with 10-Minute Timer running!
    const order2: Order = {
      id: 'ord_sample_2',
      token: 'A102',
      canteenId: 'canteen_a',
      studentId: 'user_student_1',
      studentName: 'Priya Seenivasan',
      items: [
        {
          itemId: 'item_a_3',
          name: 'Hyderabadi Dum Biryani Feast',
          category: 'meals',
          basePrice: 160,
          quantity: 1,
          prepTimeMinutes: 10,
          customizations: [
            { groupId: 'grp_biryani_size', groupTitle: 'Portion Size', optionId: 'opt_sz_regular', optionName: 'Regular Portion', priceDelta: 0 },
          ],
          itemTotal: 160,
        },
      ],
      subtotal: 160,
      taxCharges: 0,
      total: 160,
      status: 'pending_payment',
      paymentMethod: 'online',
      paymentStatus: 'pending',
      // Created 4 minutes ago, 6 minutes remaining before timeout
      paymentDeadline: new Date(now + 6 * 60 * 1000).toISOString(),
      qrToken: 'CIQ-QR-A102-184cf92b8d4e730a',
      specialInstructions: 'Less spicy raita please.',
      estimatedReadyTime: new Date(now + 15 * 60 * 1000).toISOString(),
      createdAt: new Date(now - 4 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 4 * 60 * 1000).toISOString(),
    };

    // Order 3: Past Collected Order in Canteen B to showcase post-collection reviews!
    const order3: Order = {
      id: 'ord_sample_3',
      token: 'B201',
      canteenId: 'canteen_b',
      studentId: 'user_student_1',
      studentName: 'Priya Seenivasan',
      items: [
        {
          itemId: 'item_b_1',
          name: 'Campus Smash Cheeseburger & Fries',
          category: 'snacks',
          basePrice: 95,
          quantity: 1,
          prepTimeMinutes: 8,
          customizations: [
            { groupId: 'grp_patty_type', groupTitle: 'Patty Selection', optionId: 'opt_pt_veg', optionName: 'Crispy Herbed Veg Patty', priceDelta: 0 },
            { groupId: 'grp_cheese_sauce', groupTitle: 'Sauce & Cheese Upgrades', optionId: 'opt_chz_double', optionName: 'Extra Melted Cheddar Slice', priceDelta: 15 },
          ],
          itemTotal: 110,
        },
      ],
      subtotal: 110,
      taxCharges: 0,
      total: 110,
      status: 'collected',
      paymentMethod: 'online',
      paymentStatus: 'paid',
      paymentDeadline: new Date(now - 90 * 60 * 1000).toISOString(),
      qrToken: 'CIQ-QR-B201-9a7bf32c019d45e8',
      estimatedReadyTime: new Date(now - 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now - 75 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 50 * 60 * 1000).toISOString(),
      collectedAt: new Date(now - 50 * 60 * 1000).toISOString(),
    };

    this.orders.set(order1.id, order1);
    this.orders.set(order2.id, order2);
    this.orders.set(order3.id, order3);

    // 5. Seed Feedback Review for Order 3
    this.feedback.push({
      id: 'rev_1',
      orderId: 'ord_sample_3',
      canteenId: 'canteen_b',
      studentId: 'user_student_1',
      studentName: 'Priya Seenivasan',
      itemId: 'item_b_1',
      itemName: 'Campus Smash Cheeseburger & Fries',
      rating: 5,
      comment: 'Super crunchy fries and the double cheddar melted evenly! Fast pickup counter too.',
      createdAt: new Date(now - 45 * 60 * 1000).toISOString(),
    });

    // 6. Seed In-App Notifications
    this.notifications.push(
      {
        id: 'notif_1',
        userId: 'user_student_1',
        orderId: 'ord_sample_1',
        canteenId: 'canteen_a',
        type: 'order_preparing',
        title: 'Order A101 is being prepared',
        message: 'Chef Ramanathan started preparing your Crispy Masala Dosa Platter. Estimated ready time: 4 mins.',
        isRead: false,
        createdAt: new Date(now - 3 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif_2',
        userId: 'user_student_1',
        orderId: 'ord_sample_2',
        canteenId: 'canteen_a',
        type: 'payment_pending',
        title: 'Payment Pending for Order A102',
        message: 'Order A102 is reserved for 10 minutes. Please complete payment within 6 minutes to keep your slot.',
        isRead: false,
        createdAt: new Date(now - 4 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif_3',
        userId: 'user_owner_a',
        orderId: 'ord_sample_2',
        canteenId: 'canteen_a',
        type: 'payment_pending',
        title: 'Unconfirmed Online Order A102',
        message: 'Student Priya initiated Order A102 (₹160). 10-minute hold expires at ' + new Date(now + 6 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false,
        createdAt: new Date(now - 4 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif_4',
        userId: 'user_owner_a',
        canteenId: 'canteen_a',
        type: 'low_stock',
        title: 'Low Stock Alert: Steamed Idli Combo',
        message: 'Steamed Idli & Crispy Vada Duo has reached 4 units remaining (Threshold: 10).',
        isRead: true,
        createdAt: new Date(now - 20 * 60 * 1000).toISOString(),
      }
    );

    this.recalculateCanteenMetrics();
  }

  // --- Recalculate Canteen Workload & Crowd Index ---
  public recalculateCanteenMetrics() {
    ['canteen_a', 'canteen_b'].forEach((canteenId) => {
      const canteen = this.canteens.get(canteenId);
      if (!canteen) return;

      // Filter active orders
      const activeOrders = Array.from(this.orders.values()).filter(
        (o) => o.canteenId === canteenId && ['awaiting_acceptance', 'accepted', 'preparing', 'ready_for_pickup'].includes(o.status)
      );

      // Workload formula: sum of remaining estimated prep minutes
      let totalWorkloadMinutes = 0;
      activeOrders.forEach((o) => {
        const orderPrep = o.items.reduce((acc, item) => acc + item.prepTimeMinutes * item.quantity, 0);
        if (o.status === 'preparing') {
          totalWorkloadMinutes += Math.max(2, Math.round(orderPrep * 0.6));
        } else if (o.status === 'ready_for_pickup') {
          totalWorkloadMinutes += 1;
        } else {
          totalWorkloadMinutes += orderPrep;
        }
      });

      // Crowd index formula: clamp(round(100 * workload / capacity), 0, 100)
      const crowdIndex = Math.min(100, Math.max(0, Math.round((100 * totalWorkloadMinutes) / canteen.capacityRate)));

      let crowdLevel: 'Low' | 'Moderate' | 'High' | 'Very High' = 'Low';
      if (crowdIndex >= 75) crowdLevel = 'Very High';
      else if (crowdIndex >= 50) crowdLevel = 'High';
      else if (crowdIndex >= 25) crowdLevel = 'Moderate';

      // Counts
      const canteenItems = Array.from(this.menuItems.values()).filter((i) => i.canteenId === canteenId);
      const availableCount = canteenItems.filter((i) => i.isAvailable && i.stockQuantity > 0).length;
      const soldOutCount = canteenItems.filter((i) => i.stockQuantity <= 0).length;
      const unavailableCount = canteenItems.filter((i) => !i.isAvailable && i.stockQuantity > 0).length;

      // Estimated wait time
      const estimatedWaitMinutes = Math.max(3, Math.round(totalWorkloadMinutes * 0.45));

      canteen.currentWorkloadMinutes = totalWorkloadMinutes;
      canteen.crowdIndex = crowdIndex;
      canteen.crowdLevel = crowdLevel;
      canteen.activeOrderCount = activeOrders.length;
      canteen.availableItemCount = availableCount;
      canteen.soldOutItemCount = soldOutCount;
      canteen.unavailableItemCount = unavailableCount;
      canteen.totalItemCount = canteenItems.length;
      canteen.estimatedWaitMinutes = estimatedWaitMinutes;
      canteen.lastUpdated = new Date().toISOString();
    });
  }

  // --- Users & Profiles ---
  public getUser(id: string): UserProfile | undefined {
    return this.users.get(id);
  }

  public getUserByEmail(email: string): UserProfile | undefined {
    return Array.from(this.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getAllUsers(): UserProfile[] {
    return Array.from(this.users.values());
  }

  public createUser(user: UserProfile): UserProfile {
    this.users.set(user.id, user);
    return user;
  }

  // --- Canteens ---
  public getAllCanteens(): Canteen[] {
    this.recalculateCanteenMetrics();
    return Array.from(this.canteens.values());
  }

  public getCanteen(id: string): Canteen | undefined {
    this.recalculateCanteenMetrics();
    return this.canteens.get(id);
  }

  public updateCanteenStatus(canteenId: string, isOpen: boolean, lunchActive?: boolean): Canteen | undefined {
    const canteen = this.canteens.get(canteenId);
    if (!canteen) return undefined;
    canteen.isOpen = isOpen;
    if (lunchActive !== undefined) {
      canteen.lunchActive = lunchActive;
    }
    canteen.lastUpdated = new Date().toISOString();
    this.recalculateCanteenMetrics();
    return canteen;
  }

  // --- Menu Items ---
  public getMenuItems(canteenId?: string): MenuItem[] {
    const items = Array.from(this.menuItems.values());
    if (canteenId) {
      return items.filter((i) => i.canteenId === canteenId);
    }
    return items;
  }

  public getMenuItem(id: string): MenuItem | undefined {
    return this.menuItems.get(id);
  }

  public createMenuItem(itemData: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): MenuItem {
    const id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newItem: MenuItem = {
      ...itemData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.menuItems.set(id, newItem);
    this.recalculateCanteenMetrics();
    return newItem;
  }

  public updateMenuItem(id: string, updates: Partial<MenuItem>): MenuItem | undefined {
    const item = this.menuItems.get(id);
    if (!item) return undefined;
    const updated: MenuItem = {
      ...item,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.menuItems.set(id, updated);
    this.recalculateCanteenMetrics();
    return updated;
  }

  public adjustItemStock(id: string, newStock: number, operatorName: string): MenuItem | undefined {
    const item = this.menuItems.get(id);
    if (!item) return undefined;
    const oldStock = item.stockQuantity;
    item.stockQuantity = Math.max(0, newStock);
    item.isAvailable = item.stockQuantity > 0;
    item.updatedAt = new Date().toISOString();

    // Check low stock trigger
    if (item.stockQuantity <= item.lowStockThreshold && item.stockQuantity > 0) {
      this.addNotification({
        userId: item.canteenId === 'canteen_a' ? 'user_owner_a' : 'user_owner_b',
        canteenId: item.canteenId,
        type: 'low_stock',
        title: `Low Stock: ${item.name}`,
        message: `${item.name} stock adjusted by ${operatorName} to ${item.stockQuantity} (Threshold: ${item.lowStockThreshold}).`,
      });
    }

    this.recalculateCanteenMetrics();
    return item;
  }

  // --- Concurrency-Safe Order Creation & Atomic Stock Reservation ---
  public async createOrderSafe(orderPayload: {
    canteenId: string;
    studentId: string;
    studentName: string;
    items: {
      itemId: string;
      quantity: number;
      selectedCustomizations: { groupId: string; optionId: string }[];
    }[];
    paymentMethod: 'online' | 'cash';
    specialInstructions?: string;
  }): Promise<{ success: boolean; order?: Order; error?: string }> {
    const releaseLock = await this.acquireStockLock();
    try {
      const { canteenId, studentId, studentName, items, paymentMethod, specialInstructions } = orderPayload;
      const canteen = this.canteens.get(canteenId);
      if (!canteen) {
        return { success: false, error: 'Invalid canteen specified.' };
      }
      if (!canteen.isOpen) {
        return { success: false, error: 'Canteen is currently closed for incoming orders.' };
      }

      // 1. Strict Server Re-validation of each item, availability, lunch period, and stock
      const validatedSnapshots: OrderItemSnapshot[] = [];
      let calculatedSubtotal = 0;

      for (const reqItem of items) {
        const dbItem = this.menuItems.get(reqItem.itemId);
        if (!dbItem || dbItem.canteenId !== canteenId || !dbItem.isActive) {
          return { success: false, error: `Menu item not found or inactive: ${reqItem.itemId}` };
        }
        if (!dbItem.isAvailable || dbItem.stockQuantity <= 0) {
          return { success: false, error: `Item "${dbItem.name}" is sold out.` };
        }
        if (dbItem.stockQuantity < reqItem.quantity) {
          return { success: false, error: `Insufficient stock for "${dbItem.name}". Only ${dbItem.stockQuantity} available.` };
        }
        if (dbItem.isLunchOnly && !canteen.lunchActive) {
          return { success: false, error: `Item "${dbItem.name}" is only served during active lunch hours.` };
        }

        // Revalidate customizations
        let customPriceDeltas = 0;
        const validCustomizations: { groupId: string; groupTitle: string; optionId: string; optionName: string; priceDelta: number }[] = [];

        for (const sel of reqItem.selectedCustomizations || []) {
          const group = dbItem.customizationGroups.find((g) => g.id === sel.groupId);
          if (group) {
            const option = group.options.find((o) => o.id === sel.optionId && o.isAvailable);
            if (option) {
              customPriceDeltas += option.priceDelta;
              validCustomizations.push({
                groupId: group.id,
                groupTitle: group.title,
                optionId: option.id,
                optionName: option.name,
                priceDelta: option.priceDelta,
              });
            }
          }
        }

        const unitPrice = dbItem.basePrice + customPriceDeltas;
        const itemTotal = unitPrice * reqItem.quantity;
        calculatedSubtotal += itemTotal;

        validatedSnapshots.push({
          itemId: dbItem.id,
          name: dbItem.name,
          category: dbItem.category,
          basePrice: dbItem.basePrice,
          quantity: reqItem.quantity,
          prepTimeMinutes: dbItem.prepTimeMinutes,
          customizations: validCustomizations,
          itemTotal,
        });
      }

      // 2. Concurrency-Safe Atomic Stock Deduction
      for (const item of validatedSnapshots) {
        const dbItem = this.menuItems.get(item.itemId)!;
        dbItem.stockQuantity -= item.quantity;
        if (dbItem.stockQuantity <= 0) {
          dbItem.isAvailable = false;
        }
        dbItem.updatedAt = new Date().toISOString();
      }

      // 3. Unique Token Generation (e.g., A103, B202)
      this.orderTokenSequences[canteenId] = (this.orderTokenSequences[canteenId] || 100) + 1;
      const prefix = canteenId === 'canteen_a' ? 'A' : 'B';
      const token = `${prefix}${this.orderTokenSequences[canteenId]}`;

      // Cryptographically unguessable QR pickup credential
      const qrToken = `CIQ-QR-${token}-${crypto.randomBytes(8).toString('hex')}`;

      // 4. Calculate timing & payment
      const now = Date.now();
      const totalPrepMinutes = validatedSnapshots.reduce((acc, it) => acc + it.prepTimeMinutes * it.quantity, 0);
      const estimatedReadyTime = new Date(now + (totalPrepMinutes + 5) * 60 * 1000).toISOString();
      const paymentDeadline = new Date(now + 10 * 60 * 1000).toISOString(); // 10-minute unpaid payment deadline

      const initialStatus: OrderStatus = paymentMethod === 'online' ? 'pending_payment' : 'awaiting_acceptance';
      const paymentStatus: PaymentStatus = paymentMethod === 'online' ? 'pending' : 'pending';

      const orderId = `ord_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const newOrder: Order = {
        id: orderId,
        token,
        canteenId,
        studentId,
        studentName,
        items: validatedSnapshots,
        subtotal: calculatedSubtotal,
        taxCharges: 0,
        total: calculatedSubtotal,
        status: initialStatus,
        paymentMethod,
        paymentStatus,
        paymentDeadline,
        qrToken,
        specialInstructions,
        estimatedReadyTime,
        createdAt: new Date(now).toISOString(),
        updatedAt: new Date(now).toISOString(),
      };

      this.orders.set(orderId, newOrder);

      // 5. In-App Notifications
      const ownerUserId = canteenId === 'canteen_a' ? 'user_owner_a' : 'user_owner_b';
      if (paymentMethod === 'online') {
        this.addNotification({
          userId: studentId,
          orderId,
          canteenId,
          type: 'payment_pending',
          title: `Order ${token} Placed — Payment Pending`,
          message: `Complete online payment within 10 minutes to confirm your order. Hold deadline: ${new Date(paymentDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        });
        this.addNotification({
          userId: ownerUserId,
          orderId,
          canteenId,
          type: 'payment_pending',
          title: `New Online Order ${token} (Payment Pending)`,
          message: `${studentName} placed Order ${token} (₹${calculatedSubtotal}). Awaiting 10-minute online payment verification.`,
        });
      } else {
        this.addNotification({
          userId: studentId,
          orderId,
          canteenId,
          type: 'order_placed',
          title: `Order ${token} Received (Cash on Pickup)`,
          message: `Your order ${token} has been submitted to ${canteen.name}. Pay ₹${calculatedSubtotal} at the counter upon pickup.`,
        });
        this.addNotification({
          userId: ownerUserId,
          orderId,
          canteenId,
          type: 'order_placed',
          title: `Incoming Order ${token} (Cash)`,
          message: `${studentName} placed Order ${token} (₹${calculatedSubtotal}). Awaiting kitchen acceptance.`,
        });
      }

      this.recalculateCanteenMetrics();
      return { success: true, order: newOrder };
    } finally {
      releaseLock();
    }
  }

  // --- Release Reserved Inventory (e.g. on expiry or rejection) ---
  public async releaseOrderStockAtomic(orderId: string): Promise<void> {
    const releaseLock = await this.acquireStockLock();
    try {
      const order = this.orders.get(orderId);
      if (!order) return;
      for (const item of order.items) {
        const dbItem = this.menuItems.get(item.itemId);
        if (dbItem) {
          dbItem.stockQuantity += item.quantity;
          if (dbItem.stockQuantity > 0) {
            dbItem.isAvailable = true;
          }
          dbItem.updatedAt = new Date().toISOString();
        }
      }
      this.recalculateCanteenMetrics();
    } finally {
      releaseLock();
    }
  }

  // --- 10-Minute Unpaid Order Expiration Background Job ---
  public async checkAndExpireUnpaidOrders(): Promise<number> {
    const now = Date.now();
    let expiredCount = 0;

    for (const order of this.orders.values()) {
      if (order.status === 'pending_payment' && order.paymentStatus === 'pending') {
        const deadlineTime = new Date(order.paymentDeadline).getTime();
        if (now > deadlineTime) {
          order.status = 'expired';
          order.paymentStatus = 'expired';
          order.updatedAt = new Date().toISOString();

          // Atomically release stock
          await this.releaseOrderStockAtomic(order.id);

          const canteen = this.canteens.get(order.canteenId);
          const ownerUserId = order.canteenId === 'canteen_a' ? 'user_owner_a' : 'user_owner_b';

          // Notify student
          this.addNotification({
            userId: order.studentId,
            orderId: order.id,
            canteenId: order.canteenId,
            type: 'payment_expired',
            title: `Order ${order.token} Expired`,
            message: `The 10-minute payment window for Order ${order.token} elapsed without confirmation. Reserved items have been released.`,
          });

          // Notify owner
          this.addNotification({
            userId: ownerUserId,
            orderId: order.id,
            canteenId: order.canteenId,
            type: 'payment_expired',
            title: `Unpaid Order ${order.token} Timed Out`,
            message: `Order ${order.token} hold has expired. Inventory was safely restored to the live menu.`,
          });

          expiredCount++;
        }
      }
    }

    if (expiredCount > 0) {
      this.recalculateCanteenMetrics();
    }
    return expiredCount;
  }

  // --- Orders Accessors & Lifecycle Transitions ---
  public getOrder(id: string): Order | undefined {
    return this.orders.get(id);
  }

  public getOrdersByStudent(studentId: string): Order[] {
    return Array.from(this.orders.values())
      .filter((o) => o.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrdersByCanteen(canteenId: string): Order[] {
    return Array.from(this.orders.values())
      .filter((o) => o.canteenId === canteenId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    operatorUserId: string,
    reason?: string
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    const order = this.orders.get(orderId);
    if (!order) return { success: false, error: 'Order not found.' };

    const canteen = this.canteens.get(order.canteenId);
    const prevStatus = order.status;

    // Reject flow
    if (newStatus === 'rejected') {
      if (!reason || reason.trim().length === 0) {
        return { success: false, error: 'Mandatory rejection reason required.' };
      }
      order.status = 'rejected';
      order.rejectionReason = reason;
      order.updatedAt = new Date().toISOString();
      await this.releaseOrderStockAtomic(order.id);

      this.addNotification({
        userId: order.studentId,
        orderId: order.id,
        canteenId: order.canteenId,
        type: 'order_rejected',
        title: `Order ${order.token} Rejected`,
        message: `Your order was declined by kitchen staff. Reason: ${reason}.`,
      });

      this.recalculateCanteenMetrics();
      return { success: true, order };
    }

    // Cancel flow
    if (newStatus === 'cancelled') {
      order.status = 'cancelled';
      order.updatedAt = new Date().toISOString();
      await this.releaseOrderStockAtomic(order.id);
      this.recalculateCanteenMetrics();
      return { success: true, order };
    }

    // Progression states
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();

    if (newStatus === 'accepted') {
      this.addNotification({
        userId: order.studentId,
        orderId: order.id,
        canteenId: order.canteenId,
        type: 'order_accepted',
        title: `Order ${order.token} Accepted`,
        message: `${canteen?.name || 'Kitchen'} confirmed Order ${order.token}. Preparation will commence shortly.`,
      });
    } else if (newStatus === 'preparing') {
      this.addNotification({
        userId: order.studentId,
        orderId: order.id,
        canteenId: order.canteenId,
        type: 'order_preparing',
        title: `Order ${order.token} Is Cooking`,
        message: `Your food is currently on the grill/stove! Get ready for pickup soon.`,
      });
    } else if (newStatus === 'ready_for_pickup') {
      this.addNotification({
        userId: order.studentId,
        orderId: order.id,
        canteenId: order.canteenId,
        type: 'ready_for_pickup',
        title: `Order ${order.token} Ready For Pickup!`,
        message: `Hot food is packaged at the collection counter! Present your pickup QR or token ${order.token}.`,
      });
    }

    this.recalculateCanteenMetrics();
    return { success: true, order };
  }

  // --- Payment Confirmation & Retries ---
  public confirmOrderPayment(orderId: string, transactionId?: string): { success: boolean; order?: Order; error?: string } {
    const order = this.orders.get(orderId);
    if (!order) return { success: false, error: 'Order not found.' };
    if (order.status === 'expired' || order.status === 'cancelled') {
      return { success: false, error: 'Cannot pay an expired or cancelled order.' };
    }

    order.paymentStatus = 'paid';
    if (order.status === 'pending_payment') {
      order.status = 'awaiting_acceptance';
    }
    order.updatedAt = new Date().toISOString();

    const ownerUserId = order.canteenId === 'canteen_a' ? 'user_owner_a' : 'user_owner_b';
    this.addNotification({
      userId: order.studentId,
      orderId: order.id,
      canteenId: order.canteenId,
      type: 'payment_success',
      title: `Payment Confirmed: ₹${order.total}`,
      message: `Online payment verified for Order ${order.token}. Kitchen notified to begin preparation.`,
    });
    this.addNotification({
      userId: ownerUserId,
      orderId: order.id,
      canteenId: order.canteenId,
      type: 'order_placed',
      title: `Payment Verified: Order ${order.token}`,
      message: `${order.studentName} paid ₹${order.total}. Kitchen ticket unlocked for acceptance.`,
    });

    this.recalculateCanteenMetrics();
    return { success: true, order };
  }

  public failOrderPayment(orderId: string, reason?: string): { success: boolean; order?: Order } {
    const order = this.orders.get(orderId);
    if (!order) return { success: false };
    order.paymentStatus = 'failed';
    order.updatedAt = new Date().toISOString();

    this.addNotification({
      userId: order.studentId,
      orderId: order.id,
      canteenId: order.canteenId,
      type: 'payment_pending',
      title: `Payment Failed for Order ${order.token}`,
      message: reason || 'Online transaction declined. You can retry payment before the 10-minute hold expires.',
    });
    return { success: true, order };
  }

  // --- QR & Token Pickup Verification with Anti-Replay Protection ---
  public verifyAndCollectPickup(
    canteenId: string,
    qrOrToken: string,
    verifiedByUserId: string
  ): { success: boolean; order?: Order; error?: string } {
    const trimmed = qrOrToken.trim();
    // Match either by cryptographic qrToken or by human-readable token e.g. A101
    const order = Array.from(this.orders.values()).find(
      (o) => o.canteenId === canteenId && (o.qrToken === trimmed || o.token.toUpperCase() === trimmed.toUpperCase())
    );

    if (!order) {
      return { success: false, error: 'No matching order found for this token or QR code at your canteen counter.' };
    }

    // Replay protection: cannot collect twice
    if (order.status === 'collected') {
      return {
        success: false,
        error: `Replay Prevented: Order ${order.token} was already collected at ${new Date(order.collectedAt || '').toLocaleTimeString()}. Duplicate claim rejected.`,
      };
    }

    // Terminal checks
    if (order.status === 'cancelled' || order.status === 'rejected' || order.status === 'expired') {
      return { success: false, error: `Invalid pickup: Order ${order.token} is currently ${order.status}.` };
    }

    // Payment validation
    if (order.paymentStatus !== 'paid' && order.paymentMethod !== 'cash') {
      return { success: false, error: `Cannot collect Order ${order.token}: Online payment status is "${order.paymentStatus}".` };
    }

    // Mark as collected
    order.status = 'collected';
    order.collectedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    if (order.paymentMethod === 'cash') {
      order.paymentStatus = 'paid'; // Marked paid upon cash handoff at collection counter
    }

    // In-app notifications & feedback reminder
    this.addNotification({
      userId: order.studentId,
      orderId: order.id,
      canteenId: order.canteenId,
      type: 'order_collected',
      title: `Order ${order.token} Collected`,
      message: `Your food was successfully verified and collected at the counter. Enjoy your meal!`,
    });

    this.addNotification({
      userId: order.studentId,
      orderId: order.id,
      canteenId: order.canteenId,
      type: 'feedback_reminder',
      title: `How was your food? Rate Order ${order.token}`,
      message: `Share your review for ${order.items[0]?.name || 'your meal'} to help your campus food community.`,
      actionUrl: `/feedback?orderId=${order.id}`,
    });

    this.recalculateCanteenMetrics();
    return { success: true, order };
  }

  // --- Feedback & Reviews ---
  public submitFeedback(data: {
    orderId: string;
    studentId: string;
    studentName: string;
    itemId: string;
    rating: number;
    comment: string;
  }): { success: boolean; feedback?: FeedbackReview; error?: string } {
    const order = this.orders.get(data.orderId);
    if (!order) return { success: false, error: 'Order not found.' };

    if (order.status !== 'collected') {
      return { success: false, error: 'Feedback can only be submitted after the order has been collected.' };
    }

    if (order.studentId !== data.studentId) {
      return { success: false, error: 'Unauthorized to review orders belonging to other students.' };
    }

    const existing = this.feedback.find((f) => f.orderId === data.orderId && f.itemId === data.itemId);
    if (existing) {
      return { success: false, error: 'You have already reviewed this item from this order.' };
    }

    const dbItem = this.menuItems.get(data.itemId);
    const newFeedback: FeedbackReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderId: data.orderId,
      canteenId: order.canteenId,
      studentId: data.studentId,
      studentName: data.studentName,
      itemId: data.itemId,
      itemName: dbItem?.name || 'Food Item',
      rating: Math.max(1, Math.min(5, Math.round(data.rating))),
      comment: data.comment.trim(),
      createdAt: new Date().toISOString(),
    };

    this.feedback.unshift(newFeedback);
    return { success: true, feedback: newFeedback };
  }

  public getFeedbackByCanteen(canteenId: string): FeedbackReview[] {
    return this.feedback.filter((f) => f.canteenId === canteenId);
  }

  public getFeedbackByItem(itemId: string): FeedbackReview[] {
    return this.feedback.filter((f) => f.itemId === itemId);
  }

  // --- Notifications ---
  public addNotification(notification: Omit<InAppNotification, 'id' | 'createdAt' | 'isRead'>): InAppNotification {
    const newNotif: InAppNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(newNotif);
    return newNotif;
  }

  public getNotificationsByUser(userId: string): InAppNotification[] {
    return this.notifications.filter((n) => n.userId === userId);
  }

  public markNotificationAsRead(id: string): boolean {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      return true;
    }
    return false;
  }

  public markAllNotificationsAsRead(userId: string): void {
    this.notifications.forEach((n) => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });
  }

  // --- Break-Time Smart Recommender ---
  public getSmartBreakRecommendations(params: {
    breakMinutes: number;
    maxWaitMinutes?: number;
    category?: string;
    maxBudget?: number;
  }): { recommendations: (MenuItem & { estimatedReadyMinutes: number; fitsBreak: boolean; reason: string })[]; canteenSummary: { [canteenId: string]: { crowdLevel: string; wait: number } } } {
    this.recalculateCanteenMetrics();
    const { breakMinutes, maxWaitMinutes = breakMinutes - 5, category, maxBudget } = params;

    const results: (MenuItem & { estimatedReadyMinutes: number; fitsBreak: boolean; reason: string })[] = [];

    const canteenSummary: { [canteenId: string]: { crowdLevel: string; wait: number } } = {
      canteen_a: {
        crowdLevel: this.canteens.get('canteen_a')?.crowdLevel || 'Low',
        wait: this.canteens.get('canteen_a')?.estimatedWaitMinutes || 5,
      },
      canteen_b: {
        crowdLevel: this.canteens.get('canteen_b')?.crowdLevel || 'Low',
        wait: this.canteens.get('canteen_b')?.estimatedWaitMinutes || 5,
      },
    };

    for (const item of this.menuItems.values()) {
      if (!item.isActive || !item.isAvailable || item.stockQuantity <= 0) continue;
      const canteen = this.canteens.get(item.canteenId);
      if (!canteen || !canteen.isOpen) continue;
      if (item.isLunchOnly && !canteen.lunchActive) continue;

      if (category && category !== 'all' && item.category !== category) continue;
      if (maxBudget && item.basePrice > maxBudget) continue;

      // Realistic formula: item prep time + queue delay estimate
      const queueWait = Math.round((canteen.currentWorkloadMinutes * 0.3) + 2);
      const estimatedReadyMinutes = item.prepTimeMinutes + queueWait;
      const fitsBreak = estimatedReadyMinutes <= maxWaitMinutes;

      let reason = `Ready in ~${estimatedReadyMinutes}m (Prep ${item.prepTimeMinutes}m + ${canteen.name} queue ~${queueWait}m)`;
      if (fitsBreak) {
        reason += ` — Leaves you ${breakMinutes - estimatedReadyMinutes}m to eat comfortably!`;
      } else {
        reason += ` — Exceeds your target wait window of ${maxWaitMinutes}m.`;
      }

      results.push({
        ...item,
        estimatedReadyMinutes,
        fitsBreak,
        reason,
      });
    }

    // Sort: items that fit break first, then lowest prep time
    results.sort((a, b) => {
      if (a.fitsBreak && !b.fitsBreak) return -1;
      if (!a.fitsBreak && b.fitsBreak) return 1;
      return a.estimatedReadyMinutes - b.estimatedReadyMinutes;
    });

    return { recommendations: results, canteenSummary };
  }

  // --- Owner Analytics & Reporting ---
  public getCanteenAnalytics(canteenId: string): CanteenAnalytics {
    this.recalculateCanteenMetrics();
    const canteen = this.canteens.get(canteenId);
    const canteenOrders = Array.from(this.orders.values()).filter((o) => o.canteenId === canteenId);

    const activeOrders = canteenOrders.filter((o) => ['awaiting_acceptance', 'accepted', 'preparing', 'ready_for_pickup'].includes(o.status));
    const completedOrders = canteenOrders.filter((o) => o.status === 'collected');
    const cancelledOrders = canteenOrders.filter((o) => ['rejected', 'cancelled', 'expired'].includes(o.status));
    const paidOrders = canteenOrders.filter((o) => o.paymentStatus === 'paid');
    const pendingPaymentOrders = canteenOrders.filter((o) => o.paymentStatus === 'pending');

    // Confirmed revenue: ONLY paid orders count (unpaid and failed are strictly excluded!)
    const confirmedRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

    // Popular items calculation
    const itemMap = new Map<string, { count: number; revenue: number }>();
    paidOrders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = itemMap.get(item.name) || { count: 0, revenue: 0 };
        itemMap.set(item.name, {
          count: existing.count + item.quantity,
          revenue: existing.revenue + item.itemTotal,
        });
      });
    });

    const popularItems = Array.from(itemMap.entries())
      .map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Low stock items
    const canteenItems = Array.from(this.menuItems.values()).filter((i) => i.canteenId === canteenId);
    const lowStockItems = canteenItems
      .filter((i) => i.stockQuantity <= i.lowStockThreshold)
      .map((i) => ({ name: i.name, stock: i.stockQuantity, threshold: i.lowStockThreshold }));

    // Feedback average
    const reviews = this.feedback.filter((f) => f.canteenId === canteenId);
    const avgRating = reviews.length > 0 ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)) : 5.0;

    return {
      canteenId,
      canteenName: canteen?.name || 'Canteen',
      todayOrdersCount: canteenOrders.length,
      activeOrdersCount: activeOrders.length,
      completedOrdersCount: completedOrders.length,
      cancelledOrdersCount: cancelledOrders.length,
      paidOrdersCount: paidOrders.length,
      pendingPaymentOrdersCount: pendingPaymentOrders.length,
      confirmedRevenue,
      popularItems,
      lowStockItems,
      averageRating: avgRating,
      totalReviews: reviews.length,
      crowdIndex: canteen?.crowdIndex || 0,
    };
  }
}

// Global Singleton Database Instance
export const db = new Database();
