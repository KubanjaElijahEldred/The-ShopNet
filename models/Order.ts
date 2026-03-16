import { Schema, model, models } from "mongoose";

const OrderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    ownerId: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    frontImage: { type: String, required: true }
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String },
    location: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    status: { type: String, required: true, default: "Pending" },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    discountAmount: { type: Number, required: true, default: 0 },
    mobileMoneyCharge: { type: Number, required: true },
    total: { type: Number, required: true },
    couponCode: { type: String },
    items: { type: [OrderItemSchema], required: true }
  },
  { timestamps: true }
);

export const Order = models.Order || model("Order", OrderSchema);
