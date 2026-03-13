import { NextResponse } from "next/server";
import {
  createChatMessage,
  getChatMessagesForGuest,
  getChatMessagesForUser,
  getProducts
} from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { chatSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
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
    const products = await getProducts();
    const productOwnerId =
      data.productId &&
      products.find((product) => product.id === data.productId)?.ownerId;

    if (user) {
      const ownerId = data.recipientId || productOwnerId || user.id;
      const participantId = ownerId === user.id ? undefined : user.id;

      const message = await createChatMessage({
        conversationId: data.conversationId,
        ownerId,
        participantId,
        participantEmail: data.participantEmail || undefined,
        senderId: user.id,
        senderName: user.name,
        senderEmail: user.email,
        senderProfileImage: user.profileImage,
        productId: data.productId,
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

    const message = await createChatMessage({
      conversationId: data.conversationId,
      ownerId: productOwnerId || "demo_seller",
      participantEmail: data.participantEmail || data.guestEmail.toLowerCase(),
      senderName: data.guestName,
      senderEmail: data.guestEmail.toLowerCase(),
      senderProfileImage: data.guestProfileImage || undefined,
      productId: data.productId,
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
    const message = error instanceof Error ? error.message : "Unable to send chat.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
