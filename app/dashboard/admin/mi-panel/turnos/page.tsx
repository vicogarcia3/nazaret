"use client";

import { useEffect, useMemo, useState } from "react";

type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
};

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  branchId: string;
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
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELED";
  notes: string | null;
  patient: Patient;
  doctor: Doctor;
  branch: Branch;
};

export default function TurnosPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [currentDate, setCurrentDate] = useState(new Date());

  const [rescheduleAppointment, setRescheduleAppointment] =
  useState<Appointment | null>(null);

  const [rescheduleForm, setRescheduleForm] = useState({
    date: "",
    time: "",
  });

  const [form, setForm] = useState({
    patientId: "",
    doctorId: "",
    date: "",
    time: "",
    notes: "",
  });

  async function loadData() {
    const [branchesRes, patientsRes, doctorsRes, appointmentsRes] =
      await Promise.all([
        fetch("/api/branches"),
        fetch("/api/patients"),
        fetch("/api/doctors"),
        fetch("/api/appointments"),
      ]);

    const branchesData = await branchesRes.json();

    setBranches(branchesData);
    setPatients(await patientsRes.json());
    setDoctors(await doctorsRes.json());
    setAppointments(await appointmentsRes.json());

    if (branchesData.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branchesData[0].id);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedBranch = branches.find(
    (branch) => branch.id === selectedBranchId
  );

  const patientsFromSelectedBranch = patients.filter(
    (patient) => patient.branchId === selectedBranchId
  );

  const appointmentsFromSelectedBranch = appointments.filter(
    (appointment) => appointment.branch.id === selectedBranchId
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];

    const startWeekDay = firstDay.getDay();

    for (let i = 0; i < startWeekDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [year, month]);

  function getAppointmentsForDay(day: Date) {
    return appointmentsFromSelectedBranch.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);

      return (
        appointmentDate.getFullYear() === day.getFullYear() &&
        appointmentDate.getMonth() === day.getMonth() &&
        appointmentDate.getDate() === day.getDate()
      );
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedBranchId) {
      alert("Seleccioná una sucursal.");
      return;
    }

    const fullDate = new Date(`${form.date}T${form.time}`);

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patientId: form.patientId,
        doctorId: form.doctorId,
        branchId: selectedBranchId,
        date: fullDate,
        notes: form.notes,
        status: "CONFIRMED",
      }),
    });

    if (!res.ok) {
      alert("No se pudo crear el turno.");
      return;
    }

    setForm({
      patientId: "",
      doctorId: "",
      date: "",
      time: "",
      notes: "",
    });

    loadData();
  }

  async function updateStatus(
    appointmentId: string,
    status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELED"
  ) {
    await fetch(`/api/appointments/${appointmentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    loadData();
  }

  function openRescheduleModal(appointment: Appointment) {
    const appointmentDate = new Date(appointment.date);

    setRescheduleAppointment(appointment);
    setRescheduleForm({
      date: appointmentDate.toISOString().split("T")[0],
      time: appointmentDate.toTimeString().slice(0, 5),
    });
  }

  async function saveReschedule(e: React.FormEvent) {
    e.preventDefault();

    if (!rescheduleAppointment) return;

    const newDate = new Date(
      `${rescheduleForm.date}T${rescheduleForm.time}`
    );

    const res = await fetch(`/api/appointments/${rescheduleAppointment.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: newDate.toISOString(),
      }),
    });

    if (!res.ok) {
      alert("No se pudo reprogramar el turno.");
      return;
    }

    setRescheduleAppointment(null);
    setRescheduleForm({
      date: "",
      time: "",
    });

    await loadData();
  }

  function previousMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
  setCurrentDate(new Date(year, month + 1, 1));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Mis turnos</h1>
        <p className="mt-2 text-gray-500">
          Calendario mensual por sucursal.
        </p>
      </div>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <label className="mb-2 block font-medium">
          Seleccionar sucursal
        </label>

        <select
          className="w-full rounded border p-3"
          value={selectedBranchId}
          onChange={(e) => {
            setSelectedBranchId(e.target.value);
            setForm({
              patientId: "",
              doctorId: "",
              date: "",
              time: "",
              notes: "",
            });
          }}
        >
          <option value="">Seleccionar sucursal</option>

          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} — {branch.address}, {branch.city}
            </option>
          ))}
        </select>
      </section>

      {selectedBranch && (
        <>
          <form
            onSubmit={handleSubmit}
            className="rounded-xl bg-white p-6 shadow space-y-4"
          >
            <h2 className="text-2xl font-bold">
              Agendar turno en {selectedBranch.name}
            </h2>

            <p className="text-gray-500">
              {selectedBranch.address}, {selectedBranch.city}
            </p>

            <select
              className="w-full rounded border p-3"
              value={form.patientId}
              onChange={(e) =>
                setForm({ ...form, patientId: e.target.value })
              }
              required
            >
              <option value="">Seleccionar paciente</option>

              {patientsFromSelectedBranch.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.lastName}, {patient.firstName}
                </option>
              ))}
            </select>

            <select
              className="w-full rounded border p-3"
              value={form.doctorId}
              onChange={(e) =>
                setForm({ ...form, doctorId: e.target.value })
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

            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="date"
                className="w-full rounded border p-3"
                value={form.date}
                onChange={(e) =>
                  setForm({ ...form, date: e.target.value })
                }
                required
              />

              <input
                type="time"
                className="w-full rounded border p-3"
                value={form.time}
                onChange={(e) =>
                  setForm({ ...form, time: e.target.value })
                }
                required
              />
            </div>

            <textarea
              className="w-full rounded border p-3"
              placeholder="Notas opcionales"
              value={form.notes}
              onChange={(e) =>
                setForm({ ...form, notes: e.target.value })
              }
            />

            <button className="rounded bg-[#A2B38B] px-5 py-3 text-white hover:bg-[#8FA178]">
              Crear turno
            </button>
          </form>

          <section className="rounded-xl bg-white p-6 shadow">
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={previousMonth}
                className="rounded bg-gray-100 px-4 py-2"
              >
                ← Anterior
              </button>

              <div className="text-center">
                <h2 className="text-2xl font-bold capitalize">
                  {monthName}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedBranch.name} — {selectedBranch.address}
                </p>
              </div>

              <button
                onClick={nextMonth}
                className="rounded bg-gray-100 px-4 py-2"
              >
                Siguiente →
              </button>
            </div>

            <div className="grid grid-cols-7 border-t border-l text-sm">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                <div
                  key={day}
                  className="border-r border-b bg-gray-50 p-3 text-center font-semibold"
                >
                  {day}
                </div>
              ))}

              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className="min-h-36 border-r border-b p-2"
                >
                  {day && (
                    <>
                      <p className="mb-2 font-semibold">
                        {day.getDate()}
                      </p>

                      <div className="space-y-2">
                        {getAppointmentsForDay(day).map((appointment) => (
                          <div
                            key={appointment.id}
                            className="rounded-lg border bg-slate-50 p-2 text-xs"
                          >
                            <p className="font-semibold">
                              {new Date(appointment.date).toLocaleTimeString(
                                "es-AR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>

                            <p>
                              {appointment.patient.lastName},{" "}
                              {appointment.patient.firstName}
                            </p>

                            <p className="text-gray-500">
                              {appointment.doctor.user.name}
                            </p>

                            <p
                              className={
                                appointment.status === "COMPLETED"
                                  ? "text-green-600"
                                  : appointment.status === "CANCELED"
                                  ? "text-red-600"
                                  : "text-yellow-600"
                              }
                            >
                              {appointment.status === "COMPLETED"
                                ? "Completado"
                                : appointment.status === "CANCELED"
                                ? "Cancelado"
                                : appointment.status === "CONFIRMED"
                                ? "Confirmado"
                                : "Pendiente"}
                            </p>

                            {appointment.status !== "COMPLETED" &&
                              appointment.status !== "CANCELED" && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  <button
                                    onClick={() =>
                                      updateStatus(
                                        appointment.id,
                                        "COMPLETED"
                                      )
                                    }
                                    className="rounded bg-[#A2B38B] px-2 py-1 text-white"
                                  >
                                    Completar
                                  </button>

                                  <button
                                    onClick={() => openRescheduleModal(appointment)}
                                    className="rounded bg-gray-300 px-2 py-1"
                                  >
                                    Reprogramar
                                  </button>

                                  <button
                                    onClick={() =>
                                      updateStatus(
                                        appointment.id,
                                        "CANCELED"
                                      )
                                    }
                                    className="rounded bg-[#D97A7A] px-2 py-1 text-white"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      {rescheduleAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form
            onSubmit={saveReschedule}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4"
          >
            <h2 className="text-2xl font-bold">Reprogramar turno</h2>

            <p className="text-gray-500">
              {rescheduleAppointment.patient.lastName},{" "}
              {rescheduleAppointment.patient.firstName}
            </p>

            <input
              type="date"
              className="w-full rounded border p-3"
              value={rescheduleForm.date}
              onChange={(e) =>
                setRescheduleForm({
                ...rescheduleForm,
                date: e.target.value,
              })
            }
            required
          />

          <input
            type="time"
            className="w-full rounded border p-3"
            value={rescheduleForm.time}
            onChange={(e) =>
              setRescheduleForm({
                ...rescheduleForm,
                time: e.target.value,
              })
            }
            required
          />

          <div className="flex gap-3">
            <button className="rounded bg-[#A2B38B] px-5 py-3 text-white hover:bg-[#8FA178]">
              Guardar
            </button>

            <button
              type="button"
              onClick={() => setRescheduleAppointment(null)}
              className="rounded bg-gray-300 px-5 py-3 text-black"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    )}
    </div>
  );
}