type DemoUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
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

declare global {
  // eslint-disable-next-line no-var
  var shopnetDemoStore:
    | {
        users: DemoUser[];
        products: DemoProduct[];
        cartItems: DemoCartItem[];
        chats: DemoChat[];
        wishlistItems: DemoWishlistItem[];
        reviews: DemoReview[];
        orders: DemoOrder[];
        notifications: DemoNotification[];
      }
    | undefined;
}

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const initialStore = {
  users: [] as DemoUser[],
  products: [
    {
      id: createId("prd"),
      ownerId: "demo_seller",
      title: "Classic Sneaker",
      description:
        "A clean everyday sneaker with front, side, and back photos for confident shopping.",
      category: "Fashion",
      price: 85000,
      size: "42",
      rating: 4.5,
      stock: 8,
      frontImage:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
      sideImage:
        "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80",
      backImage:
        "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80",
      createdAt: new Date().toISOString()
    }
  ],
  cartItems: [] as DemoCartItem[],
  chats: [] as DemoChat[],
  wishlistItems: [] as DemoWishlistItem[],
  reviews: [] as DemoReview[],
  orders: [] as DemoOrder[],
  notifications: [] as DemoNotification[]
};

export const demoStore = global.shopnetDemoStore || initialStore;

global.shopnetDemoStore = demoStore;

export { createId };
