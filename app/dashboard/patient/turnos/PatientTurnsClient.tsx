"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

type Appointment = {
  id: string;
  date: Date | string;
  notes: string | null;
  status: string;
  doctor: {
    user: {
      name: string | null;
    };
  };
  branch: {
    name: string;
    address: string;
  };
};

type Filter = "ALL" | "PENDING" | "COMPLETED";

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Completado",
  CANCELED: "Cancelado",
};

const MINIMUM_NOTICE_HOURS = 24;

export default function PatientTurnsClient({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const router = useRouter();

  const [turns, setTurns] = useState<Appointment[]>(appointments);
  const [filter, setFilter] = useState<Filter>("ALL");

  const [appointmentToCancel, setAppointmentToCancel] =
    useState<Appointment | null>(null);

  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const filteredAppointments = useMemo(() => {
    return turns.filter((appointment) => {
      if (appointment.status === "CANCELED") {
        return false;
      }

      if (filter === "ALL") {
        return true;
      }

      if (filter === "PENDING") {
        return (
          appointment.status === "PENDING" ||
          appointment.status === "CONFIRMED"
        );
      }

      return appointment.status === "COMPLETED";
    });
  }, [filter, turns]);

  function canModifyAppointment(dateValue: Date | string) {
    const appointmentDate = new Date(dateValue);

    const modificationLimit = new Date(
      Date.now() + MINIMUM_NOTICE_HOURS * 60 * 60 * 1000
    );

    return appointmentDate > modificationLimit;
  }

  function isFutureAppointment(dateValue: Date | string) {
    return new Date(dateValue) > new Date();
  }

  async function handleCancelAppointment() {
    if (!appointmentToCancel) return;

    setCancelingId(appointmentToCancel.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `/api/appointments/${appointmentToCancel.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.error || "No se pudo cancelar el turno."
        );
        return;
      }

      setTurns((currentTurns) =>
        currentTurns.map((appointment) =>
          appointment.id === appointmentToCancel.id
            ? {
                ...appointment,
                status: "CANCELED",
              }
            : appointment
        )
      );

      setSuccessMessage("El turno fue cancelado correctamente.");
      setAppointmentToCancel(null);

      router.refresh();
    } catch {
      setErrorMessage(
        "Ocurrió un problema al cancelar el turno. Intentá nuevamente."
      );
    } finally {
      setCancelingId(null);
    }
  }

  function handleReschedule(appointment: Appointment) {
    const params = new URLSearchParams({
      reprogramar: appointment.id,
    });

    router.push(
      `/dashboard/patient/reservar?${params.toString()}`
    );
  }

  return (
    <>
      <div>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="font-serif text-4xl text-[#263F3B]">
              Mis turnos
            </h1>

            <p className="mt-2 text-[#6B7774]">
              Consultá, reprogramá o cancelá tus turnos.
            </p>
          </div>

          <div className="flex w-fit border border-[#D8D2C4] bg-white">
            {[
              { key: "ALL", label: "Todos" },
              { key: "PENDING", label: "Próximos" },
              { key: "COMPLETED", label: "Completados" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key as Filter)}
                className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                  filter === item.key
                    ? "bg-[#6F855F] text-white"
                    : "text-[#263F3B] hover:bg-[#F0EDE6]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {successMessage && (
          <div className="mt-6 border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 flex items-start gap-3 border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mt-8 space-y-5">
          {filteredAppointments.length === 0 && (
            <div className="border border-[#D8D2C4] bg-white p-8 text-[#6B7774]">
              No hay turnos para este filtro.
            </div>
          )}

          {filteredAppointments.map((appointment) => {
            const date = new Date(appointment.date);

            const future = isFutureAppointment(appointment.date);
            const canModify =
              future &&
              canModifyAppointment(appointment.date) &&
              appointment.status !== "COMPLETED";

            return (
              <article
                key={appointment.id}
                className="border border-[#D8D2C4] bg-white p-6"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7B916A]">
                      {statusLabels[appointment.status] ??
                        appointment.status}
                    </p>

                    <h2 className="mt-3 text-2xl font-semibold text-[#263F3B]">
                      {appointment.notes || "Turno odontológico"}
                    </h2>
                  </div>

                  <p className="text-sm capitalize text-[#6B7774]">
                    {date.toLocaleDateString("es-AR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <TurnInformation
                    icon={<CalendarDays />}
                    title="Fecha"
                    value={date.toLocaleDateString("es-AR")}
                  />

                  <TurnInformation
                    icon={<Clock />}
                    title="Horario"
                    value={`${date.toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} h`}
                  />

                  <TurnInformation
                    icon={<UserRound />}
                    title="Especialista"
                    value={
                      appointment.doctor.user.name ||
                      "Profesional"
                    }
                  />

                  <TurnInformation
                    icon={<MapPin />}
                    title="Sucursal"
                    value={`${appointment.branch.name} — ${appointment.branch.address}`}
                  />
                </div>

                {future && appointment.status !== "COMPLETED" && (
                  <div className="mt-6 border-t border-[#E5E1D8] pt-5">
                    {canModify ? (
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() =>
                            handleReschedule(appointment)
                          }
                          className="flex items-center justify-center gap-2 border border-[#A2B38B] px-5 py-3 text-sm font-semibold text-[#5F7450] transition hover:bg-[#F0F2EA]"
                        >
                          <Pencil className="h-4 w-4" />
                          Reprogramar turno
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setErrorMessage("");
                            setSuccessMessage("");
                            setAppointmentToCancel(appointment);
                          }}
                          className="flex items-center justify-center gap-2 border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Cancelar turno
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 bg-[#F7F5EF] p-4 text-sm leading-6 text-[#6B7774]">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#7B916A]" />

                        <p>
                          Este turno ya no puede cancelarse ni
                          reprogramarse desde el portal porque faltan
                          menos de 24 horas. Comunicate con el
                          consultorio.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>

      {appointmentToCancel && (
        <CancelAppointmentModal
          appointment={appointmentToCancel}
          loading={cancelingId === appointmentToCancel.id}
          onClose={() => {
            if (!cancelingId) {
              setAppointmentToCancel(null);
            }
          }}
          onConfirm={handleCancelAppointment}
        />
      )}
    </>
  );
}

function TurnInformation({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="border border-[#D8D2C4] p-4">
      <div className="mb-2 text-[#7B916A] [&>svg]:h-[18px] [&>svg]:w-[18px]">
        {icon}
      </div>

      <p className="font-semibold text-[#263F3B]">{title}</p>

      <p className="mt-1 text-sm leading-5 text-[#6B7774]">
        {value}
      </p>
    </div>
  );
}

function CancelAppointmentModal({
  appointment,
  loading,
  onClose,
  onConfirm,
}: {
  appointment: Appointment;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const date = new Date(appointment.date);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-lg border border-[#DED9CD] bg-[#FFFCF7] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#DED9CD] px-6 py-5">
          <h2 className="text-xl font-semibold text-[#263F3B]">
            Cancelar turno
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center text-[#6B7774] transition hover:bg-[#F0EDE6] disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Trash2 className="h-5 w-5" />
          </div>

          <h3 className="mt-5 text-lg font-semibold text-[#263F3B]">
            ¿Querés cancelar este turno?
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#6B7774]">
            El turno quedará cancelado y el horario volverá a estar
            disponible para otros pacientes.
          </p>

          <div className="mt-5 space-y-2 border border-[#E1DED5] bg-white p-4 text-sm">
            <p>
              <span className="font-semibold text-[#263F3B]">
                Fecha:
              </span>{" "}
              <span className="capitalize text-[#6B7774]">
                {date.toLocaleDateString("es-AR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </p>

            <p>
              <span className="font-semibold text-[#263F3B]">
                Horario:
              </span>{" "}
              <span className="text-[#6B7774]">
                {date.toLocaleTimeString("es-AR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                h
              </span>
            </p>

            <p>
              <span className="font-semibold text-[#263F3B]">
                Profesional:
              </span>{" "}
              <span className="text-[#6B7774]">
                {appointment.doctor.user.name || "Profesional"}
              </span>
            </p>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="border border-[#A2B38B] px-5 py-3 text-sm font-semibold text-[#263F3B] transition hover:bg-[#F0EDE6] disabled:opacity-50"
            >
              Volver
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Cancelando..." : "Sí, cancelar turno"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}