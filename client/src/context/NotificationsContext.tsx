"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  NotificationRequestAccepted,
  NotificationRequestRejected,
  NotificationServiceFinished,
  NotificationServiceRequest,
} from "@/components/ui";
import type { NotificationType } from "@/lib/mock";

// What any screen sends to show a notification.
// "type" uses the same names as the database (see lib/mock/types.ts).
export interface NotificationInput {
  type: NotificationType;
  name: string;
  avatarUrl?: string;
  tag?: string;
  message?: string;
  // Screen to open when the notification is tapped.
  href?: string;
}

interface ActiveNotification extends NotificationInput {
  id: number;
}

interface NotificationsContextValue {
  showNotification: (notification: NotificationInput) => void;
  dismissNotification: (id: number) => void;
}

const NOTIFICATION_DURATION_MS = 5000;

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

// Picks the shared component that matches each notification type.
function NotificationItem({ notification, onClick }: { notification: ActiveNotification; onClick: () => void }) {
  const { type, name, avatarUrl, tag, message } = notification;
  const common = { name, avatarUrl, onClick, ...(message ? { message } : {}) };

  switch (type) {
    case "incoming_services":
      return <NotificationServiceRequest {...common} tag={tag} />;
    case "request_accepted":
      return <NotificationRequestAccepted {...common} />;
    case "request_rejected":
      return <NotificationRequestRejected {...common} />;
    case "services_finished":
      return <NotificationServiceFinished {...common} />;
  }
}

// Host of the 4 notifications: it shows them on top of any screen.
// Usage from any screen: const { showNotification } = useNotifications();
export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<ActiveNotification[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const dismissNotification = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback(
    (notification: NotificationInput) => {
      const id = nextId.current++;
      setNotifications((prev) => [...prev, { ...notification, id }]);
      timers.current.set(
        id,
        setTimeout(() => dismissNotification(id), NOTIFICATION_DURATION_MS),
      );
    },
    [dismissNotification],
  );

  const handleClick = (notification: ActiveNotification) => {
    dismissNotification(notification.id);
    if (notification.href) router.push(notification.href);
  };

  return (
    <NotificationsContext.Provider value={{ showNotification, dismissNotification }}>
      {children}
      {/* Same width as the phone column, aligned to its right edge. Above the header and the map (z-1000). */}
      <div className="pointer-events-none fixed inset-x-0 top-19 z-1100 mx-auto flex w-full max-w-110 flex-col items-end gap-6">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            role="status"
            className="pointer-events-auto flex w-full justify-end transition-transform duration-500 ease-out starting:translate-x-full"
          >
            <NotificationItem notification={notification} onClick={() => handleClick(notification)} />
          </div>
        ))}
      </div>
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
};
