import { redirect } from "next/navigation";
import { OrderStatusActions } from "@/components/orders/OrderStatusActions";
import { getOrdersForUser } from "@/lib/data";
import { getSessionUser } from "@/lib/session";

type OrderItem = {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  frontImage: string;
};

export default async function OrdersPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/auth");
  }

  const orders = await getOrdersForUser(user.id);

  return (
    <div className="stack-page">
      <section className="stack-card">
        <span className="eyebrow">Orders</span>
        <h1>Your order history</h1>
      </section>

      {orders.length === 0 ? (
        <section className="stack-card">
          <p className="muted">You have not placed any orders yet.</p>
        </section>
      ) : (
        orders.map((order) => (
          <section key={order.id} className="stack-card order-card">
            <div className="section-header">
              <div>
                <h2>Order {order.id}</h2>
                <p className="muted">
                  {order.status} · {order.paymentMethod} · {order.location}
                </p>
              </div>
              <strong>UGX {order.total.toLocaleString()}</strong>
            </div>

            <div className="order-status-track">
              {["Pending", "Confirmed", "Packed", "Shipped", "Delivered"].map(
                (status, index, list) => {
                  const active =
                    list.indexOf(order.status) >= index ||
                    order.status === status;
                  return (
                    <span key={status} className={active ? "active-step" : ""}>
                      {status}
                    </span>
                  );
                }
              )}
            </div>

            <div className="order-items">
              {order.items.map((item: OrderItem) => (
                <article key={`${order.id}-${item.productId}`} className="owner-product">
                  <img src={item.frontImage} alt={item.title} />
                  <div>
                    <h3>{item.title}</h3>
                    <p>Qty: {item.quantity}</p>
                    <p>UGX {item.price.toLocaleString()}</p>
                  </div>
                </article>
              ))}
            </div>
            <OrderStatusActions
              orderId={order.id}
              canBuyerCancel={["Pending", "Confirmed"].includes(order.status)}
              canBuyerReturn={order.status === "Delivered"}
            />
          </section>
        ))
      )}
    </div>
  );
}
