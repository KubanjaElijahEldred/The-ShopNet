import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  createChatMessage,
  getChatConversationContext,
  getChatMessagesForGuest,
  getChatMessagesForUser,
  getProductById
} from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { getSafeRequestUrl } from "@/lib/url";
import { chatSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const { searchParams } = getSafeRequestUrl(request, "/api/chat");
  const email = searchParams.get("email") || undefined;
  const user = await getSessionUser();
  const messages = user
    ? await getChatMessagesForUser(user.id)
    : await getChatMessagesForGuest(email);
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const data = chatSchema.parse(payload);
    const user = await getSessionUser();
    const existingConversation = data.conversationId
      ? await getChatConversationContext(data.conversationId)
      : null;
    const resolvedProductId = data.productId || existingConversation?.productId;

    if (user) {
      let ownerId = existingConversation?.ownerId || data.recipientId;

      if (!ownerId && resolvedProductId) {
        const product = await getProductById(resolvedProductId);
        ownerId = product?.ownerId;
      }

      ownerId ||= user.id;

      let participantId = existingConversation?.participantId;

      if (!participantId) {
        if (data.recipientId && data.recipientId !== ownerId) {
          participantId = data.recipientId;
        } else if (user.id !== ownerId) {
          participantId = user.id;
        }
      }

      if (participantId === ownerId) {
        participantId = undefined;
      }

      const message = await createChatMessage({
        conversationId: data.conversationId,
        ownerId,
        participantId,
        participantEmail:
          data.participantEmail ||
          existingConversation?.participantEmail ||
          undefined,
        senderId: user.id,
        senderName: user.name,
        senderEmail: user.email,
        senderProfileImage: user.profileImage,
        productId: resolvedProductId,
        message: data.message,
        location:
          data.latitude !== undefined && data.longitude !== undefined
            ? {
                latitude: data.latitude,
                longitude: data.longitude,
                label: data.locationLabel || undefined,
                sharedAt: new Date().toISOString()
              }
            : undefined
      });

      return NextResponse.json({ message });
    }

    if (!data.guestName || !data.guestEmail) {
      return NextResponse.json(
        { error: "Guest name and email are required." },
        { status: 400 }
      );
    }

    let ownerId = existingConversation?.ownerId;

    if (!ownerId && resolvedProductId) {
      const product = await getProductById(resolvedProductId);
      ownerId = product?.ownerId;
    }

    const message = await createChatMessage({
      conversationId: data.conversationId,
      ownerId: ownerId || "demo_seller",
      participantId: existingConversation?.participantId,
      participantEmail:
        data.participantEmail ||
        existingConversation?.participantEmail ||
        data.guestEmail.toLowerCase(),
      senderName: data.guestName,
      senderEmail: data.guestEmail.toLowerCase(),
      senderProfileImage: data.guestProfileImage || undefined,
      productId: resolvedProductId,
      message: data.message,
      location:
        data.latitude !== undefined && data.longitude !== undefined
          ? {
              latitude: data.latitude,
              longitude: data.longitude,
              label: data.locationLabel || undefined,
              sharedAt: new Date().toISOString()
            }
          : undefined
    });

    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid chat payload." },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unable to send chat.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
