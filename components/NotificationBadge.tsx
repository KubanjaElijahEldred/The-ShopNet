"use client";

import { useEffect, useState } from "react";

type NotificationBadgeProps = {
  children: React.ReactNode;
  className?: string;
  channel?: string;
};

export function NotificationBadge({
  children,
  className = "",
  channel = "chat"
}: NotificationBadgeProps) {
  const [count, setCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(
        `/api/notifications/unread-count?channel=${encodeURIComponent(channel)}`
      );
      if (response.ok) {
        const data = await response.json();
        setCount(data.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  useEffect(() => {
    // Only poll if user is authenticated
    const checkAuthAndFetch = async () => {
      try {
        const res = await fetch('/api/me');
        if (!res.ok) return; // Not authenticated
        void fetchUnreadCount();
      } catch {
        return;
      }
    };
    
    // Initial fetch
    checkAuthAndFetch();

    // Poll every 30 seconds for new notifications (only if authenticated)
    const interval = setInterval(checkAuthAndFetch, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  return (
    <div className={`notification-badge-wrapper ${className}`}>
      {children}
      {count > 0 && (
        <span className="notification-badge">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
}
