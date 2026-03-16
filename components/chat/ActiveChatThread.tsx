"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DarkChatForm, type DarkChatMessage } from "@/components/chat/DarkChatForm";

type Viewer = {
  id: string;
  name: string;
  email: string;
} | null;

type ActiveChatThreadProps = {
  initialMessages: DarkChatMessage[];
  user: Viewer;
  guestEmail?: string;
  conversationId: string;
  defaultProductId?: string;
  recipientId?: string;
  participantEmail?: string;
  guestName?: string;
};

function formatTime(isoString: string) {
  const d = new Date(isoString);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

export function ActiveChatThread({
  initialMessages,
  user,
  guestEmail,
  conversationId,
  defaultProductId,
  recipientId,
  participantEmail,
  guestName
}: ActiveChatThreadProps) {
  const [messages, setMessages] = useState(initialMessages);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const normalizedGuestEmail = guestEmail?.toLowerCase().trim();

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages]
  );

  function queueMessage(message: DarkChatMessage) {
    setMessages((current) => [...current, message]);
  }

  function confirmMessage(temporaryId: string, message: DarkChatMessage) {
    setMessages((current) =>
      current.map((entry) => (entry.id === temporaryId ? message : entry))
    );
  }

  function failMessage(temporaryId: string) {
    setMessages((current) => current.filter((entry) => entry.id !== temporaryId));
  }

  return (
    <>
      <div className="dark-chat-messages">
        <div className="date-divider">
          <span>Today</span>
        </div>
        {sortedMessages.map((message, index) => {
          const isMine = user
            ? message.senderId === user.id
            : message.senderEmail.toLowerCase() === normalizedGuestEmail;
          const isOptimistic = message.id.startsWith("optimistic-");

          return (
            <div
              key={message.id || `${message.createdAt}-${index}`}
              className={`message-bubble ${isMine ? "sent" : "received"}`}
              style={isOptimistic ? { opacity: 0.72 } : undefined}
            >
              <div className="message-content">
                {message.message}
                <span className="message-time">
                  {isOptimistic ? "Sending..." : formatTime(message.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="dark-chat-form-container">
        <DarkChatForm
          user={user}
          conversationId={conversationId}
          defaultProductId={defaultProductId}
          recipientId={recipientId}
          participantEmail={participantEmail}
          guestEmail={!user ? guestEmail : undefined}
          guestName={!user ? guestName : undefined}
          onMessageQueued={queueMessage}
          onMessageConfirmed={confirmMessage}
          onMessageFailed={failMessage}
        />
      </div>
    </>
  );
}
