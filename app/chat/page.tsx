import Image from "next/image";
import { Search, Plus, MessageSquare, Camera, ScanLine, Settings, ArrowLeft, Phone } from "lucide-react";
import {
  getChatMessagesForGuest,
  getChatMessagesForUser,
  getProductById,
  getUserPublicProfileById
} from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import { getUserPresenceMap, isOnlineFromTimestamp } from "@/lib/presence";
import { DarkChatForm } from "@/components/chat/DarkChatForm";
import { ActiveChatThread } from "@/components/chat/ActiveChatThread";
import { ChatAutoRefresh } from "@/components/chat/ChatAutoRefresh";
import { PresenceHeartbeat } from "@/components/chat/PresenceHeartbeat";

type Message = {
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
  location?: { latitude: number; longitude: number; label?: string; sharedAt: string };
  createdAt: string;
};

type ThreadMeta = {
  key: string;
  thread: Message[];
  lastMessage: Message;
  counterpart: Message;
  counterpartId?: string;
  counterpartName: string;
  counterpartAvatar?: string;
  counterpartOnline: boolean;
  counterpartStatus: string;
  counterpartLastActivity?: string;
};

function getCounterpartId(message: Message, userId: string) {
  const candidates = [message.ownerId, message.participantId].filter(Boolean) as string[];
  return candidates.find((candidate) => candidate !== userId);
}

function formatTime(isoString: string) {
  const d = new Date(isoString);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

function firstLetter(value: string) {
  return (value || "U").trim().charAt(0).toUpperCase() || "U";
}

function isRecentlyActive(timestamp?: string, windowMs = 90_000) {
  if (!timestamp) {
    return false;
  }

  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) {
    return false;
  }

  return Date.now() - parsed <= windowMs;
}

function formatPresenceStatus(isOnline: boolean, lastSeenAt?: string) {
  if (isOnline) {
    return "Online";
  }

  if (!lastSeenAt) {
    return "Offline";
  }

  const parsed = Date.parse(lastSeenAt);
  if (Number.isNaN(parsed)) {
    return "Offline";
  }

  const diffMs = Math.max(0, Date.now() - parsed);
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin <= 0) {
    return "Last seen just now";
  }

  if (diffMin < 60) {
    return `Last seen ${diffMin}m ago`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return `Last seen ${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `Last seen ${diffDays}d ago`;
}

function findLastCounterpartMessage(
  thread: Message[],
  userId?: string,
  guestEmail?: string,
  counterpartId?: string
) {
  const normalizedGuestEmail = guestEmail?.toLowerCase().trim();

  const reversed = [...thread].reverse();

  return reversed.find((message) => {
    if (userId) {
      if (counterpartId) {
        return message.senderId === counterpartId;
      }

      return message.senderId !== userId;
    }

    if (normalizedGuestEmail) {
      return message.senderEmail.toLowerCase() !== normalizedGuestEmail;
    }

    return true;
  });
}

export default async function ChatPage({
  searchParams
}: {
  searchParams?: Promise<{
    email?: string;
    productId?: string;
    ownerId?: string;
    active?: string;
  }>;
}) {
  const user = await getSessionUser();
  const params = await searchParams;
  const guestEmail = params?.email?.trim();
  const activeConversationId = params?.active;
  const productIdContext = params?.productId;
  const ownerIdParam = params?.ownerId?.trim();

  let messages: Message[] = [];

  try {
    const loadedMessages = user
      ? await getChatMessagesForUser(user.id)
      : await getChatMessagesForGuest(guestEmail);
    messages = loadedMessages as Message[];
  } catch {
    // Keep chat UI available even if reads temporarily fail.
  }

  let productContext: Awaited<ReturnType<typeof getProductById>> | null = null;

  if (productIdContext) {
    try {
      productContext = await getProductById(productIdContext);
    } catch {
      // Continue without product metadata if DB is temporarily unavailable.
    }
  }

  const targetOwnerId = ownerIdParam || productContext?.ownerId;
  let ownerProfile: Awaited<ReturnType<typeof getUserPublicProfileById>> | null = null;

  if (targetOwnerId) {
    try {
      ownerProfile = await getUserPublicProfileById(targetOwnerId);
    } catch {
      // Continue with presence/message-based metadata when profile lookup fails.
    }
  }

  const idsForPresence = [
    user?.id,
    targetOwnerId,
    ...messages.flatMap((message) => [message.ownerId, message.participantId, message.senderId])
  ].filter(Boolean) as string[];

  const presenceMap = await getUserPresenceMap(idsForPresence);

  const grouped = messages.reduce<Record<string, Message[]>>((acc, current) => {
    const key = current.conversationId || current.id;

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(current as Message);
    return acc;
  }, {});

  const threadMetas = Object.values(grouped)
    .map((thread) => [...thread].sort((a, b) => a.createdAt.localeCompare(b.createdAt)))
    .sort((a, b) => b[b.length - 1].createdAt.localeCompare(a[a.length - 1].createdAt))
    .map((thread, index): ThreadMeta => {
      const lastMessage = thread[thread.length - 1];
      const key = lastMessage.conversationId || lastMessage.id || `thread-${index}`;
      const counterpart =
        thread.find((message) =>
          user ? message.senderId !== user.id : message.senderEmail !== guestEmail
        ) || lastMessage;
      const counterpartId = user ? getCounterpartId(lastMessage, user.id) : lastMessage.ownerId;
      const counterpartPresence = counterpartId ? presenceMap.get(counterpartId) : undefined;
      const counterpartActivity = findLastCounterpartMessage(
        thread,
        user?.id,
        guestEmail,
        counterpartId
      );
      const counterpartLastActivity =
        counterpartPresence?.lastSeenAt || counterpartActivity?.createdAt;
      const counterpartOnline =
        counterpartPresence?.isOnline || isOnlineFromTimestamp(counterpartLastActivity);

      const fallbackCounterpartName = user
        ? user.id === lastMessage.ownerId
          ? counterpart.participantEmail || counterpart.senderName
          : counterpart.senderName
        : counterpart.senderName;

      return {
        key,
        thread,
        lastMessage,
        counterpart,
        counterpartId,
        counterpartName:
          counterpartPresence?.name ||
          fallbackCounterpartName ||
          counterpart.senderEmail ||
          "ShopNet user",
        counterpartAvatar: counterpartPresence?.profileImage || counterpart.senderProfileImage,
        counterpartOnline,
        counterpartStatus: formatPresenceStatus(counterpartOnline, counterpartLastActivity),
        counterpartLastActivity
      };
    });

  let activeMeta = threadMetas.find((threadMeta) => threadMeta.key === activeConversationId);

  if (!activeMeta && targetOwnerId) {
    activeMeta = threadMetas.find((threadMeta) => {
      if (user) {
        const participants = new Set(
          threadMeta.thread.flatMap((message) =>
            [message.ownerId, message.participantId].filter(Boolean) as string[]
          )
        );

        const hasParticipants = participants.has(user.id) && participants.has(targetOwnerId);
        const matchesProduct = productIdContext
          ? threadMeta.thread.some((message) => message.productId === productIdContext)
          : true;

        return hasParticipants && matchesProduct;
      }

      const matchesOwner = threadMeta.thread.some((message) => message.ownerId === targetOwnerId);
      const matchesGuest = guestEmail
        ? threadMeta.thread.some(
            (message) => message.participantEmail?.toLowerCase() === guestEmail.toLowerCase()
          )
        : true;
      const matchesProduct = productIdContext
        ? threadMeta.thread.some((message) => message.productId === productIdContext)
        : true;

      return matchesOwner && matchesGuest && matchesProduct;
    });
  }

  const hasExplicitThreadContext = Boolean(activeConversationId || targetOwnerId || productIdContext);

  if (!activeMeta && threadMetas.length > 0 && !hasExplicitThreadContext) {
    activeMeta = threadMetas[0];
  }

  const shouldAutoRefresh = threadMetas.length > 0;
  const activeThread = activeMeta?.thread;
  const activeLastMessage = activeMeta?.lastMessage;
  const ownerIsViewer = Boolean(user && activeLastMessage && user.id === activeLastMessage.ownerId);
  const activeRecipientId =
    user && activeLastMessage ? getCounterpartId(activeLastMessage, user.id) : undefined;

  const ownerPresence = targetOwnerId ? presenceMap.get(targetOwnerId) : undefined;
  const ownerMessageContext = targetOwnerId
    ? messages.find((message) => message.ownerId === targetOwnerId)
    : undefined;
  const ownerName =
    ownerPresence?.name ||
    ownerProfile?.name ||
    ownerMessageContext?.senderName ||
    ownerMessageContext?.senderEmail ||
    "Product owner";
  const ownerAvatar =
    ownerPresence?.profileImage || ownerProfile?.profileImage || ownerMessageContext?.senderProfileImage;
  const ownerLastSeen = ownerPresence?.lastSeenAt || ownerMessageContext?.createdAt;
  const ownerOnline = ownerPresence?.isOnline || isRecentlyActive(ownerLastSeen);
  const ownerStatus = formatPresenceStatus(ownerOnline, ownerLastSeen);
  const shouldShowComposeForOwner = Boolean(
    !activeMeta && targetOwnerId && (!user || user.id !== targetOwnerId)
  );

  return (
    <div className="dark-chat-page">
      <ChatAutoRefresh enabled={shouldAutoRefresh} intervalMs={12_000} />
      {user ? <PresenceHeartbeat /> : null}

      <div className="dark-chat-layout">
        <aside className="dark-chat-sidebar">
          <div className="dark-chat-sidebar-header">
            <div className="dark-chat-header-top">
              <div className="dark-chat-user-info">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    width={40}
                    height={40}
                    className="dark-chat-user-avatar"
                  />
                ) : (
                  <Image
                    src="/image.png"
                    alt="ShopNet Logo"
                    width={40}
                    height={40}
                    className="dark-chat-user-avatar"
                    priority
                  />
                )}
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>
                  {user ? user.name : "Chats"}
                </h2>
              </div>
              <button className="dark-chat-add-btn" type="button" aria-label="New chat">
                <Plus size={20} />
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <Search
                size={18}
                color="#8a94a6"
                style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                type="text"
                placeholder="Search"
                className="dark-chat-search"
                style={{ paddingLeft: 40 }}
              />
            </div>
          </div>

          <div className="dark-chat-threads">
            {!user && threadMetas.length === 0 && !productContext ? (
              <div style={{ textAlign: "center", padding: 20 }}>
                <p style={{ color: "#8a94a6", fontSize: "0.9rem", marginBottom: 15 }}>
                  Enter guest email to load messages
                </p>
                <form action="/chat" style={{ display: "flex", gap: 10 }}>
                  <input name="email" type="email" placeholder="Email" className="dark-chat-search" required />
                  <button
                    type="submit"
                    className="dark-chat-add-btn"
                    style={{ width: "auto", padding: "0 15px", borderRadius: 20 }}
                  >
                    Load
                  </button>
                </form>
              </div>
            ) : threadMetas.length === 0 ? (
              <p style={{ color: "#8a94a6", textAlign: "center", marginTop: 30 }}>
                No conversations yet.
              </p>
            ) : (
              threadMetas.map((threadMeta) => {
                const isActive = activeMeta?.key === threadMeta.key;
                const unreadCount = isActive
                  ? 0
                  : threadMeta.key
                      .split("")
                      .reduce((total, char) => total + char.charCodeAt(0), 0) %
                    5;

                return (
                  <form action="/chat" key={threadMeta.key} style={{ margin: 0 }}>
                    <input type="hidden" name="active" value={threadMeta.key} />
                    {guestEmail ? <input type="hidden" name="email" value={guestEmail} /> : null}
                    {productIdContext ? <input type="hidden" name="productId" value={productIdContext} /> : null}
                    {targetOwnerId ? <input type="hidden" name="ownerId" value={targetOwnerId} /> : null}

                    <button
                      type="submit"
                      className={`dark-chat-thread-card ${isActive ? "active" : ""}`}
                      style={{
                        width: "100%",
                        background: isActive ? "" : "transparent",
                        border: "none",
                        textAlign: "left",
                        color: "inherit"
                      }}
                    >
                      <div className="thread-avatar-wrapper">
                        {threadMeta.counterpartAvatar ? (
                          <img
                            src={threadMeta.counterpartAvatar}
                            alt={threadMeta.counterpartName}
                            className="dark-chat-user-avatar"
                          />
                        ) : (
                          <div
                            className="dark-chat-user-avatar"
                            style={{
                              display: "grid",
                              placeItems: "center",
                              background: "#e58e26",
                              fontSize: "1.2rem",
                              fontWeight: "bold"
                            }}
                          >
                            {firstLetter(threadMeta.counterpartName)}
                          </div>
                        )}
                        <div
                          className={`thread-online-indicator ${
                            threadMeta.counterpartOnline ? "online" : "offline"
                          }`}
                        />
                      </div>

                      <div className="thread-details">
                        <div className="thread-header">
                          <h3 className="thread-name">{threadMeta.counterpartName}</h3>
                          <span className="thread-time">{formatTime(threadMeta.lastMessage.createdAt)}</span>
                        </div>
                        <div className="thread-preview">
                          <p className="thread-last-msg">{threadMeta.lastMessage.message}</p>
                          {unreadCount > 0 ? (
                            <span className="thread-unread">{unreadCount > 99 ? "99+" : unreadCount}</span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  </form>
                );
              })
            )}
          </div>

          <div className="dark-chat-sidebar-footer">
            <button className="footer-icon-btn active" type="button">
              <MessageSquare size={22} />
            </button>
            <button className="footer-icon-btn" type="button">
              <Camera size={22} />
            </button>
            <button className="footer-icon-btn" type="button">
              <ScanLine size={22} />
            </button>
            <button className="footer-icon-btn" type="button">
              <Settings size={22} />
            </button>
          </div>
        </aside>

        <main className="dark-chat-main">
          {activeThread && activeMeta && activeLastMessage ? (
            <>
              <header className="dark-chat-main-header">
                <div className="main-header-left">
                  <button className="back-btn" type="button">
                    <ArrowLeft size={24} />
                  </button>

                  <div className="active-avatar-wrap">
                    {activeMeta.counterpartAvatar ? (
                      <img
                        src={activeMeta.counterpartAvatar}
                        alt={activeMeta.counterpartName}
                        className="dark-chat-user-avatar"
                        style={{ width: 40, height: 40 }}
                      />
                    ) : (
                      <div
                        className="dark-chat-user-avatar"
                        style={{
                          width: 40,
                          height: 40,
                          display: "grid",
                          placeItems: "center",
                          background: "#e58e26",
                          fontSize: "1.2rem",
                          fontWeight: "bold"
                        }}
                      >
                        {firstLetter(activeMeta.counterpartName)}
                      </div>
                    )}
                    <span
                      className={`thread-online-indicator active-header-indicator ${
                        activeMeta.counterpartOnline ? "online" : "offline"
                      }`}
                    />
                  </div>

                  <div className="active-user-info">
                    <h2 className="active-user-name">{activeMeta.counterpartName}</h2>
                    <p className="active-user-status">{activeMeta.counterpartStatus}</p>
                  </div>
                </div>

                <div className="main-header-right">
                  <button className="call-btn" type="button">
                    <Phone size={20} />
                  </button>
                </div>
              </header>

              <ActiveChatThread
                initialMessages={activeThread}
                user={user ? { id: user.id, name: user.name, email: user.email } : null}
                conversationId={activeLastMessage.conversationId || activeMeta.key}
                defaultProductId={activeLastMessage.productId || productIdContext}
                recipientId={
                  activeRecipientId ||
                  (user && ownerIsViewer
                    ? activeLastMessage.participantId
                    : activeLastMessage.ownerId)
                }
                participantEmail={activeLastMessage.participantEmail}
                guestEmail={!user ? guestEmail : undefined}
                guestName={!user ? activeThread[0].senderName : undefined}
              />
            </>
          ) : shouldShowComposeForOwner ? (
            <div className="dark-chat-empty-state">
              <MessageSquare size={56} opacity={0.25} />
              <h3>Start a new conversation</h3>
              {productContext ? (
                <p>
                  Message the seller about <strong>{productContext.title}</strong>.
                </p>
              ) : (
                <p>Message this seller directly.</p>
              )}

              <div className="chat-owner-preview">
                <div className="thread-avatar-wrapper">
                  {ownerAvatar ? (
                    <img src={ownerAvatar} alt={ownerName} className="dark-chat-user-avatar" />
                  ) : (
                    <div
                      className="dark-chat-user-avatar"
                      style={{
                        display: "grid",
                        placeItems: "center",
                        background: "#e58e26",
                        fontSize: "1.2rem",
                        fontWeight: "bold"
                      }}
                    >
                      {firstLetter(ownerName)}
                    </div>
                  )}
                  <span
                    className={`thread-online-indicator ${ownerOnline ? "online" : "offline"}`}
                  />
                </div>
                <div>
                  <strong>{ownerName}</strong>
                  <p className="active-user-status">{ownerStatus}</p>
                </div>
              </div>

              {user && targetOwnerId === user.id ? (
                <p>You listed this product, so you cannot open a chat with yourself.</p>
              ) : (
                <div className="dark-chat-form-container" style={{ width: "min(860px, 100%)" }}>
                  <DarkChatForm
                    user={user ? { id: user.id, name: user.name, email: user.email } : null}
                    defaultProductId={productContext?.id || productIdContext}
                    recipientId={user ? targetOwnerId : undefined}
                    participantEmail={!user ? guestEmail?.toLowerCase() : undefined}
                    guestEmail={!user ? guestEmail : undefined}
                  />
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: "grid",
                placeItems: "center",
                color: "#8a94a6",
                flexDirection: "column"
              }}
            >
              <MessageSquare size={60} opacity={0.2} style={{ marginBottom: 20 }} />
              {threadMetas.length > 0
                ? "Select a conversation to start chatting"
                : "No active discussion. Open a product and tap chat to begin."}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
