import { Schema, model, models } from "mongoose";

const ProductSchema = new Schema(
  {
    ownerId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    size: { type: String, required: true },
    rating: { type: Number, required: true },
    stock: { type: Number, required: true },
    frontImage: { type: String, required: true },
    sideImage: { type: String, required: true },
    backImage: { type: String, required: true }
  },
  { timestamps: true }
);

export const Product = models.Product || model("Product", ProductSchema);
