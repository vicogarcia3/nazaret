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
  Loader2,
  Menu,
} from "lucide-react";
import { useRouter } from "next/navigation";

import DoctorSidebar from "./DoctorSidebar";

type DoctorDashboardShellProps = {
  children: ReactNode;
  doctorName: string;
  initials: string;
  doctorImage?: string | null;
  clinicName: string;
  logoUrl?: string | null;
};

type DoctorNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  actor: string;
  read: boolean;
  actionUrl: string | null;
  appointmentId: string | null;
  createdAt: string;
};

export default function DoctorDashboardShell({
  children,
  doctorName,
  initials,
  doctorImage,
  clinicName,
  logoUrl,
}: DoctorDashboardShellProps) {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  const [notifications, setNotifications] = useState<
    DoctorNotification[]
  >([]);

  const [
    loadingNotifications,
    setLoadingNotifications,
  ] = useState(true);

  const [
    markingAllAsRead,
    setMarkingAllAsRead,
  ] = useState(false);

  const notificationsRef =
    useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const recentNotifications =
    notifications.slice(0, 5);

  useEffect(() => {
    void loadNotifications();

    const interval = window.setInterval(() => {
      void loadNotifications(false);
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(
          event.target as Node
        )
      ) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  async function loadNotifications(
    showLoading = true
  ) {
    try {
      if (showLoading) {
        setLoadingNotifications(true);
      }

      const response = await fetch(
        "/api/doctor/notifications",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudieron obtener las notificaciones."
        );
      }

      setNotifications(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Error al cargar notificaciones:",
        error
      );
    } finally {
      if (showLoading) {
        setLoadingNotifications(false);
      }
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
        `/api/doctor/notifications/${notificationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            read: true,
          }),
        }
      );

      if (!response.ok) {
        const data = await response
          .json()
          .catch(() => null);

        throw new Error(
          data?.error ||
            "No se pudo marcar la notificación como leída."
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
    } catch (error) {
      console.error(
        "Error al marcar la notificación:",
        error
      );
    }
  }

  async function handleNotificationClick(
    notification: DoctorNotification
  ) {
    if (!notification.read) {
      await markNotificationAsRead(
        notification.id
      );
    }

    setNotificationsOpen(false);

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  }

  async function markAllAsRead() {
    const unreadNotifications =
      notifications.filter(
        (notification) => !notification.read
      );

    if (
      unreadNotifications.length === 0 ||
      markingAllAsRead
    ) {
      return;
    }

    try {
      setMarkingAllAsRead(true);

      const results = await Promise.all(
        unreadNotifications.map(
          async (notification) => {
            const response = await fetch(
              `/api/doctor/notifications/${notification.id}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  read: true,
                }),
              }
            );

            return response.ok;
          }
        )
      );

      if (results.some((result) => !result)) {
        throw new Error(
          "No se pudieron marcar todas las notificaciones."
        );
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
    } catch (error) {
      console.error(
        "Error al marcar todas como leídas:",
        error
      );

      await loadNotifications(false);
    } finally {
      setMarkingAllAsRead(false);
    }
  }

  function goToAllNotifications() {
    setNotificationsOpen(false);

    router.push(
      "/dashboard/doctor/notificaciones"
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <DoctorSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        clinicName={clinicName}
        logoUrl={logoUrl}
      />

      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/25 md:hidden"
        />
      ) : null}

      <div
        className={`min-h-screen transition-[margin] duration-300 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-0"
        }`}
      >
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#DED9CD] bg-[#FFFCF7]/95 px-5 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() =>
                setSidebarOpen(
                  (current) => !current
                )
              }
              aria-label={
                sidebarOpen
                  ? "Cerrar menú"
                  : "Abrir menú"
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
                    ) : recentNotifications.length ===
                      0 ? (
                      <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF1EA] text-[#6F855F]">
                          <Bell className="h-5 w-5" />
                        </div>

                        <p className="mt-3 text-sm font-semibold text-[#263F3B]">
                          No tenés notificaciones
                        </p>

                        <p className="mt-1 text-xs leading-5 text-[#71807B]">
                          Acá aparecerán las nuevas
                          solicitudes de turno y
                          novedades de tus pacientes.
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
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E7ECE2] text-[#6F855F]">
                              <CalendarDays className="h-[18px] w-[18px]" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-semibold text-[#263F3B]">
                                  {
                                    notification.title
                                  }
                                </p>

                                {!notification.read ? (
                                  <span
                                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#6F855F]"
                                    aria-label="Sin leer"
                                  />
                                ) : null}
                              </div>

                              <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs leading-5 text-[#66736F]">
                                {
                                  notification.message
                                }
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

            {doctorImage ? (
              <img
                src={doctorImage}
                alt={doctorName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6F855F] text-sm font-semibold text-white">
                {initials || "DR"}
              </div>
            )}

            <span className="hidden max-w-48 truncate text-sm font-medium md:block">
              {doctorName}
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