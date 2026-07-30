"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  CircleAlert,
} from "lucide-react";

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

function formatCreatedAt(dateValue: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateValue));
}

export default function DoctorNotificationsPage() {
  const [notifications, setNotifications] = useState<
    DoctorNotification[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<
    string | null
  >(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function loadNotifications() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(
        "/api/doctor/notifications",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudieron cargar las notificaciones."
        );
      }

      setNotifications(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las notificaciones."
      );

      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) => !notification.read
      ).length,
    [notifications]
  );

  async function markAsRead(id: string) {
    try {
      setUpdatingId(id);

      const response = await fetch(
        `/api/doctor/notifications/${id}`,
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

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.error ||
            "No se pudo actualizar la notificación."
        );
        return;
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                read: true,
              }
            : notification
        )
      );
    } catch (error) {
      console.error(
        "Error al marcar la notificación:",
        error
      );

      alert(
        "No se pudo actualizar la notificación."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#7B916A]">
          Portal especialista
        </p>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl font-medium text-[#173B33] md:text-5xl">
              Notificaciones
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#6C7B72]">
              Consultá las solicitudes de turno y
              novedades relacionadas con tus pacientes.
            </p>
          </div>

          <div className="border border-[#D7DFC9] bg-[#F0F4E9] px-4 py-3 text-sm text-[#536847]">
            <strong>{unreadCount}</strong>{" "}
            {unreadCount === 1
              ? "notificación sin leer"
              : "notificaciones sin leer"}
          </div>
        </div>
      </header>

      {errorMessage && (
        <div className="flex items-start gap-3 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          {errorMessage}
        </div>
      )}

      {loading && (
        <div className="border border-[#D8D2C4] bg-white p-8 text-sm text-[#6C7B72]">
          Cargando notificaciones...
        </div>
      )}

      {!loading &&
        !errorMessage &&
        notifications.length === 0 && (
          <div className="border border-[#D8D2C4] bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[#D7DFC9] bg-[#F0F4E9]">
              <Bell className="h-6 w-6 text-[#6F855F]" />
            </div>

            <h2 className="mt-5 font-serif text-3xl text-[#173B33]">
              No hay notificaciones
            </h2>

            <p className="mt-2 text-sm text-[#6C7B72]">
              Las nuevas solicitudes de turno
              aparecerán en esta sección.
            </p>
          </div>
        )}

      {!loading &&
        notifications.length > 0 && (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`border bg-white ${
                  notification.read
                    ? "border-[#D8D2C4]"
                    : "border-[#A2B38B]"
                }`}
              >
                <div className="flex flex-col gap-5 px-6 py-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center ${
                        notification.read
                          ? "bg-[#F7F5EF] text-[#6C7B72]"
                          : "bg-[#F0F4E9] text-[#6F855F]"
                      }`}
                    >
                      <CalendarDays className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-serif text-2xl text-[#173B33]">
                          {notification.title}
                        </h2>

                        {!notification.read && (
                          <span className="border border-[#A2B38B] bg-[#F2F5EF] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#56705F]">
                            Nueva
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-[#6C7B72]">
                        {formatCreatedAt(
                          notification.createdAt
                        )}
                      </p>
                    </div>
                  </div>

                  {!notification.read && (
                    <button
                      type="button"
                      disabled={
                        updatingId === notification.id
                      }
                      onClick={() =>
                        markAsRead(notification.id)
                      }
                      className="inline-flex w-fit items-center gap-2 border border-[#D8D2C4] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#173B33] transition hover:bg-[#F7F5EF] disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />

                      {updatingId === notification.id
                        ? "Guardando..."
                        : "Marcar como leída"}
                    </button>
                  )}
                </div>

                <div className="border-t border-[#E7E2D8] bg-[#FCFBF8] px-6 py-5">
                  <p className="whitespace-pre-line text-sm leading-7 text-[#263F3B]">
                    {notification.message}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
    </div>
  );
}