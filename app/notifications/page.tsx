import { redirect } from "next/navigation";
import { getNotificationsForUser } from "@/lib/data";
import { getSessionUser } from "@/lib/session";

export default async function NotificationsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const notifications = await getNotificationsForUser(user.id);

  return (
    <div className="stack-page">
      <section className="stack-card">
        <span className="eyebrow">Notifications</span>
        <h1>Your seller alerts</h1>
      </section>

      {notifications.length === 0 ? (
        <section className="stack-card">
          <p className="muted">No notifications yet.</p>
        </section>
      ) : (
        <div className="chat-thread">
          {notifications.map((notification) => (
            <article key={notification.id} className="chat-card">
              <strong>{notification.title}</strong>
              <p>{notification.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
