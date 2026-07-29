"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  CircleDollarSign,
  FileText,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

type NotificationType =
  | "APPOINTMENT"
  | "BUDGET"
  | "PAYMENT"
  | "CLINICAL_HISTORY";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
};

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);

      const res = await fetch("/api/notifications", {
        cache: "no-store",
      });

      const data = await res.json();

      setNotifications(data.notifications ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function openNotification(notification: Notification) {
    if (!notification.read) {
      await fetch(
        `/api/notifications/${notification.id}/read`,
        {
          method: "PATCH",
        }
      );

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, read: true }
            : item
        )
      );
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-[#263F3B]">
          Notificaciones
        </h1>

        <p className="mt-2 text-sm text-[#6F7D77]">
          Consultá todas las novedades relacionadas con tus
          turnos, presupuestos, pagos e historia clínica.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-[#6F855F]" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-3xl border border-[#DED9CD] bg-white p-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF1EA]">
            <Bell className="h-7 w-7 text-[#6F855F]" />
          </div>

          <h2 className="mt-5 text-lg font-semibold">
            No tenés notificaciones
          </h2>

          <p className="mt-2 text-sm text-[#71807B]">
            Cuando ocurra alguna novedad aparecerá acá.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[#DED9CD] bg-white">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() =>
                openNotification(notification)
              }
              className={`flex w-full items-start gap-4 border-b border-[#EEEAE2] p-6 text-left transition hover:bg-[#F7F5EF] last:border-b-0 ${
                notification.read
                  ? "bg-white"
                  : "bg-[#F1F4ED]"
              }`}
            >
              <NotificationIcon type={notification.type} />

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {notification.title}
                  </h3>

                  {!notification.read && (
                    <span className="h-2.5 w-2.5 rounded-full bg-[#6F855F]" />
                  )}
                </div>

                <p className="mt-2 text-sm leading-6 text-[#6E7A76]">
                  {notification.message}
                </p>

                <p className="mt-3 text-xs text-[#9AA39F]">
                  {new Date(
                    notification.createdAt
                  ).toLocaleString("es-AR")}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationIcon({
  type,
}: {
  type: NotificationType;
}) {
  const cls =
    "flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF1EA] text-[#6F855F]";

  switch (type) {
    case "APPOINTMENT":
      return (
        <div className={cls}>
          <CalendarDays size={20} />
        </div>
      );

    case "BUDGET":
      return (
        <div className={cls}>
          <FileText size={20} />
        </div>
      );

    case "PAYMENT":
      return (
        <div className={cls}>
          <CircleDollarSign size={20} />
        </div>
      );

    case "CLINICAL_HISTORY":
      return (
        <div className={cls}>
          <ClipboardList size={20} />
        </div>
      );

    default:
      return (
        <div className={cls}>
          <Bell size={20} />
        </div>
      );
  }
}