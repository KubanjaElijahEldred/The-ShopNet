import { Schema, model, models } from "mongoose";

const NotificationSchema = new Schema(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    channel: { type: String, required: true, default: "account" },
    status: { type: String, required: true, default: "unread" },
    relatedOrderId: { type: String },
    relatedProductId: { type: String }
  },
  { timestamps: true }
);

export const Notification =
  models.Notification || model("Notification", NotificationSchema);
