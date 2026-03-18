import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    location: { type: String, required: true },
    mobileNumber: { type: String },
    profileImage: { type: String, required: true },
    shippingAddress: { type: String },
    role: { type: String, enum: ["customer", "admin"], default: "customer", index: true }
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
