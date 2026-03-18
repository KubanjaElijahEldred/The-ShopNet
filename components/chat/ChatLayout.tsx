"use client";

import { useMemo, useState } from "react";
import { ChatForm } from "@/components/forms/ChatForm";
import type { Message } from "@/app/chat/page";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
};

type StarterChat = {
  conversationId: string;
  recipientId: string;
  productId: string;
  peerName: string;
  peerEmail?: string;
  peerProfileImage?: string;
};

type ChatLayoutProps = {
  user: AuthUser | null;
  threads: Message[][];
  guestEmail?: string;
  defaultProductId?: string;
  starterChat: StarterChat | null;
  initialConversationId?: string;
};

function getPeerDetails(
  thread: Message[],
  user: AuthUser | null,
  guestEmail?: string
) {
  const lastMessage = thread[thread.length - 1];
  const peerMessage =
    thread.find((message) =>
      user ? message.senderId !== user.id : message.senderEmail !== guestEmail
    ) || lastMessage;

  const peerName =
    user && lastMessage.ownerId === user.id
      ? peerMessage.senderName || lastMessage.participantEmail || "Buyer"
      : peerMessage.senderName;

  return {
    lastMessage,
    peerName: peerName || lastMessage.participantEmail || "Chat",
    peerProfileImage: peerMessage.senderProfileImage
  };
}

export function ChatLayout({
  user,
  threads,
  guestEmail,
  defaultProductId,
  starterChat,
  initialConversationId
}: ChatLayoutProps) {
  const threadMap = useMemo(
    () => new Map(threads.map((thread) => [thread[0].conversationId, thread])),
    [threads]
  );
  const hasStarterRow = Boolean(
    starterChat && (!initialConversationId || !threadMap.has(initialConversationId))
  );
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversationId || starterChat?.conversationId || threads[0]?.[0]?.conversationId || null
  );

  const activeThread = activeConversationId ? threadMap.get(activeConversationId) : undefined;
  const starterActive =
    Boolean(starterChat) && activeConversationId === starterChat?.conversationId && !activeThread;
  const activePeer = activeThread ? getPeerDetails(activeThread, user, guestEmail) : null;

  return (
    <div className={`wa-layout ${activeConversationId ? "chat-open" : ""}`}>
      <div className="wa-sidebar">
        <div className="wa-sidebar-header">
          <h3>Chats</h3>
        </div>

        <div className="wa-contact-list">
          {hasStarterRow && starterChat ? (
            <button
              type="button"
              className={`wa-contact-item ${
                activeConversationId === starterChat.conversationId ? "active" : ""
              }`}
              onClick={() => setActiveConversationId(starterChat.conversationId)}
            >
              <div className="wa-avatar">
                {starterChat.peerProfileImage ? (
                  <img src={starterChat.peerProfileImage} alt={starterChat.peerName} />
                ) : (
                  <span>{starterChat.peerName.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div className="wa-contact-info">
                <div className="wa-contact-row">
                  <h4>{starterChat.peerName}</h4>
                  <span className="wa-contact-time">New</span>
                </div>
                <p>Start chatting about this product</p>
              </div>
            </button>
          ) : null}

          {threads.length === 0 && !hasStarterRow ? (
            <p className="wa-empty-text">No active conversations</p>
          ) : (
            threads.map((thread) => {
              const { lastMessage, peerName, peerProfileImage } = getPeerDetails(
                thread,
                user,
                guestEmail
              );

              return (
                <button
                  type="button"
                  key={lastMessage.conversationId}
                  className={`wa-contact-item ${
                    activeConversationId === lastMessage.conversationId ? "active" : ""
                  }`}
                  onClick={() => setActiveConversationId(lastMessage.conversationId)}
                >
                  <div className="wa-avatar">
                    {peerProfileImage ? (
                      <img src={peerProfileImage} alt={peerName} />
                    ) : (
                      <span>{peerName.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="wa-contact-info">
                    <div className="wa-contact-row">
                      <h4>{peerName}</h4>
                      <span className="wa-contact-time">
                        {new Date(lastMessage.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <p>{lastMessage.message}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="wa-main-area">
        {!activeThread && !starterActive ? (
          <div className="wa-empty-state">
            <div className="mock-logo-icon" style={{ fontSize: "4rem" }}>
              💬
            </div>
            <h2>ShopNet Connected</h2>
            <p>Select a chat on the left to start messaging</p>
          </div>
        ) : (
          <>
            <div className="wa-chat-header">
              <button
                type="button"
                className="wa-mobile-back"
                onClick={() => setActiveConversationId(null)}
              >
                ←
              </button>

              {starterActive && starterChat ? (
                <div className="wa-contact-item">
                  <div className="wa-avatar">
                    {starterChat.peerProfileImage ? (
                      <img src={starterChat.peerProfileImage} alt={starterChat.peerName} />
                    ) : (
                      <span>{starterChat.peerName.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h4>{starterChat.peerName}</h4>
                    <p className="wa-header-subtitle">Start a product conversation</p>
                  </div>
                </div>
              ) : activePeer ? (
                <div className="wa-contact-item">
                  <div className="wa-avatar">
                    {activePeer.peerProfileImage ? (
                      <img src={activePeer.peerProfileImage} alt={activePeer.peerName} />
                    ) : (
                      <span>{activePeer.peerName.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h4>{activePeer.peerName}</h4>
                    <p className="wa-header-subtitle">
                      {activePeer.lastMessage.productId
                        ? `Product conversation`
                        : "General conversation"}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="wa-messages">
              {activeThread ? (
                activeThread.map((message) => {
                  const isMine = user
                    ? message.senderId === user.id
                    : message.senderEmail === guestEmail;

                  return (
                    <div
                      key={message.id}
                      className={`wa-bubble ${isMine ? "wa-mine" : "wa-theirs"}`}
                    >
                      {!isMine ? <span className="wa-bubble-name">{message.senderName}</span> : null}
                      <p>{message.message}</p>
                      {message.location ? (
                        <a
                          className="wa-location-link"
                          href={`https://maps.google.com/?q=${message.location.latitude},${message.location.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Shared location
                        </a>
                      ) : null}
                      <span className="wa-bubble-time">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="wa-empty-state">
                  <h2>Start the conversation</h2>
                  <p>Send the first message to the owner of this product.</p>
                </div>
              )}
            </div>

            <div className="wa-compose">
              {starterActive && starterChat ? (
                <ChatForm
                  user={user}
                  defaultProductId={starterChat.productId}
                  ownerId={starterChat.recipientId}
                  recipientId={user ? starterChat.recipientId : undefined}
                  guestEmail={guestEmail}
                  title=""
                  submitLabel="Send"
                />
              ) : activeThread ? (
                (() => {
                  const lastMessage = activeThread[activeThread.length - 1];
                  const recipientId =
                    user && lastMessage.ownerId === user.id
                      ? lastMessage.participantId
                      : lastMessage.ownerId;

                  return (
                    <ChatForm
                      user={user}
                      conversationId={lastMessage.conversationId}
                      ownerId={lastMessage.ownerId}
                      defaultProductId={lastMessage.productId || defaultProductId}
                      recipientId={recipientId}
                      participantEmail={lastMessage.participantEmail}
                      guestEmail={!user ? guestEmail : undefined}
                      guestName={!user ? activeThread[0].senderName : undefined}
                      title=""
                      submitLabel="Send"
                    />
                  );
                })()
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
