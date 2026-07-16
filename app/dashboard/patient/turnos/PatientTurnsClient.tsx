"use client";

import { useState } from "react";
import { CalendarDays, Clock, MapPin, UserRound } from "lucide-react";

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

export default function PatientTurnsClient({
  appointments,
}: {
  appointments: Appointment[];
}) {
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");
  const statusLabels = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    COMPLETED: "Completado",
    CANCELED: "Cancelado",
  };

  const filteredAppointments = appointments.filter((appointment) => {
    if (filter === "ALL") return appointment.status !== "CANCELED";
    if (filter === "PENDING") return appointment.status === "PENDING";
    if (filter === "COMPLETED") return appointment.status === "COMPLETED";

    return true;
  });

  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif text-[#173b33]">
            Mis turnos
          </h1>

          <p className="mt-2 text-[#6c7b72]">
            Consultá tus próximos turnos reservados.
          </p>
        </div>

        <div className="mt-9 flex border border-[#d8d2c4] bg-white">
          {[
            { key: "ALL", label: "Todos" },
            { key: "PENDING", label: "Próximos" },
            { key: "COMPLETED", label: "Completados" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() =>
                setFilter(item.key as "ALL" | "PENDING" | "COMPLETED")
              }
              className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                filter === item.key
                  ? "bg-[#263F3B] text-white"
                  : "text-[#263F3B]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {filteredAppointments.length === 0 && (
          <div className="border border-[#d8d2c4] bg-white p-8 text-[#6c7b72]">
            No hay turnos para este filtro.
          </div>
        )}

        {filteredAppointments.map((appointment) => {
          const date = new Date(appointment.date);

          return (
            <div
              key={appointment.id}
              className="border border-[#d8d2c4] bg-white p-6"
            >
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    {statusLabels[appointment.status as keyof typeof statusLabels] ?? appointment.status}
                  </p>

                  <h2 className="mt-3 text-2xl font-semibold text-[#173b33]">
                    {appointment.notes || "Turno odontológico"}
                  </h2>
                </div>

                <p className="text-sm text-[#6c7b72]">
                  {date.toLocaleDateString("es-AR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="mt-3 grid gap-4 md:grid-cols-4">
                <div className="border border-[#d8d2c4] p-4">
                  <CalendarDays size={18} className="mb-2 text-[#A2B38B]" />
                  <p className="font-semibold text-[#173b33]">Fecha</p>
                  <p className="text-sm text-[#6c7b72]">
                    {date.toLocaleDateString("es-AR")}
                  </p>
                </div>

                <div className="border border-[#d8d2c4] p-4">
                  <Clock size={18} className="mb-2 text-[#A2B38B]" />
                  <p className="font-semibold text-[#173b33]">Horario</p>
                  <p className="text-sm text-[#6c7b72]">
                    {date.toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="border border-[#d8d2c4] p-4">
                  <UserRound size={18} className="mb-2 text-[#A2B38B]" />
                  <p className="font-semibold text-[#173b33]">Especialista</p>
                  <p className="text-sm text-[#6c7b72]">
                    {appointment.doctor.user.name}
                  </p>
                </div>

                <div className="border border-[#d8d2c4] p-4">
                  <MapPin size={18} className="mb-2 text-[#A2B38B]" />
                  <p className="font-semibold text-[#173b33]">Sucursal</p>
                  <p className="text-sm text-[#6c7b72]">
                    {appointment.branch.name} — {appointment.branch.address}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}