import { Schema, model, models } from "mongoose";

const WishlistItemSchema = new Schema(
  {
    userId: { type: String, required: true },
    productId: { type: String, required: true }
  },
  { timestamps: true }
);

WishlistItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

export const WishlistItem =
  models.WishlistItem || model("WishlistItem", WishlistItemSchema);
