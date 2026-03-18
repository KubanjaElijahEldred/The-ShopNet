import { ChatLayout } from "@/components/chat/ChatLayout";
import {
  getChatMessagesForGuest,
  getChatMessagesForUser,
  getProducts,
  getUserPublicProfiles,
  markNotificationsRead
} from "@/lib/data";
import { getSessionUser } from "@/lib/session";

export type Message = {
  id: string;
  conversationId: string;
  ownerId: string;
  participantId?: string;
  participantEmail?: string;
  senderId?: string;
  senderName: string;
  senderEmail: string;
  senderProfileImage?: string;
  productId?: string;
  message: string;
  location?: {
    latitude: number;
    longitude: number;
    label?: string;
    sharedAt: string;
  };
  createdAt: string;
};

type StarterChat = {
  conversationId: string;
  recipientId: string;
  productId: string;
  peerName: string;
  peerEmail?: string;
  peerProfileImage?: string;
};

function findMatchingThread(
  threads: Message[][],
  starterChat: StarterChat | null,
  userId?: string,
  guestEmail?: string
) {
  if (!starterChat) {
    return null;
  }

  return (
    threads.find((thread) =>
      thread.some((message) => {
        if (message.productId !== starterChat.productId) {
          return false;
        }

        if (userId) {
          return message.ownerId === starterChat.recipientId && message.participantId === userId;
        }

        if (!guestEmail) {
          return false;
        }

        return (
          message.ownerId === starterChat.recipientId &&
          message.participantEmail === guestEmail.toLowerCase()
        );
      })
    ) || null
  );
}

export default async function ChatPage({
  searchParams
}: {
  searchParams?: Promise<{
    email?: string;
    productId?: string;
  }>;
}) {
  const user = await getSessionUser();
  const params = await searchParams;
  const guestEmail = params?.email;

  if (user) {
    await markNotificationsRead(user.id, "chat");
  }

  const [messages, products, profiles] = await Promise.all([
    user ? getChatMessagesForUser(user.id) : getChatMessagesForGuest(guestEmail),
    getProducts(),
    getUserPublicProfiles()
  ]);

  const grouped = messages.reduce<Record<string, Message[]>>((acc, current) => {
    const message = current as Message;
    acc[message.conversationId] = acc[message.conversationId] || [];
    acc[message.conversationId].push(message);
    return acc;
  }, {});

  const threads = Object.values(grouped).map((thread) =>
    [...thread].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  );

  const product = params?.productId
    ? products.find((entry) => entry.id === params.productId)
    : null;
  const ownerProfile = product
    ? profiles.find((profile) => profile.id === product.ownerId)
    : null;

  const starterChat =
    product && product.ownerId !== user?.id
      ? {
          conversationId: `starter-${product.id}`,
          recipientId: product.ownerId,
          productId: product.id,
          peerName: ownerProfile?.name || "Product owner",
          peerEmail: ownerProfile?.email,
          peerProfileImage: ownerProfile?.profileImage
        }
      : null;

  const matchingThread = findMatchingThread(threads, starterChat, user?.id, guestEmail);

  return (
    <div className="whatsapp-chat-container">
      <ChatLayout
        user={
          user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage
              }
            : null
        }
        threads={threads}
        guestEmail={guestEmail}
        defaultProductId={params?.productId}
        starterChat={starterChat}
        initialConversationId={matchingThread?.[0]?.conversationId}
      />
    </div>
  );
}
