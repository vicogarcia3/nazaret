"use client";

import { useEffect, useState } from "react";

type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
};

type Doctor = {
  id: string;
  user: {
    name: string;
  };
};

type Appointment = {
  id: string;
  date: string;
  doctorId: string;
  branchId: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELED";
};

const horarios = [
  "09:00", "09:30",
  "10:00", "10:30",
  "11:00", "11:30",
  "12:00", "12:30",
  "13:00", "13:30",
  "14:00", "14:30",
  "15:00", "15:30",
  "16:00", "16:30",
  "17:00", "17:30",
  "18:00", "18:30",
  "19:00", "19:30",
];

export default function ReservarTurnoPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [form, setForm] = useState({
    branchId: "",
    doctorId: "",
    date: "",
    time: "",
    notes: "",
  });

  async function loadData() {
    const [branchesRes, doctorsRes, appointmentsRes] = await Promise.all([
      fetch("/api/branches"),
      fetch("/api/doctors"),
      fetch("/api/public-appointments"),
    ]);

    const branchesData = await branchesRes.json();
    const doctorsData = await doctorsRes.json();
    const appointmentsData = await appointmentsRes.json();

    setBranches(Array.isArray(branchesData) ? branchesData : []);
    setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
    setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
  }

  useEffect(() => {
    loadData();
  }, []);

  function isTimeAvailable(time: string) {
    if (!form.date || !form.branchId || !form.doctorId) return true;

    return !appointments.some((appointment) => {
      if (appointment.status === "CANCELED") return false;

      const appointmentDate = new Date(appointment.date);

      const sameDate =
        appointmentDate.toISOString().split("T")[0] === form.date;

      const sameTime =
        appointmentDate.toTimeString().slice(0, 5) === time;

      return (
        sameDate &&
        sameTime &&
        appointment.branchId === form.branchId &&
        appointment.doctorId === form.doctorId
      );
    });
  }

  const availableTimes = horarios.filter(isTimeAvailable);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.branchId || !form.doctorId || !form.date || !form.time) {
      alert("Completá sucursal, odontólogo, fecha y horario.");
      return;
    }

    const fullDate = new Date(`${form.date}T${form.time}`);

    const res = await fetch("/api/patient/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        branchId: form.branchId,
        doctorId: form.doctorId,
        date: fullDate.toISOString(),
        notes: form.notes,
      }),
    });

    if (!res.ok) {
      alert("No se pudo reservar el turno.");
      return;
    }

    alert("Turno reservado correctamente.");

    setForm({
      branchId: "",
      doctorId: "",
      date: "",
      time: "",
      notes: "",
    });

    loadData();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Reservar turno</h1>
        <p className="mt-2 text-gray-500">
          Seleccioná una sucursal, odontólogo, fecha y horario disponible.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl bg-white p-6 shadow space-y-4"
      >
        <select
          className="w-full rounded border p-3"
          value={form.branchId}
          onChange={(e) =>
            setForm({
              ...form,
              branchId: e.target.value,
              time: "",
            })
          }
          required
        >
          <option value="">Seleccionar sucursal</option>

          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} — {branch.address}, {branch.city}
            </option>
          ))}
        </select>

        <select
          className="w-full rounded border p-3"
          value={form.doctorId}
          onChange={(e) =>
            setForm({
              ...form,
              doctorId: e.target.value,
              time: "",
            })
          }
          required
        >
          <option value="">Seleccionar odontólogo</option>

          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.user.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="w-full rounded border p-3"
          value={form.date}
          onChange={(e) =>
            setForm({
              ...form,
              date: e.target.value,
              time: "",
            })
          }
          required
        />

        {form.branchId && form.doctorId && form.date && (
          <div>
            <p className="mb-3 font-medium">Horarios disponibles</p>

            <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
              {availableTimes.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setForm({ ...form, time })}
                  className={`rounded border px-4 py-2 ${
                    form.time === time
                      ? "bg-[#A2B38B] text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>

            {availableTimes.length === 0 && (
              <p className="mt-3 text-sm text-red-500">
                No hay horarios disponibles para esa fecha.
              </p>
            )}
          </div>
        )}

        <textarea
          className="w-full rounded border p-3"
          placeholder="Motivo o comentario opcional"
          value={form.notes}
          onChange={(e) =>
            setForm({
              ...form,
              notes: e.target.value,
            })
          }
        />

        <button className="rounded bg-[#A2B38B] px-5 py-3 text-white hover:bg-[#8FA178]">
          Reservar turno
        </button>
      </form>
    </div>
  );
}