import { Schema, model, models } from "mongoose";

const ReviewSchema = new Schema(
  {
    productId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true }
  },
  { timestamps: true }
);

export const Review = models.Review || model("Review", ReviewSchema);
