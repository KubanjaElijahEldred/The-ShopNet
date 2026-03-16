"use client";

import { startTransition, type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Camera, Mic, Send } from "lucide-react";

export type DarkChatMessage = {
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

export type DarkChatFormProps = {
  user: { id: string; name: string; email: string; } | null;
  conversationId?: string;
  recipientId?: string;
  participantEmail?: string;
  guestEmail?: string;
  guestName?: string;
  defaultProductId?: string;
  onMessageQueued?: (message: DarkChatMessage) => void;
  onMessageConfirmed?: (temporaryId: string, message: DarkChatMessage) => void;
  onMessageFailed?: (temporaryId: string) => void;
};

export const DarkChatForm = ({
  user,
  conversationId,
  recipientId,
  participantEmail,
  guestEmail,
  guestName,
  defaultProductId,
  onMessageQueued,
  onMessageConfirmed,
  onMessageFailed
}: DarkChatFormProps) => {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [guestNameValue, setGuestNameValue] = useState(guestName || "");
  const [guestEmailValue, setGuestEmailValue] = useState(guestEmail || "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    if (!user && (!guestNameValue.trim() || !guestEmailValue.trim())) {
      setError("Please enter your name and email before sending a message.");
      return;
    }

    setPending(true);
    setError("");

    const normalizedGuestEmail = guestEmailValue.trim().toLowerCase();
    const normalizedGuestName = guestNameValue.trim();
    const temporaryId = `optimistic-${Date.now()}`;
    const queuedAt = new Date().toISOString();

    onMessageQueued?.({
      id: temporaryId,
      conversationId: conversationId || temporaryId,
      ownerId: recipientId || user?.id || "pending-owner",
      participantId: user?.id,
      participantEmail: participantEmail || (!user ? normalizedGuestEmail : undefined),
      senderId: user?.id,
      senderName: user ? user.name : normalizedGuestName,
      senderEmail: user ? user.email : normalizedGuestEmail,
      productId: defaultProductId,
      message: trimmedMessage,
      createdAt: queuedAt
    });

    setMessage("");

    try {
      const payload = {
        message: trimmedMessage,
        conversationId,
        recipientId,
        participantEmail,
        guestEmail: user ? undefined : normalizedGuestEmail,
        guestName: user ? undefined : normalizedGuestName,
        productId: defaultProductId
      };

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));
      setPending(false);

      if (!response.ok) {
        onMessageFailed?.(temporaryId);
        setMessage(trimmedMessage);
        setError(data?.error || "Unable to send message right now.");
        return;
      }

      if (data?.message) {
        onMessageConfirmed?.(temporaryId, data.message as DarkChatMessage);
      }

      const conversationIdFromApi = data?.message?.conversationId as string | undefined;
      startTransition(() => {
        if (conversationIdFromApi && typeof window !== "undefined") {
          const query = new URLSearchParams(window.location.search);
          query.set("active", conversationIdFromApi);
          if (!user) {
            query.set("email", normalizedGuestEmail);
          }
          router.replace(`/chat?${query.toString()}`);
        }

        router.refresh();
      });
    } catch {
      setPending(false);
      onMessageFailed?.(temporaryId);
      setMessage(trimmedMessage);
      setError("Network error while sending message. Please try again.");
    }
  }

  return (
    <form className="dark-chat-form" onSubmit={handleSubmit}>
      {!user ? (
        <div className="dark-chat-guest-meta">
          <input
            type="text"
            value={guestNameValue}
            onChange={(event) => setGuestNameValue(event.target.value)}
            placeholder="Your name"
            className="dark-chat-inline-input"
            disabled={pending}
            required
          />
          <input
            type="email"
            value={guestEmailValue}
            onChange={(event) => setGuestEmailValue(event.target.value)}
            placeholder="Your email"
            className="dark-chat-inline-input"
            disabled={pending}
            required
          />
        </div>
      ) : null}

      <div className="dark-chat-form-row">
        <button type="button" className="dark-chat-icon-btn paperclip-btn">
          <Paperclip size={20} />
        </button>
        <div className="dark-chat-input-wrapper">
          <button type="button" className="dark-chat-icon-btn camera-btn">
            <span role="img" aria-label="emoji">😊</span>
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message"
            className="dark-chat-input"
            disabled={pending}
          />
          <button type="button" className="dark-chat-icon-btn attachment-btn">
            <Camera size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="dark-chat-submit-btn"
          disabled={pending || !message.trim()}
        >
          {message.trim() ? <Send size={20} /> : <Mic size={20} />}
        </button>
      </div>

      {error ? <p className="dark-chat-error">{error}</p> : null}
    </form>
  );
};
