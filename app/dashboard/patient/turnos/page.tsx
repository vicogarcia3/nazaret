"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  Stethoscope,
  XCircle,
} from "lucide-react";

type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELED";

type Appointment = {
  id: string;
  date: string;
  status: AppointmentStatus;
  notes: string | null;
  doctor: {
    name: string | null;
    user: {
      name: string;
    } | null;
  };
  branch: {
    name: string;
    address: string;
    city: string;
  };
};

const STATUS_CONFIG: Record<
  AppointmentStatus,
  {
    label: string;
    className: string;
    icon: typeof Clock3;
  }
> = {
  PENDING: {
    label: "Pendiente",
    className:
      "border-[#E3C98A] bg-[#FFF8E8] text-[#927025]",
    icon: Clock3,
  },
  CONFIRMED: {
    label: "Confirmado",
    className:
      "border-[#A2B38B] bg-[#F2F5EF] text-[#56705F]",
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: "Completado",
    className:
      "border-[#B9C8C5] bg-[#F1F5F4] text-[#49655F]",
    icon: CheckCircle2,
  },
  CANCELED: {
    label: "Cancelado",
    className:
      "border-[#E1CACA] bg-[#FAF3F3] text-[#A06666]",
    icon: XCircle,
  },
};

function formatAppointmentDate(dateValue: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateValue));
}

function formatAppointmentTime(dateValue: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateValue));
}

function isFutureAppointment(appointment: Appointment) {
  return (
    new Date(appointment.date).getTime() >= Date.now() &&
    appointment.status !== "CANCELED" &&
    appointment.status !== "COMPLETED"
  );
}

export default function MisTurnosPage() {
  const [appointments, setAppointments] = useState<
    Appointment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadAppointments() {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetch(
          "/api/patient/my-appointments",
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "No se pudieron cargar tus turnos."
          );
        }

        setAppointments(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "Error al cargar los turnos:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar tus turnos."
        );

        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
  }, []);

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter(isFutureAppointment)
      .sort(
        (first, second) =>
          new Date(first.date).getTime() -
          new Date(second.date).getTime()
      );
  }, [appointments]);

  const previousAppointments = useMemo(() => {
    return appointments
      .filter(
        (appointment) =>
          !isFutureAppointment(appointment)
      )
      .sort(
        (first, second) =>
          new Date(second.date).getTime() -
          new Date(first.date).getTime()
      );
  }, [appointments]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#7B916A]">
          Agenda personal
        </p>

        <h1 className="mt-2 font-serif text-4xl font-medium text-[#173B33] md:text-5xl">
          Mis turnos
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6C7B72]">
          Consultá tus próximos turnos y revisá el
          historial de atenciones anteriores.
        </p>
      </header>

      {errorMessage && (
        <div className="flex items-start gap-3 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <span>{errorMessage}</span>
        </div>
      )}

      {loading && (
        <div className="border border-[#D8D2C4] bg-white p-8 text-sm text-[#6C7B72]">
          Cargando tus turnos...
        </div>
      )}

      {!loading &&
        !errorMessage &&
        appointments.length === 0 && (
          <div className="border border-[#D8D2C4] bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[#D7DFC9] bg-[#F0F4E9]">
              <CalendarDays className="h-6 w-6 text-[#6F855F]" />
            </div>

            <h2 className="mt-5 font-serif text-3xl text-[#173B33]">
              Todavía no tenés turnos
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6C7B72]">
              Cuando reserves una atención, vas a
              poder consultar aquí su fecha,
              especialista, sucursal y estado.
            </p>
          </div>
        )}

      {!loading &&
        !errorMessage &&
        appointments.length > 0 && (
          <>
            <section>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-serif text-3xl text-[#173B33]">
                    Próximos turnos
                  </h2>

                  <p className="mt-1 text-sm text-[#6C7B72]">
                    Tus próximas atenciones
                    programadas.
                  </p>
                </div>

                <span className="border border-[#D7DFC9] bg-[#F0F4E9] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#536847]">
                  {upcomingAppointments.length}{" "}
                  {upcomingAppointments.length === 1
                    ? "turno"
                    : "turnos"}
                </span>
              </div>

              {upcomingAppointments.length === 0 ? (
                <div className="border border-[#D8D2C4] bg-white px-6 py-8 text-sm text-[#6C7B72]">
                  No tenés próximos turnos
                  programados.
                </div>
              ) : (
                <div className="grid gap-5">
                  {upcomingAppointments.map(
                    (appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        highlighted
                      />
                    )
                  )}
                </div>
              )}
            </section>

            <section className="border-t border-[#D8D2C4] pt-8">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-serif text-3xl text-[#173B33]">
                    Historial
                  </h2>

                  <p className="mt-1 text-sm text-[#6C7B72]">
                    Turnos completados, cancelados o
                    anteriores.
                  </p>
                </div>

                <span className="border border-[#D8D2C4] bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6C7B72]">
                  {previousAppointments.length}{" "}
                  {previousAppointments.length === 1
                    ? "registro"
                    : "registros"}
                </span>
              </div>

              {previousAppointments.length === 0 ? (
                <div className="border border-[#D8D2C4] bg-white px-6 py-8 text-sm text-[#6C7B72]">
                  Todavía no hay turnos anteriores.
                </div>
              ) : (
                <div className="grid gap-5">
                  {previousAppointments.map(
                    (appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                      />
                    )
                  )}
                </div>
              )}
            </section>
          </>
        )}
    </div>
  );
}

function AppointmentCard({
  appointment,
  highlighted = false,
}: {
  appointment: Appointment;
  highlighted?: boolean;
}) {
  const status = STATUS_CONFIG[appointment.status];
  const StatusIcon = status.icon;

  return (
    <article
      className={`border bg-white ${
        highlighted
          ? "border-[#A2B38B]"
          : "border-[#D8D2C4]"
      }`}
    >
      <div className="flex flex-col gap-5 border-b border-[#E7E2D8] px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center ${
              highlighted
                ? "bg-[#F0F4E9] text-[#6F855F]"
                : "bg-[#F7F5EF] text-[#6C7B72]"
            }`}
          >
            <CalendarDays className="h-5 w-5" />
          </div>

          <div>
            <p className="font-serif text-2xl capitalize text-[#173B33]">
              {formatAppointmentDate(
                appointment.date
              )}
            </p>

            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#536847]">
              <Clock3 className="h-4 w-4" />

              {formatAppointmentTime(
                appointment.date
              )}{" "}
              hs
            </div>
          </div>
        </div>

        <div
          className={`inline-flex w-fit items-center gap-2 border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] ${status.className}`}
        >
          <StatusIcon className="h-4 w-4" />
          {status.label}
        </div>
      </div>

      <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
        <InfoItem
          icon={<Stethoscope className="h-5 w-5" />}
          label="Especialista"
          value={
            appointment.doctor.name ||
            appointment.doctor.user?.name ||
            "Especialista"
          }
        />

        <InfoItem
          icon={<MapPin className="h-5 w-5" />}
          label="Sucursal"
          value={`${appointment.branch.name} · ${appointment.branch.address}, ${appointment.branch.city}`}
        />
      </div>

      {appointment.notes && (
        <div className="border-t border-[#E7E2D8] bg-[#FCFBF8] px-6 py-5">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#7B916A]" />

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7B916A]">
                Tratamiento o nota
              </p>

              <p className="mt-2 text-sm leading-6 text-[#263F3B]">
                {appointment.notes}
              </p>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-[#7B916A]">
        {icon}
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7B916A]">
          {label}
        </p>

        <p className="mt-2 text-sm leading-6 text-[#263F3B]">
          {value}
        </p>
      </div>
    </div>
  );
}