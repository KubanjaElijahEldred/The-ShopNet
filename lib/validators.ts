import { z } from "zod";

export const passwordRule =
  "Password must have at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.";

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name is required."),
    email: z.string().email("A valid email is required."),
    mobileNumber: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),
    profileImage: z.string().url("Profile image must be a valid URL.").optional().or(z.literal("")),
    shippingAddress: z.string().optional().or(z.literal("")),
    password: z
      .string()
      .min(8, passwordRule)
      .regex(/[A-Z]/, passwordRule)
      .regex(/[a-z]/, passwordRule)
      .regex(/[0-9]/, passwordRule)
      .regex(/[^A-Za-z0-9]/, passwordRule),
    confirmPassword: z.string(),
    location: z.string().min(2, "Location is required.")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password confirmation does not match.",
    path: ["confirmPassword"]
  });

export const loginSchema = z.object({
  email: z.string().email("A valid email is required."),
  password: z.string().min(1, "Password is required.")
});

export const productSchema = z.object({
  title: z.string().min(3, "Product title is required."),
  description: z.string().min(20, "Add a more detailed product description."),
  category: z.string().min(2, "Category is required."),
  price: z.coerce.number().positive("Price must be greater than zero."),
  size: z.string().min(1, "Size is required."),
  rating: z.coerce.number().min(1).max(5),
  stock: z.coerce.number().int().min(1),
  frontImage: z.string().url("Front image must be a valid URL."),
  sideImage: z.string().url("Side image must be a valid URL."),
  backImage: z.string().url("Back image must be a valid URL.")
});

export const chatSchema = z.object({
  conversationId: z.string().optional(),
  recipientId: z.string().optional(),
  participantEmail: z.string().email("A valid email is required.").optional().or(z.literal("")),
  productId: z.string().optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().email("A valid email is required.").optional().or(z.literal("")),
  guestProfileImage: z.string().url("Profile image must be a valid URL.").optional().or(z.literal("")),
  message: z.string().min(1, "Message is required."),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  locationLabel: z.string().optional()
});

export const profileSchema = z.object({
  mobileNumber: z
    .string()
    .trim()
    .min(7, "Mobile number is too short."),
  profileImage: z
    .string()
    .url("Profile image must be a valid URL.")
    .or(z.literal("")),
  shippingAddress: z.string().optional().or(z.literal(""))
});

export const reviewSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(10, "Review should be more descriptive.")
});

export const orderSchema = z.object({
  location: z.string().min(2, "Location is required."),
  paymentMethod: z.string().min(2, "Payment method is required."),
  couponCode: z.string().optional()
});
