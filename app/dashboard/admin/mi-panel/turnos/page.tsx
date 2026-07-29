"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MoreVertical, Check, X, Clock, Trash2, ChevronLeft, ChevronRight, } from "lucide-react";
import NewGeneralAppointmentForm from "./NewGeneralAppointmentForm";

type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
};

type Appointment = {
  id: string;
  date: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELED";
  reminderSent: boolean;
  notes?: string | null;
  patient: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  doctor: {
    user: {
      name: string;
    };
  };
  branch: Branch;
};

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  dni: string | null;
  branchId: string;
};

type Doctor = {
  id: string;
  user: {
    name: string | null;
  };
  branches: {
    branchId: string;
  }[];
};

export default function TurnosPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"mes" | "semana" | "dia">("mes");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  async function loadData() {
    try {
      const [branchesRes, appointmentsRes, patientsRes, doctorsRes] =
        await Promise.all([
          fetch("/api/branches"),
          fetch("/api/appointments"),
          fetch("/api/patients"),
          fetch("/api/doctors"),
        ]);

      const branchesData = await branchesRes.json();
      const appointmentsData = await appointmentsRes.json();
      console.log("TURNOS:", appointmentsData);
      const patientsData = await patientsRes.json();
      const doctorsData = await doctorsRes.json();

      setBranches(Array.isArray(branchesData) ? branchesData : []);
      setAppointments(Array.isArray(appointmentsData) ? appointmentsData : []);
      setPatients(Array.isArray(patientsData) ? patientsData : []);
      setDoctors(Array.isArray(doctorsData) ? doctorsData : []);

      if (
        Array.isArray(branchesData) &&
        branchesData.length > 0 &&
        !selectedBranchId
      ) {
        setSelectedBranchId(branchesData[0].id);
      }
    } catch (error) {
      console.error("ERROR CARGANDO DATOS", error);
      setBranches([]);
      setAppointments([]);
      setPatients([]);
      setDoctors([]);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId);

  const filteredAppointments = Array.isArray(appointments)
    ? appointments.filter(
        (appointment) => appointment.branch?.id === selectedBranchId
      )
    : [];

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
    const startOffset = startWeekDay === 0 ? 6 : startWeekDay - 1;

    for (let i = 0; i < startOffset; i++) days.push(null);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [year, month]);

  const weekStart = new Date(currentDate);
  const weekDay = weekStart.getDay();
  const weekOffset = weekDay === 0 ? -6 : 1 - weekDay;
  weekStart.setDate(currentDate.getDate() + weekOffset);
  weekStart.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  function previousPeriod() {
    if (view === "mes") {
      setCurrentDate(
        (current) =>
          new Date(
            current.getFullYear(),
            current.getMonth() - 1,
            1
          )
      );
      return;
    }

    if (view === "semana") {
      setCurrentDate(
        (current) =>
          new Date(
            current.getFullYear(),
            current.getMonth(),
            current.getDate() - 7
          )
      );
      return;
    }

    setCurrentDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth(),
          current.getDate() - 1
        )
    );
  }

  function nextPeriod() {
    if (view === "mes") {
      setCurrentDate(
        (current) =>
          new Date(
            current.getFullYear(),
            current.getMonth() + 1,
            1
          )
      );
      return;
    }

    if (view === "semana") {
      setCurrentDate(
        (current) =>
          new Date(
            current.getFullYear(),
            current.getMonth(),
            current.getDate() + 7
          )
      );
      return;
    }

    setCurrentDate(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth(),
          current.getDate() + 1
        )
    );
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  function getAppointmentsForDay(day: Date) {
    return filteredAppointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date);

      return (
        appointmentDate.getFullYear() === day.getFullYear() &&
        appointmentDate.getMonth() === day.getMonth() &&
        appointmentDate.getDate() === day.getDate()
      );
    });
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

  async function deleteAppointment(appointmentId: string) {
    if (!confirm("¿Seguro que querés eliminar este turno?")) return;

    await fetch(`/api/appointments/${appointmentId}`, {
      method: "DELETE",
    });

    loadData();
  }

  function AppointmentCard({ appointment }: { appointment: Appointment }) {
    const [open, setOpen] = useState(false);

    return (
      <article className="border border-[#DED9CD] bg-[#FFFCF7] p-3 shadow-sm">
        <div className="mb-1 flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-[#A2B38B]">
            {new Date(appointment.date).toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="text-[#6B7774] hover:text-[#263F3B]"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {open && (
              <div className="absolute right-0 z-20 mt-2 w-36 border border-[#DED9CD] bg-white shadow-sm">
                {(appointment.status === "PENDING" ||
                  appointment.status === "CONFIRMED") && (
                  <>
                    <button
                      type="button"
                      onClick={() => updateStatus(appointment.id, "COMPLETED")}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-[#F7F5EF]"
                    >
                      <Check className="h-3.5 w-3.5 text-green-600" />
                      Completar
                    </button>

                    <button
                      type="button"
                      onClick={() => updateStatus(appointment.id, "CANCELED")}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-[#F7F5EF]"
                    >
                      <X className="h-3.5 w-3.5 text-[#D97A7A]" />
                      Cancelar
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => deleteAppointment(appointment.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[#D97A7A] hover:bg-[#F8ECEC]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm font-semibold">
          {appointment.patient.lastName}, {appointment.patient.firstName}
        </p>

        <p className="mt-1 text-sm text-[#6B7774]">
          {appointment.doctor.user.name}
        </p>

        <p className="mt-1 text-sm text-[#6B7774]">
          {appointment.notes || "Sin concepto"}
        </p>

        {appointment.status === "COMPLETED" && (
          <span className="mt-3 flex w-full justify-center rounded bg-green-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-green-700">
            Completado
          </span>
        )}

        {appointment.status === "CANCELED" && (
          <span className="mt-3 flex w-full justify-center rounded bg-red-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700">
            Cancelado
          </span>
        )}

        {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") && (
          <span className="mt-3 flex w-full justify-center rounded bg-yellow-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-yellow-700">
            Pendiente
          </span>
        )}
      </article>
    );
  }

  const todayAppointments = getAppointmentsForDay(currentDate);

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <div className="space-y-8">
        <header>
          <h1 className="font-serif text-4xl font-medium">
            Mis turnos
          </h1>

          <p className="mt-3 text-sm text-[#6B7774]">
            Calendario general de turnos filtrado por sucursal.
          </p>
        </header>

        <section className="border border-[#DED9CD] bg-white p-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
            Seleccionar sucursal
          </p>

          <select
            className="w-full border border-[#DED9CD] bg-white p-3 text-[#263F3B] outline-none focus:border-[#263F3B]"
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
          >
            <option value="">Seleccionar sucursal</option>

            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name} — {branch.address}, {branch.city}
              </option>
            ))}
          </select>
        </section>

        <NewGeneralAppointmentForm
          selectedBranchId={selectedBranchId}
          branches={branches}
          doctors={doctors}
          patients={patients}
          onCreated={loadData}
        />

        {selectedBranch && (
          <section className="border border-[#DED9CD] bg-white">
            <div className="flex items-center justify-between border-b border-[#DED9CD] px-6 py-4">
              <div className="flex items-center gap-4">
                <CalendarDays className="h-5 w-5 text-[#A2B38B]" />

                <button
                  onClick={previousPeriod}
                  className="flex h-9 w-9 items-center justify-center border border-[#DED9CD] transition hover:bg-[#F7F5EF]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div>
                  <h2 className="font-[var(--font-cormorant)] text-2xl font-medium capitalize">
                    {view === "mes"
                      ? monthName
                      : view === "semana"
                      ? "Semana actual"
                      : currentDate.toLocaleDateString("es-AR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                  </h2>

                  <p className="text-xs text-[#6B7774]">
                    {selectedBranch.name} — {selectedBranch.address}
                  </p>
                </div>

                <button
                  onClick={nextPeriod}
                  className="flex h-9 w-9 items-center justify-center border border-[#DED9CD] transition hover:bg-[#F7F5EF]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <button
                  onClick={goToToday}
                  className="ml-3 border border-[#DED9CD] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition hover:bg-[#F7F5EF]"
                >
                  Hoy
                </button>
              </div>

              <div className="flex border border-[#DED9CD] text-xs font-semibold uppercase tracking-[0.18em]">
                {(["mes", "semana", "dia"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setView(item)}
                    className={`px-5 py-2 ${
                      view === item
                        ? "bg-[#263F3B] text-white"
                        : "text-[#263F3B]"
                    }`}
                  >
                    {item === "dia" ? "Día" : item}
                  </button>
                ))}
              </div>
            </div>

            {view === "mes" && (
              <>
                <div className="grid grid-cols-7 border-b border-[#DED9CD] text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#6B7774]">
                  {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(
                    (day) => (
                      <div
                        key={day}
                        className="border-r border-[#DED9CD] py-3 last:border-r-0"
                      >
                        {day}
                      </div>
                    )
                  )}
                </div>

                <div className="grid grid-cols-7">
                  {calendarDays.map((day, index) => (
                    <div
                      key={index}
                      className="min-h-[145px] border-r border-b border-[#DED9CD] p-3 last:border-r-0"
                    >
                      {day && (
                        <>
                          <div
                            className={`mb-2 text-sm ${
                              day.toDateString() === currentDate.toDateString()
                                ? "flex h-7 w-7 items-center justify-center rounded-full bg-[#A2B38B] font-semibold text-white"
                                : "text-[#263F3B]"
                            }`}
                          >
                            {day.getDate()}
                          </div>

                          <div className="space-y-2">
                            {getAppointmentsForDay(day).map((appointment) => (
                              <AppointmentCard
                                key={appointment.id}
                                appointment={appointment}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {view === "semana" && (
              <div className="grid grid-cols-7">
                {weekDays.map((day) => {
                  const dayAppointments = getAppointmentsForDay(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className="min-h-[320px] border-r border-[#DED9CD] p-4 last:border-r-0"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
                        {day.toLocaleDateString("es-AR", {
                          weekday: "short",
                        })}
                      </p>

                      <p className="mt-1 text-lg font-semibold">
                        {day.getDate()}
                      </p>

                      <div className="mt-4 space-y-2">
                        {dayAppointments.map((appointment) => (
                          <AppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                          />
                        ))}

                        {dayAppointments.length === 0 && (
                          <p className="text-xs text-[#6B7774]">Sin turnos</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {view === "dia" && (
              <div className="p-6">
                <h3 className="font-[var(--font-cormorant)] text-2xl font-medium">
                  {currentDate.toLocaleDateString("es-AR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h3>

                <div className="mt-6 grid gap-4">
                  {todayAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                    />
                  ))}

                  {todayAppointments.length === 0 && (
                    <article className="border border-[#DED9CD] bg-[#FFFCF7] p-6">
                      <Clock className="mb-3 h-4 w-4 text-[#A2B38B]" />
                      <p className="text-sm text-[#6B7774]">
                        No hay turnos para este día en esta sucursal.
                      </p>
                    </article>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}