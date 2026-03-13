import { Schema, model, models } from "mongoose";

const CartItemSchema = new Schema(
  {
    userId: { type: String, required: true },
    productId: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 }
  },
  { timestamps: true }
);

export const CartItem = models.CartItem || model("CartItem", CartItemSchema);
