import bcrypt from "bcryptjs";
import { demoStore, createId, persistDemoStore } from "@/lib/demo-store";
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
import { sendOrderPlacedEmail, sendOrderStatusEmail } from "@/lib/email";

type SignupInput = {
  name: string;
  email: string;
  password: string;
  location: string;
  role?: "user" | "admin";
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

type ProductUpdateInput = Partial<Omit<ProductInput, "ownerId">>;

type ProductQueryOptions = {
  limit?: number;
  imageMode?: "all" | "front";
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
  userEmail?: string;
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
  userEmail?: string;
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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function looksLikeBcryptHash(value: string) {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

async function verifyPassword(password: string, storedValue?: string) {
  if (!storedValue) {
    return false;
  }

  if (looksLikeBcryptHash(storedValue)) {
    return bcrypt.compare(password, storedValue);
  }

  // Compatibility for legacy records that may have stored plain passwords.
  return storedValue === password;
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

function normalizePositiveLimit(value?: number) {
  if (!Number.isFinite(value) || value == null || value <= 0) {
    return undefined;
  }

  return Math.floor(value);
}

function looksLikeMongoObjectId(value?: string) {
  return Boolean(value && /^[a-fA-F0-9]{24}$/.test(value));
}

type ProductRecord = {
  _id: unknown;
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
  createdAt?: { toString?: () => string } | string | Date;
};

function productProjectionForImageMode(imageMode: "all" | "front" = "all") {
  if (imageMode === "front") {
    return "_id ownerId title description category price size rating stock frontImage createdAt";
  }

  return "_id ownerId title description category price size rating stock frontImage sideImage backImage createdAt";
}

function toProductData(product: ProductRecord, imageMode: "all" | "front" = "all") {
  const frontImage = product.frontImage;
  const sideImage = imageMode === "front" ? product.frontImage : product.sideImage;
  const backImage = imageMode === "front" ? product.frontImage : product.backImage;

  return {
    id: stringifyId(product._id),
    ownerId: product.ownerId,
    title: product.title,
    description: product.description,
    category: product.category,
    price: product.price,
    size: product.size,
    rating: product.rating,
    stock: product.stock,
    frontImage,
    sideImage,
    backImage,
    createdAt: product.createdAt?.toString?.() || ""
  };
}

function productSortToMongo(sortBy?: string): Record<string, 1 | -1> {
  if (sortBy === "price-asc") {
    return { price: 1 };
  }

  if (sortBy === "price-desc") {
    return { price: -1 };
  }

  if (sortBy === "rating-desc") {
    return { rating: -1 };
  }

  return { createdAt: -1 };
}

function canManageProduct(ownerId: string, userId: string, userRole?: string) {
  return ownerId === userId || userRole === "admin";
}

function normalizeErrorText(error: unknown) {
  const visited = new Set<unknown>();
  const queue: unknown[] = [error];
  const chunks: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current == null) {
      continue;
    }

    if (typeof current === "object") {
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);
    }

    if (current instanceof Error) {
      chunks.push(current.name, current.message, current.stack || "");
      const withMeta = current as Error & {
        code?: unknown;
        cause?: unknown;
        reason?: unknown;
      };

      if (withMeta.code != null) {
        chunks.push(String(withMeta.code));
      }
      if (withMeta.cause != null) {
        queue.push(withMeta.cause);
      }
      if (withMeta.reason != null) {
        queue.push(withMeta.reason);
      }
      continue;
    }

    if (
      typeof current === "string" ||
      typeof current === "number" ||
      typeof current === "boolean"
    ) {
      chunks.push(String(current));
      continue;
    }

    if (typeof current === "object") {
      const record = current as Record<string, unknown>;
      const probableTextKeys = [
        "name",
        "message",
        "stack",
        "code",
        "detail",
        "error",
        "reason",
        "cause"
      ];

      probableTextKeys.forEach((key) => {
        const value = record[key];
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          chunks.push(String(value));
        } else if (value && typeof value === "object") {
          queue.push(value);
        }
      });

      try {
        chunks.push(JSON.stringify(current));
      } catch {
        chunks.push(String(current));
      }
      continue;
    }

    chunks.push(String(current));
  }

  return chunks.join(" ").toLowerCase();
}

function isExpectedTransientDbIssue(normalizedMessage: string) {
  return (
    normalizedMessage.includes("timed out") ||
    normalizedMessage.includes("timeout") ||
    normalizedMessage.includes("skipping new mongodb attempts") ||
    normalizedMessage.includes("srv dns lookup failed") ||
    normalizedMessage.includes("mongodb dns lookup failed") ||
    normalizedMessage.includes("dns lookup failed") ||
    normalizedMessage.includes("getaddrinfo") ||
    normalizedMessage.includes("eai_again") ||
    normalizedMessage.includes("enotfound") ||
    normalizedMessage.includes("eservfail") ||
    normalizedMessage.includes("server selection") ||
    normalizedMessage.includes("topology is closed") ||
    normalizedMessage.includes("querysrv") ||
    normalizedMessage.includes("_mongodb._tcp") ||
    normalizedMessage.includes("econnrefused")
  );
}

function reportDbFallback(message: string, error: unknown) {
  const normalizedMessage = normalizeErrorText(error);
  const expectedTransientIssue = isExpectedTransientDbIssue(normalizedMessage);

  if (!expectedTransientIssue) {
    console.error(message, error);
  }

  if (error instanceof Error) {
    throw error;
  }

  throw new Error(message);
}

export async function createUser(input: SignupInput) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  const role: "user" | "admin" = input.role === "admin" ? "admin" : "user";
  const normalizedName = input.name.trim();
  const normalizedEmail = input.email.toLowerCase();

  if (dbEnabled) {
    try {
      await connectToDatabase();

      const existingByEmail = await User.findOne({ email: normalizedEmail });
      if (existingByEmail) {
        throw new Error("That email already has an account.");
      }

      const existingByName = await User.findOne({
        name: new RegExp(`^${escapeRegex(normalizedName)}$`, "i")
      });
      if (existingByName) {
        throw new Error("That name is already in use. Please choose another name.");
      }

      const user = await User.create({
        name: normalizedName,
        email: normalizedEmail,
        passwordHash,
        role,
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
        role: user.role || "user",
        mobileNumber: user.mobileNumber,
        profileImage: user.profileImage,
        shippingAddress: user.shippingAddress
      };
    } catch (error) {
      if (
        error instanceof Error &&
        [
          "That email already has an account.",
          "That name is already in use. Please choose another name."
        ].includes(error.message)
      ) {
        throw error;
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: unknown }).code === 11000
      ) {
        throw new Error("That email already has an account.");
      }

      reportDbFallback("MongoDB write failed in createUser; aborting request.", error);
    }
  }

  const existing = demoStore.users.find(
    (user) => user.email.toLowerCase() === normalizedEmail
  );

  if (existing) {
    throw new Error("That email already has an account.");
  }

  const existingName = demoStore.users.find(
    (user) => user.name.trim().toLowerCase() === normalizedName.toLowerCase()
  );

  if (existingName) {
    throw new Error("That name is already in use. Please choose another name.");
  }

  const user = {
    id: createId("usr"),
    name: normalizedName,
    email: normalizedEmail,
    passwordHash,
    role,
    location: input.location,
    mobileNumber: input.mobileNumber || undefined,
    profileImage: input.profileImage || undefined,
    shippingAddress: input.shippingAddress || undefined
  };

  demoStore.users.push(user);
  persistDemoStore();

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    location: user.location,
    role: user.role,
    mobileNumber: user.mobileNumber,
    profileImage: user.profileImage,
    shippingAddress: user.shippingAddress
  };
}

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = email.toLowerCase();

  if (dbEnabled) {
    try {
      await connectToDatabase();
      const user = await User.findOne({ email: normalizedEmail });

      if (user) {
        const valid = await verifyPassword(password, user.passwordHash);
        if (valid) {
          return {
            id: stringifyId(user._id),
            name: user.name,
            email: user.email,
            location: user.location,
            role: user.role || "user",
            mobileNumber: user.mobileNumber,
            profileImage: user.profileImage,
            shippingAddress: user.shippingAddress
          };
        }
      }
    } catch (error) {
      reportDbFallback("MongoDB read failed in authenticateUser; aborting request.", error);
    }
  }

  const user = demoStore.users.find(
    (candidate) => candidate.email.toLowerCase() === normalizedEmail
  );

  if (!user) {
    return null;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  if (user.passwordHash && !looksLikeBcryptHash(user.passwordHash)) {
    user.passwordHash = await bcrypt.hash(password, 10);
    persistDemoStore();
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    location: user.location,
    role: user.role || "user",
    mobileNumber: user.mobileNumber,
    profileImage: user.profileImage,
    shippingAddress: user.shippingAddress
  };
}

export async function updateUserProfile(
  userId: string,
  payload: {
    mobileNumber: string;
    profileImage?: string | null;
    shippingAddress?: string;
  }
) {
  if (dbEnabled) {
    await connectToDatabase();
    const updateData: {
      mobileNumber: string;
      profileImage?: string;
      shippingAddress?: string;
      $unset?: { profileImage: 1 };
    } = {
      mobileNumber: payload.mobileNumber,
      shippingAddress: payload.shippingAddress || undefined
    };

    if (payload.profileImage === null) {
      updateData.$unset = { profileImage: 1 };
    } else {
      updateData.profileImage = payload.profileImage || undefined;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
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
      role: user.role || "user",
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
  user.profileImage =
    payload.profileImage === null ? undefined : payload.profileImage || undefined;
  user.shippingAddress = payload.shippingAddress || undefined;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    location: user.location,
    role: user.role || "user",
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
      const normalizedMessage = normalizeErrorText(error);
      if (!isExpectedTransientDbIssue(normalizedMessage)) {
        reportDbFallback("MongoDB read failed in getUserPublicProfiles; aborting request.", error);
      }
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

export async function getUserPublicProfileById(userId?: string) {
  if (!userId) {
    return null;
  }

  // Clerk user IDs (e.g. "user_xxx") are not Mongo ObjectIds.
  // Skip Mongo lookup to avoid CastError and allow graceful UI fallback.
  if (!looksLikeMongoObjectId(userId)) {
    return null;
  }

  if (dbEnabled) {
    try {
      await connectToDatabase();
      const user = (await User.findById(userId).lean()) as
        | {
            _id: unknown;
            name: string;
            email: string;
            location: string;
            mobileNumber?: string;
            profileImage?: string;
            shippingAddress?: string;
          }
        | null;

      if (!user) {
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
    } catch (error) {
      reportDbFallback("MongoDB read failed in getUserPublicProfileById; aborting request.", error);
    }
  }

  const user = demoStore.users.find((entry) => entry.id === userId);
  if (!user) {
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

async function getUserContactById(userId: string) {
  if (!looksLikeMongoObjectId(userId)) {
    return null;
  }

  if (dbEnabled) {
    try {
      await connectToDatabase();
      const user = (await User.findById(userId).lean()) as
        | { name?: string; email: string }
        | null;

      if (user) {
        return {
          name: user.name || "ShopNet User",
          email: user.email
        };
      }
    } catch (error) {
      const normalizedMessage = normalizeErrorText(error);
      if (!isExpectedTransientDbIssue(normalizedMessage)) {
        reportDbFallback("MongoDB read failed in getUserContactById; aborting request.", error);
      }
    }
  }

  const user = demoStore.users.find((entry) => entry.id === userId);
  if (!user) {
    return null;
  }

  return {
    name: user.name,
    email: user.email
  };
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
  persistDemoStore();
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
      reportDbFallback("MongoDB read failed in getNotificationsForUser; aborting request.", error);
    }
  }

  return [...demoStore.notifications]
    .filter((notification) => notification.userId === userId)
    .reverse();
}

export async function getProducts(options?: ProductQueryOptions) {
  const limit = normalizePositiveLimit(options?.limit);
  const imageMode = options?.imageMode || "all";
  const fallbackProducts = [...demoStore.products].reverse();

  if (dbEnabled) {
    try {
      await connectToDatabase();
      let query = Product.find()
        .select(productProjectionForImageMode(imageMode))
        .sort({ createdAt: -1 });

      if (limit) {
        query = query.limit(limit);
      }

      const products = await query.lean();
      return products.map((product) =>
        toProductData(product as unknown as ProductRecord, imageMode)
      );
    } catch (error) {
      const normalizedMessage = normalizeErrorText(error);
      if (isExpectedTransientDbIssue(normalizedMessage)) {
        const fallback = limit ? fallbackProducts.slice(0, limit) : fallbackProducts;
        return fallback.map((product) =>
          imageMode === "front"
            ? { ...product, sideImage: product.frontImage, backImage: product.frontImage }
            : product
        );
      }
      reportDbFallback("MongoDB read failed in getProducts; aborting request.", error);
    }
  }

  const fallback = limit ? fallbackProducts.slice(0, limit) : fallbackProducts;
  return fallback.map((product) =>
    imageMode === "front"
      ? { ...product, sideImage: product.frontImage, backImage: product.frontImage }
      : product
  );
}

export async function getProductById(productId?: string) {
  if (!productId) {
    return null;
  }

  if (dbEnabled) {
    try {
      await connectToDatabase();

      if (!looksLikeMongoObjectId(productId)) {
        return null;
      }

      const product = await Product.findById(productId).lean();

      if (!product) {
        return null;
      }

      return toProductData(product as unknown as ProductRecord);
    } catch (error) {
      const normalizedMessage = normalizeErrorText(error);
      if (!isExpectedTransientDbIssue(normalizedMessage)) {
        reportDbFallback("MongoDB read failed in getProductById; aborting request.", error);
      }
    }
  }

  return demoStore.products.find((product) => product.id === productId) || null;
}

export async function getFilteredProducts(options?: {
  query?: string;
  category?: string;
  sortBy?: string;
  imageMode?: "all" | "front";
}) {
  const imageMode = options?.imageMode || "front";

  if (dbEnabled) {
    try {
      await connectToDatabase();

      const normalizedQuery = options?.query?.trim();
      const normalizedCategory = options?.category?.trim();
      const mongoFilter: {
        category?: string;
        $or?: Array<{
          title?: RegExp;
          description?: RegExp;
          category?: RegExp;
        }>;
      } = {};

      if (normalizedQuery) {
        const pattern = new RegExp(escapeRegex(normalizedQuery), "i");
        mongoFilter.$or = [{ title: pattern }, { description: pattern }, { category: pattern }];
      }

      if (normalizedCategory) {
        mongoFilter.category = normalizedCategory;
      }

      const products = await Product.find(mongoFilter)
        .select(productProjectionForImageMode(imageMode))
        .sort(productSortToMongo(options?.sortBy))
        .lean();

      return products.map((product) =>
        toProductData(product as unknown as ProductRecord, imageMode)
      );
    } catch (error) {
      const normalizedMessage = normalizeErrorText(error);
      if (!isExpectedTransientDbIssue(normalizedMessage)) {
        reportDbFallback("MongoDB read failed in getFilteredProducts; aborting request.", error);
      }
    }
  }

  const allProducts = await getProducts({ imageMode });
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
    try {
      await connectToDatabase();
      const product = await Product.create(input);
      return {
        id: stringifyId(product._id),
        ...input
      };
    } catch (error) {
      const normalizedMessage = normalizeErrorText(error);
      if (!isExpectedTransientDbIssue(normalizedMessage)) {
        reportDbFallback("MongoDB write failed in createProduct; aborting request.", error);
      }
    }
  }

  const product = {
    id: createId("prd"),
    ...input,
    createdAt: new Date().toISOString()
  };

  demoStore.products.push(product);
  persistDemoStore();
  return product;
}

export async function updateProduct(
  productId: string,
  userId: string,
  input: ProductUpdateInput,
  userRole?: string
) {
  if (dbEnabled) {
    try {
      await connectToDatabase();
      const product = await Product.findById(productId);

      if (!product) {
        throw new Error("Product not found.");
      }

      if (!canManageProduct(product.ownerId, userId, userRole)) {
        throw new Error("You cannot update this product.");
      }

      Object.entries(input).forEach(([key, value]) => {
        if (value !== undefined) {
          // Assign only defined updates from validated payload.
          (product as unknown as Record<string, unknown>)[key] = value;
        }
      });

      await product.save();

      return {
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
      };
    } catch (error) {
      if (
        error instanceof Error &&
        ["Product not found.", "You cannot update this product."].includes(error.message)
      ) {
        throw error;
      }

      const normalizedMessage = normalizeErrorText(error);
      if (!isExpectedTransientDbIssue(normalizedMessage)) {
        reportDbFallback("MongoDB write failed in updateProduct; aborting request.", error);
      }
    }
  }

  const product = demoStore.products.find((entry) => entry.id === productId);

  if (!product) {
    throw new Error("Product not found.");
  }

  if (!canManageProduct(product.ownerId, userId, userRole)) {
    throw new Error("You cannot update this product.");
  }

  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) {
      (product as unknown as Record<string, unknown>)[key] = value;
    }
  });

  persistDemoStore();
  return product;
}

export async function deleteProduct(productId: string, userId: string, userRole?: string) {
  if (dbEnabled) {
    try {
      await connectToDatabase();
      const product = await Product.findById(productId);

      if (!product) {
        throw new Error("Product not found.");
      }

      if (!canManageProduct(product.ownerId, userId, userRole)) {
        throw new Error("You cannot delete this product.");
      }

      await Promise.all([
        Product.deleteOne({ _id: productId }),
        CartItem.deleteMany({ productId }),
        WishlistItem.deleteMany({ productId }),
        Review.deleteMany({ productId }),
        Notification.deleteMany({ relatedProductId: productId })
      ]);

      return { id: productId };
    } catch (error) {
      if (
        error instanceof Error &&
        ["Product not found.", "You cannot delete this product."].includes(error.message)
      ) {
        throw error;
      }

      const normalizedMessage = normalizeErrorText(error);
      if (!isExpectedTransientDbIssue(normalizedMessage)) {
        reportDbFallback("MongoDB write failed in deleteProduct; aborting request.", error);
      }
    }
  }

  const product = demoStore.products.find((entry) => entry.id === productId);

  if (!product) {
    throw new Error("Product not found.");
  }

  if (!canManageProduct(product.ownerId, userId, userRole)) {
    throw new Error("You cannot delete this product.");
  }

  demoStore.products = demoStore.products.filter((entry) => entry.id !== productId);
  demoStore.cartItems = demoStore.cartItems.filter((entry) => entry.productId !== productId);
  demoStore.wishlistItems = demoStore.wishlistItems.filter((entry) => entry.productId !== productId);
  demoStore.reviews = demoStore.reviews.filter((entry) => entry.productId !== productId);
  demoStore.notifications = demoStore.notifications.filter(
    (entry) => entry.relatedProductId !== productId
  );

  persistDemoStore();
  return { id: productId };
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
    persistDemoStore();
    return existing;
  }

  const item = { userId, productId, quantity };
  demoStore.cartItems.push(item);
  persistDemoStore();
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
    persistDemoStore();
    return;
  }

  item.quantity = quantity;
  persistDemoStore();
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
      reportDbFallback("MongoDB read failed in getCartItems; aborting request.", error);
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
  persistDemoStore();
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
  persistDemoStore();
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
  persistDemoStore();
}

export async function getWishlistItems(userId: string) {
  const products = await getProducts({ imageMode: "front" });

  if (dbEnabled) {
    try {
      await connectToDatabase();
      const items = await WishlistItem.find({ userId }).lean();
      return items
        .map((item) => products.find((product) => product.id === item.productId))
        .filter(isPresent);
    } catch (error) {
      reportDbFallback("MongoDB read failed in getWishlistItems; aborting request.", error);
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
  persistDemoStore();
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
      const normalizedMessage = normalizeErrorText(error);
      if (!isExpectedTransientDbIssue(normalizedMessage)) {
        reportDbFallback("MongoDB read failed in getReviews; aborting request.", error);
      }
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
    persistDemoStore();
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

  try {
    const buyer =
      input.userEmail
        ? { email: input.userEmail, name: input.userName }
        : await getUserContactById(input.userId);

    if (buyer?.email) {
      await sendOrderPlacedEmail({
        to: buyer.email,
        userName: buyer.name || input.userName,
        orderId: createdOrder.id,
        orderStatus: createdOrder.status,
        orderTotal: createdOrder.total
      });
    }
  } catch (error) {
    console.error("Failed to send order confirmation email.", error);
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

  persistDemoStore();
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
        userEmail: order.userEmail,
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
      reportDbFallback("MongoDB read failed in getOrdersForUser; aborting request.", error);
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
        userEmail: order.userEmail,
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
      reportDbFallback("MongoDB read failed in getOrdersForSeller; aborting request.", error);
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

    try {
      const orderEmail = typeof order.userEmail === "string" ? order.userEmail : "";
      const buyer = orderEmail
        ? { email: orderEmail, name: order.userName || "ShopNet User" }
        : await getUserContactById(order.userId);
      if (buyer?.email) {
        await sendOrderStatusEmail({
          to: buyer.email,
          userName: buyer.name,
          orderId: stringifyId(order._id),
          orderStatus: order.status
        });
      }
    } catch (error) {
      console.error("Failed to send order status email.", error);
    }

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
  persistDemoStore();

  try {
    const buyer =
      order.userEmail
        ? { email: order.userEmail, name: order.userName || "ShopNet User" }
        : await getUserContactById(order.userId);
    if (buyer?.email) {
      await sendOrderStatusEmail({
        to: buyer.email,
        userName: buyer.name,
        orderId: order.id,
        orderStatus: order.status
      });
    }
  } catch (error) {
    console.error("Failed to send order status email.", error);
  }

  return { id: order.id, status: order.status };
}

export async function getAdminOverview() {
  const [users, products] = await Promise.all([
    getUserPublicProfiles(),
    getProducts({ imageMode: "front" })
  ]);
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
      reportDbFallback("MongoDB read failed in getAdminOverview; aborting request.", error);
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
  const products = await getProducts({ imageMode: "front" });
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
    try {
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
    } catch (error) {
      reportDbFallback("MongoDB write failed in createChatMessage; aborting request.", error);
    }
  }

  const message = {
    id: createId("cht"),
    conversationId,
    ...input,
    createdAt: new Date().toISOString()
  };

  demoStore.chats.push(message);
  persistDemoStore();
  return message;
}

export async function getChatConversationContext(conversationId: string) {
  if (!conversationId) {
    return null;
  }

  if (dbEnabled) {
    try {
      await connectToDatabase();
      const message = (await ChatMessage.findOne({ conversationId })
        .sort({ createdAt: -1 })
        .lean()) as
        | {
            conversationId: string;
            ownerId: string;
            participantId?: string;
            participantEmail?: string;
            productId?: string;
          }
        | null;

      if (message) {
        return {
          conversationId: message.conversationId,
          ownerId: message.ownerId,
          participantId: message.participantId,
          participantEmail: message.participantEmail,
          productId: message.productId
        };
      }
    } catch (error) {
      reportDbFallback("MongoDB read failed in getChatConversationContext; aborting request.", error);
    }
  }

  const message = [...demoStore.chats]
    .reverse()
    .find((entry) => entry.conversationId === conversationId);

  if (!message) {
    return null;
  }

  return {
    conversationId: message.conversationId,
    ownerId: message.ownerId,
    participantId: message.participantId,
    participantEmail: message.participantEmail,
    productId: message.productId
  };
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
        conversationId: message.conversationId || stringifyId(message._id),
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
      reportDbFallback("MongoDB read failed in getChatMessagesForUser; aborting request.", error);
    }
  }

  return [...demoStore.chats]
    .filter((message) =>
      userId
        ? message.ownerId === userId || message.participantId === userId
        : true
    )
    .map((message, index) => ({
      ...message,
      conversationId:
        message.conversationId || message.id || `legacy-conversation-${index}`
    }))
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
        conversationId: message.conversationId || stringifyId(message._id),
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
      reportDbFallback("MongoDB read failed in getChatMessagesForGuest; aborting request.", error);
    }
  }

  return [...demoStore.chats]
    .filter((message) => message.participantEmail?.toLowerCase() === normalizedEmail)
    .map((message, index) => ({
      ...message,
      conversationId:
        message.conversationId || message.id || `legacy-conversation-${index}`
    }))
    .reverse();
}
