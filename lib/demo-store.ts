import fs from "node:fs";
import path from "node:path";

type DemoUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  location: string;
  mobileNumber?: string;
  profileImage?: string;
  shippingAddress?: string;
};

type DemoProduct = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  size: string;
  rating: number;
  stock: number;
  frontImage: string;
  sideImage: string;
  backImage: string;
  createdAt: string;
};

type DemoCartItem = {
  userId: string;
  productId: string;
  quantity: number;
};

type DemoChat = {
  id: string;
  conversationId: string;
  ownerId: string;
  participantId?: string;
  participantEmail?: string;
  senderId?: string;
  senderName: string;
  senderEmail: string;
  senderProfileImage?: string;
  productId?: string;
  message: string;
  location?: {
    latitude: number;
    longitude: number;
    label?: string;
    sharedAt: string;
  };
  createdAt: string;
};

type DemoWishlistItem = {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
};

type DemoReview = {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type DemoOrderItem = {
  productId: string;
  ownerId: string;
  title: string;
  price: number;
  quantity: number;
  frontImage: string;
};

type DemoOrder = {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  location: string;
  paymentMethod: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  mobileMoneyCharge: number;
  discountAmount: number;
  total: number;
  couponCode?: string;
  items: DemoOrderItem[];
  createdAt: string;
};

type DemoNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  channel: string;
  status: string;
  relatedOrderId?: string;
  relatedProductId?: string;
  createdAt: string;
};

type DemoStore = {
  users: DemoUser[];
  products: DemoProduct[];
  cartItems: DemoCartItem[];
  chats: DemoChat[];
  wishlistItems: DemoWishlistItem[];
  reviews: DemoReview[];
  orders: DemoOrder[];
  notifications: DemoNotification[];
};

declare global {
  // eslint-disable-next-line no-var
  var shopnetDemoStore: DemoStore | undefined;
}

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function resolveDemoStorePath() {
  const envPath = process.env.DEMO_STORE_FILE_PATH?.trim();
  if (envPath) {
    return path.isAbsolute(envPath) ? envPath : path.join(process.cwd(), envPath);
  }

  return path.join(process.cwd(), ".shopnet-demo-store.json");
}

const demoStorePath = resolveDemoStorePath();

const initialStore: DemoStore = {
  users: [],
  products: [],
  cartItems: [],
  chats: [],
  wishlistItems: [],
  reviews: [],
  orders: [],
  notifications: []
};

function cloneInitialStore(): DemoStore {
  return {
    users: [],
    products: [],
    cartItems: [],
    chats: [],
    wishlistItems: [],
    reviews: [],
    orders: [],
    notifications: []
  };
}

function normalizeLoadedStore(data: unknown): DemoStore {
  const incoming = (data || {}) as Partial<DemoStore>;
  const fallback = cloneInitialStore();

  return {
    users: Array.isArray(incoming.users) ? incoming.users : fallback.users,
    products: Array.isArray(incoming.products) ? incoming.products : fallback.products,
    cartItems: Array.isArray(incoming.cartItems) ? incoming.cartItems : fallback.cartItems,
    chats: Array.isArray(incoming.chats) ? incoming.chats : fallback.chats,
    wishlistItems: Array.isArray(incoming.wishlistItems)
      ? incoming.wishlistItems
      : fallback.wishlistItems,
    reviews: Array.isArray(incoming.reviews) ? incoming.reviews : fallback.reviews,
    orders: Array.isArray(incoming.orders) ? incoming.orders : fallback.orders,
    notifications: Array.isArray(incoming.notifications)
      ? incoming.notifications
      : fallback.notifications
  };
}

function loadDemoStoreFromDisk() {
  try {
    if (!fs.existsSync(demoStorePath)) {
      return cloneInitialStore();
    }

    const raw = fs.readFileSync(demoStorePath, "utf8");
    if (!raw.trim()) {
      return cloneInitialStore();
    }

    return normalizeLoadedStore(JSON.parse(raw));
  } catch {
    return cloneInitialStore();
  }
}

export const demoStore = global.shopnetDemoStore || loadDemoStoreFromDisk();

global.shopnetDemoStore = demoStore;

export function persistDemoStore() {
  try {
    const folderPath = path.dirname(demoStorePath);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    fs.writeFileSync(demoStorePath, JSON.stringify(demoStore, null, 2), "utf8");
  } catch {
    // Ignore persistence failures; demo store should never crash app flow.
  }
}

export { createId };
