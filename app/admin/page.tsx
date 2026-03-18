import { redirect } from "next/navigation";
import { ProductCrudPanel } from "@/components/products/ProductCrudPanel";
import { getAdminOverview, getProducts, getUserPublicProfiles } from "@/lib/data";
import { getSessionUser } from "@/lib/session";

export default async function AdminPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/auth");
  }

  if (user.role !== "admin") {
    redirect("/profile");
  }

  const [overview, products, users] = await Promise.all([
    getAdminOverview(),
    getProducts(),
    getUserPublicProfiles()
  ]);
  const userMap = new Map(users.map((profile) => [profile.id, profile.name]));
  const managedProducts = products.map((product) => ({
    ...product,
    ownerName: userMap.get(product.ownerId) || "Unknown seller"
  }));

  return (
    <div className="stack-page">
      <section className="stack-card">
        <span className="eyebrow">Admin dashboard</span>
        <h1>Platform control center</h1>
        <p className="muted">
          View ShopNet users, orders, products, and recent chats from one place.
        </p>
      </section>

      <section className="stats-grid">
        <article className="stack-card stat-card">
          <span className="eyebrow">Users</span>
          <h2>{overview.userCount}</h2>
        </article>
        <article className="stack-card stat-card">
          <span className="eyebrow">Products</span>
          <h2>{overview.productCount}</h2>
        </article>
        <article className="stack-card stat-card">
          <span className="eyebrow">Orders</span>
          <h2>{overview.orderCount}</h2>
        </article>
        <article className="stack-card stat-card">
          <span className="eyebrow">Chats</span>
          <h2>{overview.messageCount}</h2>
        </article>
      </section>

      <ProductCrudPanel
        products={managedProducts}
        title="Admin product tools"
        description="Add new products and edit or delete any existing listing."
        canManageAll
      />

      <section className="dashboard-grid">
        <div className="stack-card">
          <span className="eyebrow">Recent orders</span>
          <div className="chat-thread">
            {overview.recentOrders.length === 0 ? (
              <p className="muted">No orders yet.</p>
            ) : (
              overview.recentOrders.map((order) => (
                <article key={order.id} className="chat-card">
                  <strong>{order.userName}</strong>
                  <p>{order.status}</p>
                  <p>UGX {order.total.toLocaleString()}</p>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="stack-card">
          <span className="eyebrow">Recent chats</span>
          <div className="chat-thread">
            {overview.recentMessages.length === 0 ? (
              <p className="muted">No chats yet.</p>
            ) : (
              overview.recentMessages.map((message) => (
                <article key={message.id} className="chat-card">
                  <strong>{message.senderName}</strong>
                  <p>{message.message}</p>
                  <p className="muted">{message.senderEmail}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="stack-card">
        <div className="section-header">
          <div>
            <span className="eyebrow">Account owners</span>
            <h2>Registered users</h2>
          </div>
          <strong>{overview.userCount} total</strong>
        </div>

        <div className="chat-thread">
          {overview.users.map((account) => (
            <article key={account.id} className="chat-card account-card">
              <strong>{account.name}</strong>
              <p>{account.email}</p>
              <p>{account.location}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
