import { redirect } from "next/navigation";
import { OrderStatusActions } from "@/components/orders/OrderStatusActions";
import { getSellerDashboard } from "@/lib/data";
import { getSessionUser } from "@/lib/session";

type DashboardOrder = {
  id: string;
  userName: string;
  status: string;
  total: number;
};

type DashboardMessage = {
  id: string;
  senderName: string;
  message: string;
};

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/auth");
  }

  if (user.role === "admin") {
    redirect("/admin");
  }

  const dashboard = await getSellerDashboard(user.id);

  return (
    <div className="stack-page">
      <section className="stack-card">
        <span className="eyebrow">Seller dashboard</span>
        <h1>{user.name}&apos;s business overview</h1>
      </section>

      <section className="stats-grid">
        <article className="stack-card stat-card">
          <span className="eyebrow">Products</span>
          <h2>{dashboard.productCount}</h2>
        </article>
        <article className="stack-card stat-card">
          <span className="eyebrow">Orders</span>
          <h2>{dashboard.orderCount}</h2>
        </article>
        <article className="stack-card stat-card">
          <span className="eyebrow">Messages</span>
          <h2>{dashboard.messageCount}</h2>
        </article>
        <article className="stack-card stat-card">
          <span className="eyebrow">Revenue</span>
          <h2>UGX {dashboard.revenue.toLocaleString()}</h2>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="stack-card">
          <span className="eyebrow">Recent orders</span>
          {dashboard.recentOrders.length === 0 ? (
            <p className="muted">No sales yet.</p>
          ) : (
            <div className="chat-thread">
              {dashboard.recentOrders.map((order: DashboardOrder) => (
                <article key={order.id} className="chat-card">
                  <strong>{order.userName}</strong>
                  <p>{order.status}</p>
                  <p>UGX {order.total.toLocaleString()}</p>
                  <OrderStatusActions orderId={order.id} sellerView />
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="stack-card">
          <span className="eyebrow">Recent messages</span>
          {dashboard.recentMessages.length === 0 ? (
            <p className="muted">No messages yet.</p>
          ) : (
            <div className="chat-thread">
              {dashboard.recentMessages.map((message: DashboardMessage) => (
                <article key={message.id} className="chat-card">
                  <strong>{message.senderName}</strong>
                  <p>{message.message}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
