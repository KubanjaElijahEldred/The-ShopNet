import { ChatForm } from "@/components/forms/ChatForm";
import {
  getChatMessagesForGuest,
  getChatMessagesForUser
} from "@/lib/data";
import { getSessionUser } from "@/lib/session";

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
  location?: {
    latitude: number;
    longitude: number;
    label?: string;
    sharedAt: string;
  };
  createdAt: string;
};

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
  const messages = user
    ? await getChatMessagesForUser(user.id)
    : await getChatMessagesForGuest(guestEmail);

  const grouped = messages.reduce<Record<string, Message[]>>((acc, current) => {
    const message = current as Message;
    acc[message.conversationId] = acc[message.conversationId] || [];
    acc[message.conversationId].push(message);
    return acc;
  }, {});

  const threads = Object.values(grouped).map((thread) =>
    [...thread].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  );

  function avatarFor(message: Message) {
    if (message.senderProfileImage) {
      return (
        <img
          src={message.senderProfileImage}
          alt={message.senderName}
          className="avatar-image"
        />
      );
    }

    return <span className="avatar-fallback">{message.senderName.slice(0, 1).toUpperCase()}</span>;
  }

  return (
    <div className="chat-layout">
      {user ? (
        <ChatForm
          user={{ id: user.id, name: user.name, email: user.email }}
          defaultProductId={params?.productId}
          title="Start a direct conversation"
        />
      ) : (
        <>
          <ChatForm user={null} defaultProductId={params?.productId} />
          <form className="stack-card" action="/chat">
            <span className="eyebrow">Guest inbox</span>
            <h2>Open your conversation</h2>
            <label>
              Your email
              <input name="email" type="email" defaultValue={guestEmail || ""} required />
            </label>
            <button className="button" type="submit">
              Load my messages
            </button>
          </form>
        </>
      )}

      <section className="stack-card">
        <span className="eyebrow">Inbox</span>
        <h2>{user ? "Your conversations" : "Your guest conversations"}</h2>

        {threads.length === 0 ? (
          <p className="muted">No messages yet.</p>
        ) : (
          <div className="chat-thread">
            {threads.map((thread) => {
              const lastMessage = thread[thread.length - 1];
              const ownerIsViewer = user?.id === lastMessage.ownerId;
              const counterpartMessage =
                thread.find((message) =>
                  user
                    ? message.senderId !== user.id
                    : message.senderEmail !== guestEmail
                ) || lastMessage;

              return (
                <article key={lastMessage.conversationId} className="stack-card conversation-card">
                  <div className="chat-meta">
                    <div className="chat-person">
                      {avatarFor(counterpartMessage)}
                      <strong>
                        {ownerIsViewer
                          ? counterpartMessage.participantEmail ||
                            counterpartMessage.senderName
                          : counterpartMessage.senderName}
                      </strong>
                    </div>
                    <span>{lastMessage.productId || "General conversation"}</span>
                  </div>

                  <div className="chat-thread conversation-messages">
                    {thread.map((message) => (
                      <div
                        key={message.id}
                        className={
                          user
                            ? message.senderId === user.id
                              ? "message-bubble mine"
                              : "message-bubble"
                            : message.senderEmail === guestEmail
                              ? "message-bubble mine"
                              : "message-bubble"
                        }
                      >
                        <div className="message-header">
                          <div className="chat-person">
                            {avatarFor(message)}
                            <strong>{message.senderName}</strong>
                          </div>
                        </div>
                        <p>{message.message}</p>
                        {message.location ? (
                          <div className="location-card">
                            <p>
                              {message.location.label || "Live location"}:{" "}
                              {message.location.latitude.toFixed(5)},{" "}
                              {message.location.longitude.toFixed(5)}
                            </p>
                            <a
                              href={`https://www.google.com/maps?q=${message.location.latitude},${message.location.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="location-link"
                            >
                              View live location
                            </a>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <ChatForm
                    user={
                      user
                        ? { id: user.id, name: user.name, email: user.email }
                        : null
                    }
                    conversationId={lastMessage.conversationId}
                    defaultProductId={lastMessage.productId}
                    recipientId={
                      user && ownerIsViewer ? lastMessage.participantId : lastMessage.ownerId
                    }
                    participantEmail={lastMessage.participantEmail}
                    guestEmail={!user ? guestEmail : undefined}
                    guestName={!user ? thread[0].senderName : undefined}
                    title="Reply in this conversation"
                    submitLabel="Reply"
                  />
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
