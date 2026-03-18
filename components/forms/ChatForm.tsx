"use client";

import { type FormEvent, type JSX, useState } from "react";
import { useRouter } from "next/navigation";

export type ChatFormProps = {
  user:
    | {
        id: string;
        name: string;
        email: string;
      }
    | null;
  defaultProductId?: string;
  conversationId?: string;
  ownerId?: string;
  recipientId?: string;
  participantEmail?: string;
  guestEmail?: string;
  guestName?: string;
  submitLabel?: string;
  title?: string;
};

export const ChatForm = ({
  user,
  defaultProductId,
  conversationId,
  ownerId,
  recipientId,
  participantEmail,
  guestEmail,
  guestName,
  submitLabel = "Send message",
  title = "Start a conversation"
}: ChatFormProps): JSX.Element => {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [locationState, setLocationState] = useState<{
    latitude: number;
    longitude: number;
    label: string;
  } | null>(null);
  const [locating, setLocating] = useState(false);

  function shareLiveLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }

    setLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: "Live location shared"
        });
        setLocating(false);
      },
      () => {
        setError("Unable to get your live location.");
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPending(true);
    setSuccess("");
    setError("");

    const formData = new FormData(form);

    const payload = {
      ...Object.fromEntries(formData.entries()),
      latitude: locationState?.latitude,
      longitude: locationState?.longitude,
      locationLabel: locationState?.label
    };

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    setPending(false);

    if (!response.ok) {
      setError(data.error || "Unable to send message.");
      return;
    }

    setSuccess("Message sent.");
    form.reset();
    setLocationState(null);
    router.refresh();
  }

  return (
    <form className="stack-card form-card" onSubmit={handleSubmit}>
      <div>
        <span className="eyebrow">{user ? "Direct chat" : "Guest chat"}</span>
        <h2>{title}</h2>
      </div>

      {!user ? (
        <>
          <label>
            Your name
            <input name="guestName" defaultValue={guestName || ""} required />
          </label>

          <label>
            Your email
            <input
              name="guestEmail"
              type="email"
              defaultValue={guestEmail || ""}
              required
            />
          </label>

          <label>
            Profile image URL (optional)
            <input
              name="guestProfileImage"
              type="url"
              placeholder="https://example.com/profile-photo.jpg"
            />
          </label>
        </>
      ) : null}

      {!conversationId ? (
        <label>
          Product ID (optional)
          <input name="productId" defaultValue={defaultProductId || ""} />
        </label>
      ) : (
        <input type="hidden" name="productId" defaultValue={defaultProductId || ""} />
      )}

      {conversationId ? (
        <input type="hidden" name="conversationId" value={conversationId} />
      ) : null}
      {ownerId ? <input type="hidden" name="ownerId" value={ownerId} /> : null}

      {recipientId ? <input type="hidden" name="recipientId" value={recipientId} /> : null}
      {participantEmail ? (
        <input type="hidden" name="participantEmail" value={participantEmail} />
      ) : null}

      <label>
        Message
        <textarea name="message" rows={4} required />
      </label>

      <div className="location-share-box">
        <button
          className="button button-secondary"
          disabled={locating || pending}
          onClick={shareLiveLocation}
          type="button"
        >
          {locating ? "Getting location..." : "Share live location"}
        </button>
        {locationState ? (
          <p className="success-text">
            Location ready: {locationState.latitude.toFixed(5)},{" "}
            {locationState.longitude.toFixed(5)}
          </p>
        ) : (
          <p className="muted">Attach your current live location to this message.</p>
        )}
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}

      <button className="button" disabled={pending} type="submit">
        {pending ? "Sending..." : submitLabel}
      </button>
    </form>
  );
};
