"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Bell,
  CalendarDays,
  CheckCheck,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Loader2,
  Menu,
} from "lucide-react";
import { useRouter } from "next/navigation";
import PatientSidebar from "./PatientSidebar";

type PatientShellProps = {
  children: ReactNode;
  patientName: string;
  initials: string;
  patientImage?: string | null;
  clinicName: string;
  logoUrl?: string | null;
};

type NotificationType =
  | "APPOINTMENT"
  | "BUDGET"
  | "PAYMENT"
  | "CLINICAL_HISTORY";

type PatientNotification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  actionUrl: string | null;
  appointmentId: string | null;
  budgetId: string | null;
  paymentId: string | null;
  clinicalHistoryId: string | null;
  createdAt: string;
};

type NotificationsResponse = {
  notifications: PatientNotification[];
  unreadCount: number;
};

export default function PatientShell({
  children,
  patientName,
  initials,
  patientImage,
  clinicName,
  logoUrl,
}: PatientShellProps) {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [notifications, setNotifications] = useState<
    PatientNotification[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loadingNotifications, setLoadingNotifications] =
    useState(true);
  const [markingAllAsRead, setMarkingAllAsRead] =
    useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  async function loadNotifications() {
    try {
      setLoadingNotifications(true);

      const response = await fetch("/api/notifications", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as
        | NotificationsResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in data
            ? data.error
            : "No se pudieron obtener las notificaciones"
        );
      }

      if (
        "notifications" in data &&
        Array.isArray(data.notifications)
      ) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    } finally {
      setLoadingNotifications(false);
    }
  }

  async function markNotificationAsRead(
    notificationId: string
  ) {
    const notification = notifications.find(
      (item) => item.id === notificationId
    );

    if (!notification || notification.read) {
      return;
    }

    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.error ??
            "No se pudo marcar la notificación como leída"
        );
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                read: true,
              }
            : item
        )
      );

      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (error) {
      console.error(
        "Error al marcar la notificación como leída:",
        error
      );
    }
  }

  async function handleNotificationClick(
    notification: PatientNotification
  ) {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }

    setNotificationsOpen(false);

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  }

  async function markAllAsRead() {
    if (unreadCount === 0 || markingAllAsRead) {
      return;
    }

    try {
      setMarkingAllAsRead(true);

      const response = await fetch(
        "/api/notifications/read-all",
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.error ??
            "No se pudieron marcar las notificaciones como leídas"
        );
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Error al marcar todas como leídas:",
        error
      );
    } finally {
      setMarkingAllAsRead(false);
    }
  }

  function goToAllNotifications() {
    setNotificationsOpen(false);
    router.push("/dashboard/patient/notificaciones");
  }

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <PatientSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        clinicName={clinicName}
        logoUrl={logoUrl}
      />

      <div
        className={`min-h-screen transition-[margin] duration-300 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-0"
        }`}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#DED9CD] bg-[#FFFCF7]/95 px-5 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() =>
                setSidebarOpen((current) => !current)
              }
              aria-label={
                sidebarOpen ? "Cerrar menú" : "Abrir menú"
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#6F855F] transition hover:bg-[#F0EDE6]"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="hidden min-w-0 items-center gap-3 sm:flex">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={clinicName}
                  className="h-9 w-9 shrink-0 object-contain"
                />
              ) : null}

              <span className="truncate text-sm font-semibold text-[#263F3B]">
                {clinicName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div
              ref={notificationsRef}
              className="relative"
            >
              <button
                type="button"
                aria-label="Notificaciones"
                aria-expanded={notificationsOpen}
                onClick={() =>
                  setNotificationsOpen(
                    (current) => !current
                  )
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#6F855F] transition hover:bg-[#F0EDE6]"
              >
                <Bell className="h-5 w-5" />

                {unreadCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#B85C5C] px-1 text-[10px] font-bold leading-none text-white">
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </span>
                ) : null}
              </button>

              {notificationsOpen ? (
                <div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden rounded-2xl border border-[#DED9CD] bg-[#FFFCF7] shadow-xl">
                  <div className="flex items-center justify-between border-b border-[#E7E2D8] px-4 py-4">
                    <div>
                      <h2 className="font-serif text-lg font-semibold text-[#263F3B]">
                        Notificaciones
                      </h2>

                      <p className="mt-0.5 text-xs text-[#71807B]">
                        {unreadCount === 0
                          ? "No tenés notificaciones sin leer"
                          : unreadCount === 1
                            ? "Tenés 1 notificación sin leer"
                            : `Tenés ${unreadCount} notificaciones sin leer`}
                      </p>
                    </div>

                    {unreadCount > 0 ? (
                      <button
                        type="button"
                        onClick={() =>
                          void markAllAsRead()
                        }
                        disabled={markingAllAsRead}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#6F855F] transition hover:text-[#4F6844] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {markingAllAsRead ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCheck className="h-3.5 w-3.5" />
                        )}

                        Marcar todas
                      </button>
                    ) : null}
                  </div>

                  <div className="max-h-[390px] overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="flex min-h-40 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-[#6F855F]" />
                      </div>
                    ) : recentNotifications.length === 0 ? (
                      <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF1EA] text-[#6F855F]">
                          <Bell className="h-5 w-5" />
                        </div>

                        <p className="mt-3 text-sm font-semibold text-[#263F3B]">
                          No tenés notificaciones
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#71807B]">
                          Acá aparecerán las novedades sobre
                          tus turnos, presupuestos, pagos e
                          historia clínica.
                        </p>
                      </div>
                    ) : (
                      recentNotifications.map(
                        (notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() =>
                              void handleNotificationClick(
                                notification
                              )
                            }
                            className={`flex w-full gap-3 border-b border-[#EEEAE2] px-4 py-4 text-left transition last:border-b-0 hover:bg-[#F7F5EF] ${
                              notification.read
                                ? "bg-[#FFFCF7]"
                                : "bg-[#F1F4ED]"
                            }`}
                          >
                            <NotificationIcon
                              type={notification.type}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-semibold text-[#263F3B]">
                                  {notification.title}
                                </p>

                                {!notification.read ? (
                                  <span
                                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#6F855F]"
                                    aria-label="Sin leer"
                                  />
                                ) : null}
                              </div>

                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#66736F]">
                                {notification.message}
                              </p>

                              <p className="mt-1.5 text-[11px] font-medium text-[#8B958F]">
                                {formatRelativeDate(
                                  notification.createdAt
                                )}
                              </p>
                            </div>
                          </button>
                        )
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={goToAllNotifications}
                    className="flex w-full items-center justify-center border-t border-[#E7E2D8] px-4 py-3.5 text-sm font-semibold text-[#6F855F] transition hover:bg-[#F3F1EB]"
                  >
                    Ver todas las notificaciones
                  </button>
                </div>
              ) : null}
            </div>

            {patientImage ? (
              <img
                src={patientImage}
                alt={patientName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6F855F] text-sm font-semibold text-white">
                {initials || "P"}
              </div>
            )}

            <span className="hidden max-w-48 truncate text-sm font-medium md:block">
              {patientName}
            </span>
          </div>
        </header>

        <main className="px-5 py-6 md:px-8 md:py-8 xl:px-10">
          <div className="mx-auto max-w-[1400px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NotificationIcon({
  type,
}: {
  type: NotificationType;
}) {
  const commonClassName =
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E7ECE2] text-[#6F855F]";

  switch (type) {
    case "APPOINTMENT":
      return (
        <div className={commonClassName}>
          <CalendarDays className="h-4.5 w-4.5" />
        </div>
      );

    case "BUDGET":
      return (
        <div className={commonClassName}>
          <FileText className="h-4.5 w-4.5" />
        </div>
      );

    case "PAYMENT":
      return (
        <div className={commonClassName}>
          <CircleDollarSign className="h-4.5 w-4.5" />
        </div>
      );

    case "CLINICAL_HISTORY":
      return (
        <div className={commonClassName}>
          <ClipboardList className="h-4.5 w-4.5" />
        </div>
      );

    default:
      return (
        <div className={commonClassName}>
          <Bell className="h-4.5 w-4.5" />
        </div>
      );
  }
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const now = new Date();

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const differenceInSeconds = Math.floor(
    (now.getTime() - date.getTime()) / 1000
  );

  if (differenceInSeconds < 60) {
    return "Hace unos segundos";
  }

  const differenceInMinutes = Math.floor(
    differenceInSeconds / 60
  );

  if (differenceInMinutes < 60) {
    return differenceInMinutes === 1
      ? "Hace 1 minuto"
      : `Hace ${differenceInMinutes} minutos`;
  }

  const differenceInHours = Math.floor(
    differenceInMinutes / 60
  );

  if (differenceInHours < 24) {
    return differenceInHours === 1
      ? "Hace 1 hora"
      : `Hace ${differenceInHours} horas`;
  }

  const differenceInDays = Math.floor(
    differenceInHours / 24
  );

  if (differenceInDays < 7) {
    return differenceInDays === 1
      ? "Hace 1 día"
      : `Hace ${differenceInDays} días`;
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}