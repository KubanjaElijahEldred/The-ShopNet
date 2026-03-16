import { redirect } from "next/navigation";
import { getAdminOverview } from "@/lib/data";
import { getSessionUser } from "@/lib/session";

export default async function AdminPage() {
  const user = await getSessionUser();
  const isConfiguredAdmin = Boolean(process.env.ADMIN_EMAIL) && user?.email === process.env.ADMIN_EMAIL;

  if (!user || (user.role !== "admin" && !isConfiguredAdmin)) {
    redirect("/");
  }

  const overview = await getAdminOverview();

  return (
    <div className="stack-page">
      <section className="stack-card">
        <span className="eyebrow">Admin</span>
        <h1>Platform overview</h1>
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
          <span className="eyebrow">Revenue</span>
          <h2>UGX {overview.totalRevenue.toLocaleString()}</h2>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="stack-card">
          <span className="eyebrow">Recent orders</span>
          <div className="chat-thread">
            {overview.recentOrders.map((order) => (
              <article key={order.id} className="chat-card">
                <strong>{order.userName}</strong>
                <p>{order.status}</p>
                <p>UGX {order.total.toLocaleString()}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="stack-card">
          <span className="eyebrow">Recent products</span>
          <div className="chat-thread">
            {overview.recentProducts.map((product) => (
              <article key={product.id} className="chat-card">
                <strong>{product.title}</strong>
                <p>{product.category}</p>
                <p>Stock: {product.stock}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
