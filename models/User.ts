import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "user" },
    location: { type: String, required: true },
    mobileNumber: { type: String },
    profileImage: { type: String },
    shippingAddress: { type: String },
    lastSeenAt: { type: Date }
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
