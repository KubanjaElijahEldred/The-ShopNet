import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { getAdminOverview, getChatMessagesForUser } from "@/lib/data";

export default async function AdminDashboardPage() {
  const user = await getSessionUser();
  const isConfiguredAdmin =
    Boolean(process.env.ADMIN_EMAIL) && user?.email === process.env.ADMIN_EMAIL;

  if (!user || (user.role !== "admin" && !isConfiguredAdmin)) {
    redirect("/");
  }

  const [overview, chats] = await Promise.all([
    getAdminOverview(),
    getChatMessagesForUser()
  ]);
  const activeChats = new Set(chats.map((chat) => chat.conversationId)).size;
  const totalUsers = overview.userCount;
  const totalOrders = overview.orderCount;

  return (
    <div className="page-shell">
      <div className="stack-card">
        <span className="eyebrow">Admin View</span>
        <h1>Admin Dashboard</h1>
        <p className="muted">Welcome, {user.name}. Here is an overview of the platform.</p>
        
        <div className="grid-two" style={{ marginTop: "2rem" }}>
          <div className="stack-card" style={{ background: "rgba(31, 122, 140, 0.1)", border: "1px solid rgba(31, 122, 140, 0.3)" }}>
            <h2 style={{ fontSize: "2rem", margin: 0, color: "var(--accent)" }}>{totalOrders}</h2>
            <p style={{ margin: 0, fontWeight: 700 }}>Orders Made</p>
          </div>
          
          <div className="stack-card" style={{ background: "rgba(229, 142, 38, 0.1)", border: "1px solid rgba(229, 142, 38, 0.3)" }}>
            <h2 style={{ fontSize: "2rem", margin: 0, color: "var(--brand)" }}>{activeChats}</h2>
            <p style={{ margin: 0, fontWeight: 700 }}>Active Chats</p>
          </div>
          
          <div className="stack-card" style={{ background: "rgba(37, 121, 66, 0.1)", border: "1px solid rgba(37, 121, 66, 0.3)" }}>
            <h2 style={{ fontSize: "2rem", margin: 0, color: "var(--success)" }}>{totalUsers}</h2>
            <p style={{ margin: 0, fontWeight: 700 }}>Registered Users</p>
          </div>
        </div>
      </div>
    </div>
  );
}
