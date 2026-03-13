import { Schema, model, models } from "mongoose";

const ChatMessageSchema = new Schema(
  {
    conversationId: { type: String, required: true },
    ownerId: { type: String, required: true },
    participantId: { type: String },
    participantEmail: { type: String },
    senderId: { type: String },
    senderName: { type: String, required: true },
    senderEmail: { type: String, required: true },
    senderProfileImage: { type: String },
    productId: { type: String },
    message: { type: String, required: true },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      label: { type: String },
      sharedAt: { type: Date }
    }
  },
  { timestamps: true }
);

export const ChatMessage =
  models.ChatMessage || model("ChatMessage", ChatMessageSchema);
