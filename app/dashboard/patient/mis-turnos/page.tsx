"use client";

import { useEffect, useState } from "react";

type Appointment = {
  id: string;
  date: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELED";
  notes: string | null;
  doctor: {
    user: {
      name: string;
    };
  };
  branch: {
    name: string;
    address: string;
    city: string;
  };
};

export default function MisTurnosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    fetch("/api/patient/my-appointments")
      .then((res) => res.json())
      .then((data) => {
        setAppointments(Array.isArray(data) ? data : []);
      });
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Mis turnos</h1>

      <div className="grid gap-4">
        {appointments.map((appointment) => (
          <div key={appointment.id} className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              {new Date(appointment.date).toLocaleDateString("es-AR")} -{" "}
              {new Date(appointment.date).toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </h2>

            <p className="mt-2">
              Odontólogo: {appointment.doctor.user.name}
            </p>

            <p>
              Sucursal: {appointment.branch.name} — {appointment.branch.address},{" "}
              {appointment.branch.city}
            </p>

            <p className="mt-2">
              Estado:{" "}
              <span className="font-medium">
                {appointment.status === "PENDING"
                  ? "Pendiente"
                  : appointment.status === "CONFIRMED"
                  ? "Confirmado"
                  : appointment.status === "COMPLETED"
                  ? "Completado"
                  : "Cancelado"}
              </span>
            </p>

            {appointment.notes && (
              <p className="mt-2 text-gray-500">Nota: {appointment.notes}</p>
            )}
          </div>
        ))}

        {appointments.length === 0 && (
          <p className="text-gray-500">Todavía no tenés turnos registrados.</p>
        )}
      </div>
    </div>
  );
}