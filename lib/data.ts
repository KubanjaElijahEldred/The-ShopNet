import bcrypt from "bcryptjs";
import { demoStore, createId } from "@/lib/demo-store";
import { connectToDatabase, dbEnabled } from "@/lib/db";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { CartItem } from "@/models/CartItem";
import { ChatMessage } from "@/models/ChatMessage";
import { WishlistItem } from "@/models/WishlistItem";
import { Review } from "@/models/Review";
import { Order } from "@/models/Order";
import { calculateCartTotals } from "@/lib/pricing";
import { Notification } from "@/models/Notification";
import { sendMobileAlert } from "@/lib/sms";

type SignupInput = {
  name: string;
  email: string;
  password: string;
  location: string;
  mobileNumber?: string;
  profileImage?: string;
  shippingAddress?: string;
};

type ProductInput = {
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
};

type ChatInput = {
  conversationId?: string;
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
};

type ReviewInput = {
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
};

type CreateOrderInput = {
  userId: string;
  userName: string;
  location: string;
  paymentMethod: string;
  couponCode?: string;
};

type OrderItemData = {
  productId: string;
  ownerId: string;
  title: string;
  price: number;
  quantity: number;
  frontImage: string;
};

type OrderData = {
  id: string;
  userId: string;
  userName: string;
  location: string;
  paymentMethod: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  mobileMoneyCharge: number;
  total: number;
  couponCode?: string;
  items: OrderItemData[];
  createdAt: string;
};

type NotificationInput = {
  userId: string;
  title: string;
  body: string;
  channel?: string;
  status?: string;
  relatedOrderId?: string;
  relatedProductId?: string;
};

function stringifyId(value: unknown) {
  return String(value);
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value != null;
}

function sortProducts<T extends { price: number; rating: number; createdAt?: string }>(
  products: T[],
  sortBy = "newest"
) {
  const sorted = [...products];

  if (sortBy === "price-asc") {
    return sorted.sort((a, b) => a.price - b.price);
  }

  if (sortBy === "price-desc") {
    return sorted.sort((a, b) => b.price - a.price);
  }

  if (sortBy === "rating-desc") {
    return sorted.sort((a, b) => b.rating - a.rating);
  }

  return sorted.sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );
}

export async function createUser(input: SignupInput) {
  const passwordHash = await bcrypt.hash(input.password, 10);

  if (dbEnabled) {
    await connectToDatabase();

    const existing = await User.findOne({ email: input.email.toLowerCase() });
    if (existing) {
      throw new Error("An account with that email already exists.");
    }

    const user = await User.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      location: input.location,
      mobileNumber: input.mobileNumber || undefined,
      profileImage: input.profileImage || undefined,
      shippingAddress: input.shippingAddress || undefined
    });

    return {
      id: stringifyId(user._id),
      name: user.name,
      email: user.email,
      location: user.location,
      mobileNumber: user.mobileNumber,
      profileImage: user.profileImage,
      shippingAddress: user.shippingAddress
    };
  }

  const existing = demoStore.users.find(
    (user) => user.email.toLowerCase() === input.email.toLowerCase()
  );

  if (existing) {
    throw new Error("An account with that email already exists.");
  }

  const user = {
    id: createId("usr"),
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    location: input.location,
    mobileNumber: input.mobileNumber || undefined,
    profileImage: input.profileImage || undefined,
    shippingAddress: input.shippingAddress || undefined
  };

  demoStore.users.push(user);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    location: user.location,
    mobileNumber: user.mobileNumber,
    profileImage: user.profileImage,
    shippingAddress: user.shippingAddress
  };
}

export async function authenticateUser(email: string, password: string) {
  if (dbEnabled) {
    await connectToDatabase();
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return null;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return null;
    }

    return {
      id: stringifyId(user._id),
      name: user.name,
      email: user.email,
      location: user.location,
      mobileNumber: user.mobileNumber,
      profileImage: user.profileImage,
      shippingAddress: user.shippingAddress
    };
  }

  const user = demoStore.users.find(
    (candidate) => candidate.email.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    return null;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    location: user.location,
    mobileNumber: user.mobileNumber,
    profileImage: user.profileImage,
    shippingAddress: user.shippingAddress
  };
}

export async function updateUserProfile(
  userId: string,
  payload: {
    mobileNumber: string;
    profileImage?: string;
    shippingAddress?: string;
  }
) {
  if (dbEnabled) {
    await connectToDatabase();
    const user = await User.findByIdAndUpdate(
      userId,
      {
        mobileNumber: payload.mobileNumber,
        profileImage: payload.profileImage || undefined,
        shippingAddress: payload.shippingAddress || undefined
      },
      { new: true }
    );

    if (!user) {
      throw new Error("User not found.");
    }

    return {
      id: stringifyId(user._id),
      name: user.name,
      email: user.email,
      location: user.location,
      mobileNumber: user.mobileNumber,
      profileImage: user.profileImage,
      shippingAddress: user.shippingAddress
    };
  }

  const user = demoStore.users.find((item) => item.id === userId);
  if (!user) {
    throw new Error("User not found.");
  }

  user.mobileNumber = payload.mobileNumber;
  user.profileImage = payload.profileImage || undefined;
  user.shippingAddress = payload.shippingAddress || undefined;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    location: user.location,
    mobileNumber: user.mobileNumber,
    profileImage: user.profileImage,
    shippingAddress: user.shippingAddress
  };
}

export async function getUserPublicProfiles() {
  if (dbEnabled) {
    try {
      await connectToDatabase();
      const users = await User.find().lean();
      return users.map((user) => ({
        id: stringifyId(user._id),
        name: user.name,
        email: user.email,
        location: user.location,
        mobileNumber: user.mobileNumber,
        profileImage: user.profileImage,
        shippingAddress: user.shippingAddress
      }));
    } catch (error) {
      console.error(
        "MongoDB read failed in getUserPublicProfiles; falling back to demo data.",
        error
      );
    }
  }

  return demoStore.users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    location: user.location,
    mobileNumber: user.mobileNumber,
    profileImage: user.profileImage,
    shippingAddress: user.shippingAddress
  }));
}

export async function createNotification(input: NotificationInput) {
  if (dbEnabled) {
    await connectToDatabase();
    const notification = await Notification.create({
      channel: "account",
      status: "unread",
      ...input
    });

    return {
      id: stringifyId(notification._id),
      userId: notification.userId,
      title: notification.title,
      body: notification.body,
      channel: notification.channel,
      status: notification.status,
      relatedOrderId: notification.relatedOrderId,
      relatedProductId: notification.relatedProductId,
      createdAt: notification.createdAt?.toString?.() || new Date().toISOString()
    };
  }

  const notification = {
    id: createId("ntf"),
    channel: "account",
    status: "unread",
    ...input,
    createdAt: new Date().toISOString()
  };

  demoStore.notifications.push(notification);
  return notification;
}

export async function getNotificationsForUser(userId: string) {
  if (dbEnabled) {
    try {
      await connectToDatabase();
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .lean();

      return notifications.map((notification) => ({
        id: stringifyId(notification._id),
        userId: notification.userId,
        title: notification.title,
        body: notification.body,
        channel: notification.channel,
        status: notification.status,
        relatedOrderId: notification.relatedOrderId,
        relatedProductId: notification.relatedProductId,
        createdAt: notification.createdAt?.toString?.() || ""
      }));
    } catch (error) {
      console.error(
        "MongoDB read failed in getNotificationsForUser; falling back to demo data.",
        error
      );
    }
  }

  return [...demoStore.notifications]
    .filter((notification) => notification.userId === userId)
    .reverse();
}

export async function getProducts() {
  if (dbEnabled) {
    try {
      await connectToDatabase();
      const products = await Product.find().sort({ createdAt: -1 }).lean();
      return products.map((product) => ({
        id: stringifyId(product._id),
        ownerId: product.ownerId,
        title: product.title,
        description: product.description,
        category: product.category,
        price: product.price,
        size: product.size,
        rating: product.rating,
        stock: product.stock,
        frontImage: product.frontImage,
        sideImage: product.sideImage,
        backImage: product.backImage,
        createdAt: product.createdAt?.toString?.() || ""
      }));
    } catch (error) {
      // Keep the UI available even when MongoDB is temporarily unreachable.
      console.error("MongoDB read failed in getProducts; falling back to demo data.", error);
    }
  }

  return [...demoStore.products].reverse();
}

export async function getFilteredProducts(options?: {
  query?: string;
  category?: string;
  sortBy?: string;
}) {
  const allProducts = await getProducts();
  const query = options?.query?.toLowerCase().trim();
  const category = options?.category?.trim();

  const filtered = allProducts.filter((product) => {
    const matchesQuery = query
      ? [product.title, product.description, product.category]
          .join(" ")
          .toLowerCase()
          .includes(query)
      : true;
    const matchesCategory = category ? product.category === category : true;
    return matchesQuery && matchesCategory;
  });

  return sortProducts(filtered, options?.sortBy);
}

export async function createProduct(input: ProductInput) {
  if (dbEnabled) {
    await connectToDatabase();
    const product = await Product.create(input);
    return {
      id: stringifyId(product._id),
      ...input
    };
  }

  const product = {
    id: createId("prd"),
    ...input,
    createdAt: new Date().toISOString()
  };

  demoStore.products.push(product);
  return product;
}

export async function addCartItem(userId: string, productId: string, quantity: number) {
  if (dbEnabled) {
    await connectToDatabase();
    const existing = await CartItem.findOne({ userId, productId });

    if (existing) {
      existing.quantity += quantity;
      await existing.save();
      return existing;
    }

    return CartItem.create({ userId, productId, quantity });
  }

  const existing = demoStore.cartItems.find(
    (item) => item.userId === userId && item.productId === productId
  );

  if (existing) {
    existing.quantity += quantity;
    return existing;
  }

  const item = { userId, productId, quantity };
  demoStore.cartItems.push(item);
  return item;
}

export async function updateCartItemQuantity(
  userId: string,
  productId: string,
  quantity: number
) {
  if (dbEnabled) {
    await connectToDatabase();

    if (quantity <= 0) {
      await CartItem.deleteOne({ userId, productId });
      return;
    }

    await CartItem.updateOne({ userId, productId }, { quantity }, { upsert: true });
    return;
  }

  const item = demoStore.cartItems.find(
    (entry) => entry.userId === userId && entry.productId === productId
  );

  if (!item) {
    return;
  }

  if (quantity <= 0) {
    demoStore.cartItems = demoStore.cartItems.filter(
      (entry) => !(entry.userId === userId && entry.productId === productId)
    );
    return;
  }

  item.quantity = quantity;
}

export async function removeCartItem(userId: string, productId: string) {
  return updateCartItemQuantity(userId, productId, 0);
}

export async function getCartItems(userId: string) {
  const products = await getProducts();
  const hasProduct = <T extends { product: unknown }>(
    item: T
  ): item is T & { product: NonNullable<T["product"]> } => Boolean(item.product);

  if (dbEnabled) {
    try {
      await connectToDatabase();
      const items = await CartItem.find({ userId }).lean();
      return items
        .map((item) => ({
          quantity: item.quantity,
          product: products.find((product) => product.id === item.productId)
        }))
        .filter(hasProduct);
    } catch (error) {
      console.error("MongoDB read failed in getCartItems; falling back to demo data.", error);
    }
  }

  return demoStore.cartItems
    .filter((item) => item.userId === userId)
    .map((item) => ({
      quantity: item.quantity,
      product: products.find((product) => product.id === item.productId)
    }))
    .filter(hasProduct);
}

export async function clearCart(userId: string) {
  if (dbEnabled) {
    await connectToDatabase();
    await CartItem.deleteMany({ userId });
    return;
  }

  demoStore.cartItems = demoStore.cartItems.filter((item) => item.userId !== userId);
}

export async function addWishlistItem(userId: string, productId: string) {
  if (dbEnabled) {
    await connectToDatabase();
    const existing = await WishlistItem.findOne({ userId, productId });
    if (existing) {
      return { id: stringifyId(existing._id), userId, productId };
    }

    const item = await WishlistItem.create({ userId, productId });
    return { id: stringifyId(item._id), userId, productId };
  }

  const existing = demoStore.wishlistItems.find(
    (item) => item.userId === userId && item.productId === productId
  );

  if (existing) {
    return existing;
  }

  const item = {
    id: createId("wsh"),
    userId,
    productId,
    createdAt: new Date().toISOString()
  };

  demoStore.wishlistItems.push(item);
  return item;
}

export async function removeWishlistItem(userId: string, productId: string) {
  if (dbEnabled) {
    await connectToDatabase();
    await WishlistItem.deleteOne({ userId, productId });
    return;
  }

  demoStore.wishlistItems = demoStore.wishlistItems.filter(
    (item) => !(item.userId === userId && item.productId === productId)
  );
}

export async function getWishlistItems(userId: string) {
  const products = await getProducts();

  if (dbEnabled) {
    try {
      await connectToDatabase();
      const items = await WishlistItem.find({ userId }).lean();
      return items
        .map((item) => products.find((product) => product.id === item.productId))
        .filter(isPresent);
    } catch (error) {
      console.error(
        "MongoDB read failed in getWishlistItems; falling back to demo data.",
        error
      );
    }
  }

  return demoStore.wishlistItems
    .filter((item) => item.userId === userId)
    .map((item) => products.find((product) => product.id === item.productId))
    .filter(isPresent);
}

export async function createReview(input: ReviewInput) {
  if (dbEnabled) {
    await connectToDatabase();
    const review = await Review.create(input);
    return {
      id: stringifyId(review._id),
      ...input,
      createdAt: review.createdAt?.toString?.() || new Date().toISOString()
    };
  }

  const review = {
    id: createId("rvw"),
    ...input,
    createdAt: new Date().toISOString()
  };

  demoStore.reviews.push(review);
  return review;
}

export async function getReviews(productId?: string) {
  if (dbEnabled) {
    try {
      await connectToDatabase();
      const query = productId ? { productId } : {};
      const reviews = await Review.find(query).sort({ createdAt: -1 }).lean();
      return reviews.map((review) => ({
        id: stringifyId(review._id),
        productId: review.productId,
        userId: review.userId,
        userName: review.userName,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt?.toString?.() || ""
      }));
    } catch (error) {
      console.error("MongoDB read failed in getReviews; falling back to demo data.", error);
    }
  }

  return [...demoStore.reviews]
    .filter((review) => (productId ? review.productId === productId : true))
    .reverse();
}

export async function getReviewSummaryMap() {
  const reviews = await getReviews();
  const map = new Map<
    string,
    { averageRating: number; reviewCount: number; reviews: Awaited<ReturnType<typeof getReviews>> }
  >();

  for (const review of reviews) {
    const current = map.get(review.productId) || {
      averageRating: 0,
      reviewCount: 0,
      reviews: []
    };
    current.reviews.push(review);
    current.reviewCount += 1;
    current.averageRating =
      current.reviews.reduce((sum, item) => sum + item.rating, 0) /
      current.reviewCount;
    map.set(review.productId, current);
  }

  return map;
}

export async function createOrder(input: CreateOrderInput) {
  const cartItems = await getCartItems(input.userId);
  if (cartItems.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const items = cartItems.map((item) => ({
    productId: item.product.id,
    ownerId: item.product.ownerId,
    title: item.product.title,
    price: item.product.price,
    quantity: item.quantity,
    frontImage: item.product.frontImage
  }));

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totals = calculateCartTotals(
    subtotal,
    input.location,
    input.paymentMethod,
    input.couponCode
  );
  let createdOrder: OrderData;

  if (dbEnabled) {
    await connectToDatabase();
    const order = await Order.create({
      ...input,
      status: "Pending",
      ...totals,
      couponCode: input.couponCode,
      items
    });
    await clearCart(input.userId);
    createdOrder = {
      id: stringifyId(order._id),
      ...input,
      status: "Pending",
      ...totals,
      couponCode: input.couponCode,
      items,
      createdAt: order.createdAt?.toString?.() || new Date().toISOString()
    };
  } else {
    const order = {
      id: createId("ord"),
      ...input,
      status: "Pending",
      ...totals,
      couponCode: input.couponCode,
      items,
      createdAt: new Date().toISOString()
    };

    demoStore.orders.push(order);
    await clearCart(input.userId);
    createdOrder = order;
  }

  await decrementInventoryForOrder(items, input.userName, createdOrder.id);

  const sellerProfiles = await getUserPublicProfiles();
  const uniqueOwnerIds = [...new Set(items.map((item) => item.ownerId))];

  for (const ownerId of uniqueOwnerIds) {
    const ownerItems = items.filter((item) => item.ownerId === ownerId);
    const ownerProfile = sellerProfiles.find((profile) => profile.id === ownerId);
    const body = `${input.userName} is trying to purchase ${ownerItems
      .map((item) => item.title)
      .join(", ")}.`;

    await createNotification({
      userId: ownerId,
      title: "New purchase attempt",
      body,
      relatedOrderId: createdOrder.id,
      relatedProductId: ownerItems[0]?.productId
    });

    if (ownerProfile?.mobileNumber) {
      await sendMobileAlert(ownerProfile.mobileNumber, body);
    }
  }

  return createdOrder;
}

async function decrementInventoryForOrder(
  items: OrderItemData[],
  buyerName: string,
  orderId: string
) {
  const grouped = new Map<string, number>();

  for (const item of items) {
    grouped.set(item.productId, (grouped.get(item.productId) || 0) + item.quantity);
  }

  if (dbEnabled) {
    await connectToDatabase();

    for (const [productId, quantity] of grouped.entries()) {
      const product = await Product.findByIdAndUpdate(
        productId,
        { $inc: { stock: -quantity } },
        { new: true }
      );

      if (product && product.stock <= 2) {
        await createNotification({
          userId: product.ownerId,
          title: "Low stock alert",
          body: `${product.title} is low on stock after ${buyerName}'s order.`,
          relatedOrderId: orderId,
          relatedProductId: productId
        });
      }
    }

    return;
  }

  for (const [productId, quantity] of grouped.entries()) {
    const product = demoStore.products.find((entry) => entry.id === productId);
    if (!product) {
      continue;
    }

    product.stock = Math.max(0, product.stock - quantity);

    if (product.stock <= 2) {
      await createNotification({
        userId: product.ownerId,
        title: "Low stock alert",
        body: `${product.title} is low on stock after ${buyerName}'s order.`,
        relatedOrderId: orderId,
        relatedProductId: productId
      });
    }
  }
}

export async function getOrdersForUser(userId: string) {
  if (dbEnabled) {
    try {
      await connectToDatabase();
      const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
      return orders.map((order) => ({
        id: stringifyId(order._id),
        userId: order.userId,
        userName: order.userName,
        location: order.location,
        paymentMethod: order.paymentMethod,
        status: order.status,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        discountAmount: order.discountAmount || 0,
        mobileMoneyCharge: order.mobileMoneyCharge,
        total: order.total,
        couponCode: order.couponCode,
        items: order.items,
        createdAt: order.createdAt?.toString?.() || ""
      }));
    } catch (error) {
      console.error("MongoDB read failed in getOrdersForUser; falling back to demo data.", error);
    }
  }

  return [...demoStore.orders]
    .filter((order) => order.userId === userId)
    .reverse();
}

export async function getOrdersForSeller(ownerId: string) {
  let allOrders: OrderData[] = [...demoStore.orders].reverse();

  if (dbEnabled) {
    try {
      await connectToDatabase();
      const orders = await Order.find().sort({ createdAt: -1 }).lean();
      allOrders = orders.map((order) => ({
        id: stringifyId(order._id),
        userId: order.userId,
        userName: order.userName,
        location: order.location,
        paymentMethod: order.paymentMethod,
        status: order.status,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        discountAmount: order.discountAmount || 0,
        mobileMoneyCharge: order.mobileMoneyCharge,
        total: order.total,
        couponCode: order.couponCode,
        items: order.items,
        createdAt: order.createdAt?.toString?.() || ""
      }));
    } catch (error) {
      console.error(
        "MongoDB read failed in getOrdersForSeller; falling back to demo data.",
        error
      );
    }
  }

  return allOrders
    .map((order) => ({
      ...order,
      items: order.items.filter((item: OrderItemData) => item.ownerId === ownerId)
    }))
    .filter((order) => order.items.length > 0);
}

export async function updateOrderStatus(
  orderId: string,
  userId: string,
  nextStatus: string
) {
  if (dbEnabled) {
    await connectToDatabase();
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error("Order not found.");
    }

    const isBuyer = order.userId === userId;
    const isSeller = order.items.some((item: OrderItemData) => item.ownerId === userId);

    if (!isBuyer && !isSeller) {
      throw new Error("You cannot update this order.");
    }

    if (isBuyer && !["Cancelled", "Return Requested"].includes(nextStatus)) {
      throw new Error("Buyers can only cancel or request returns.");
    }

    order.status = nextStatus;
    await order.save();
    return { id: stringifyId(order._id), status: order.status };
  }

  const order = demoStore.orders.find((entry) => entry.id === orderId);
  if (!order) {
    throw new Error("Order not found.");
  }

  const isBuyer = order.userId === userId;
  const isSeller = order.items.some((item) => item.ownerId === userId);

  if (!isBuyer && !isSeller) {
    throw new Error("You cannot update this order.");
  }

  if (isBuyer && !["Cancelled", "Return Requested"].includes(nextStatus)) {
    throw new Error("Buyers can only cancel or request returns.");
  }

  order.status = nextStatus;
  return { id: order.id, status: order.status };
}

export async function getAdminOverview() {
  const [users, products] = await Promise.all([getUserPublicProfiles(), getProducts()]);
  let orders = [...demoStore.orders].reverse().map((order) => ({
    id: order.id,
    userName: order.userName,
    status: order.status,
    total: order.total,
    createdAt: order.createdAt
  }));
  let notificationCount = demoStore.notifications.length;

  if (dbEnabled) {
    try {
      await connectToDatabase();
      const [result, count] = await Promise.all([
        Order.find().sort({ createdAt: -1 }).lean(),
        Notification.countDocuments()
      ]);

      orders = result.map((order) => ({
        id: stringifyId(order._id),
        userName: order.userName,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt?.toString?.() || ""
      }));
      notificationCount = count;
    } catch (error) {
      console.error(
        "MongoDB read failed in getAdminOverview; falling back to demo data.",
        error
      );
    }
  }

  return {
    userCount: users.length,
    productCount: products.length,
    orderCount: orders.length,
    notificationCount,
    totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
    recentOrders: orders.slice(0, 10),
    recentProducts: products.slice(0, 10),
    users: users.slice(0, 10)
  };
}

export async function getSellerDashboard(ownerId: string) {
  const products = await getProducts();
  const reviews = await getReviews();
  const orders = await getOrdersForSeller(ownerId);
  const chats = await getChatMessagesForUser(ownerId);
  const sellerProducts = products.filter((product) => product.ownerId === ownerId);

  const sellerRevenue = orders.reduce((sum, order) => {
    return (
      sum +
      order.items.reduce((inner, item) => inner + item.price * item.quantity, 0)
    );
  }, 0);

  const sellerReviews = reviews.filter((review) =>
    sellerProducts.some((product) => product.id === review.productId)
  );

  return {
    productCount: sellerProducts.length,
    orderCount: orders.length,
    messageCount: chats.length,
    reviewCount: sellerReviews.length,
    revenue: sellerRevenue,
    recentOrders: orders.slice(0, 5),
    recentMessages: chats.slice(0, 5),
    products: sellerProducts
  };
}

export async function createChatMessage(input: ChatInput) {
  const conversationId = input.conversationId || createId("cnv");

  if (dbEnabled) {
    await connectToDatabase();
    const message = await ChatMessage.create({
      ...input,
      conversationId
    });
    return {
      id: stringifyId(message._id),
      conversationId,
      ...input,
      location: input.location,
      createdAt: message.createdAt?.toString?.() || new Date().toISOString()
    };
  }

  const message = {
    id: createId("cht"),
    conversationId,
    ...input,
    createdAt: new Date().toISOString()
  };

  demoStore.chats.push(message);
  return message;
}

export async function getChatMessagesForUser(userId?: string) {
  if (dbEnabled) {
    try {
      await connectToDatabase();
      const query = userId
        ? {
            $or: [{ ownerId: userId }, { participantId: userId }]
          }
        : {};
      const messages = await ChatMessage.find(query).sort({ createdAt: -1 }).lean();
      return messages.map((message) => ({
        id: stringifyId(message._id),
        conversationId: message.conversationId,
        ownerId: message.ownerId,
        participantId: message.participantId,
        participantEmail: message.participantEmail,
        senderId: message.senderId,
        senderName: message.senderName,
        senderEmail: message.senderEmail,
        senderProfileImage: message.senderProfileImage,
        productId: message.productId,
        message: message.message,
        location: message.location
          ? {
              latitude: message.location.latitude,
              longitude: message.location.longitude,
              label: message.location.label,
              sharedAt:
                message.location.sharedAt?.toString?.() || new Date().toISOString()
            }
          : undefined,
        createdAt: message.createdAt?.toString?.() || ""
      }));
    } catch (error) {
      console.error(
        "MongoDB read failed in getChatMessagesForUser; falling back to demo data.",
        error
      );
    }
  }

  return [...demoStore.chats]
    .filter((message) =>
      userId
        ? message.ownerId === userId || message.participantId === userId
        : true
    )
    .reverse();
}

export async function getChatMessagesForGuest(email?: string) {
  if (!email) {
    return [];
  }

  const normalizedEmail = email.toLowerCase();

  if (dbEnabled) {
    try {
      await connectToDatabase();
      const messages = await ChatMessage.find({
        participantEmail: normalizedEmail
      })
        .sort({ createdAt: -1 })
        .lean();

      return messages.map((message) => ({
        id: stringifyId(message._id),
        conversationId: message.conversationId,
        ownerId: message.ownerId,
        participantId: message.participantId,
        participantEmail: message.participantEmail,
        senderId: message.senderId,
        senderName: message.senderName,
        senderEmail: message.senderEmail,
        senderProfileImage: message.senderProfileImage,
        productId: message.productId,
        message: message.message,
        location: message.location
          ? {
              latitude: message.location.latitude,
              longitude: message.location.longitude,
              label: message.location.label,
              sharedAt:
                message.location.sharedAt?.toString?.() || new Date().toISOString()
            }
          : undefined,
        createdAt: message.createdAt?.toString?.() || ""
      }));
    } catch (error) {
      console.error(
        "MongoDB read failed in getChatMessagesForGuest; falling back to demo data.",
        error
      );
    }
  }

  return [...demoStore.chats]
    .filter((message) => message.participantEmail?.toLowerCase() === normalizedEmail)
    .reverse();
}
