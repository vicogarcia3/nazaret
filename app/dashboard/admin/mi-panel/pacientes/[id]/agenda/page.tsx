import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import NewAppointmentForm from "./NewAppointmentForm";
import AppointmentActionsMenu from "./AppointmentActionsMenu";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    vista?: string;
    year?: string;
    month?: string;
  }>;
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthName(date: Date) {
  return date.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });
}

function AppointmentCard({ appointment }: { appointment: any }) {
  return (
    <article className="border border-[#DED9CD] bg-[#FFFCF7] p-3 shadow-sm">
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-[#A2B38B]">
          {new Date(appointment.date).toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <AppointmentActionsMenu
          appointmentId={appointment.id}
          status={appointment.status}
        />
      </div>

      <p className="text-sm font-semibold">
        {appointment.doctor?.user?.name || "Sin odontólogo"}
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
    </article>
  );
}

export default async function PatientAgendaPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { vista, year: yearParam, month: monthParam } =
    await searchParams;

  const view = vista || "mes";

  const today = new Date();

  const parsedYear = Number(yearParam);
  const parsedMonth = Number(monthParam);

  const year = Number.isInteger(parsedYear)
    ? parsedYear
    : today.getFullYear();

  const month =
    Number.isInteger(parsedMonth) &&
    parsedMonth >= 0 &&
    parsedMonth <= 11
      ? parsedMonth
      : today.getMonth();

  const currentDate = new Date(year, month, 1);
  const previousMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      branch: true,
      appointments: {
        include: {
          doctor: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          date: "asc",
        },
      },
    },
  });

  if (!patient) notFound();

  const doctors = await prisma.doctor.findMany({
    include: {
      user: true,
    },
  });

  const branches = await prisma.branch.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const calendarDays = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const appointmentsByDay = patient.appointments.reduce((acc, appointment) => {
    const date = new Date(appointment.date);

    if (date.getFullYear() === year && date.getMonth() === month) {
      const day = date.getDate();

      if (!acc[day]) acc[day] = [];
      acc[day].push(appointment);
    }

    return acc;
  }, {} as Record<number, typeof patient.appointments>);

  const weekStart = new Date(today);
  const dayOfWeek = weekStart.getDay();
  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  weekStart.setDate(today.getDate() + offset);
  weekStart.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });

  const todayAppointments = patient.appointments.filter((appointment) => {
    const date = new Date(appointment.date);
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  });

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <div className="space-y-8">
        <header>
          <Link
            href={`/dashboard/admin/mi-panel/pacientes/${patient.id}`}
            className="inline-flex items-center gap-2 text-sm text-[#A2B38B] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>

          <h1 className="mt-6 font-[var(--font-cormorant)] text-3xl font-medium">
            Agenda de {patient.firstName} {patient.lastName}
          </h1>

          <p className="mt-2 text-sm text-[#6B7774]">
            DNI: {patient.dni} • {patient.branch.name} —{" "}
            {patient.branch.address}
          </p>
        </header>

        <NewAppointmentForm
          patientId={patient.id}
          doctors={doctors}
          branches={branches}
          defaultBranchId={patient.branchId}
        />

        <section className="border border-[#DED9CD] bg-white">
          <div className="flex flex-col gap-4 border-b border-[#DED9CD] px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 shrink-0 text-[#A2B38B]" />

              {view === "mes" ? (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/admin/mi-panel/pacientes/${patient.id}/agenda?vista=mes&year=${previousMonth.getFullYear()}&month=${previousMonth.getMonth()}`}
                    aria-label="Mes anterior"
                    title="Mes anterior"
                    className="flex h-9 w-9 items-center justify-center border border-[#DED9CD] text-[#263F3B] transition hover:bg-[#F7F5EF]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Link>

                  <h2 className="min-w-[190px] text-center font-[var(--font-cormorant)] text-2xl font-medium capitalize">
                    {getMonthName(currentDate)}
                  </h2>

                  <Link
                    href={`/dashboard/admin/mi-panel/pacientes/${patient.id}/agenda?vista=mes&year=${nextMonth.getFullYear()}&month=${nextMonth.getMonth()}`}
                    aria-label="Mes siguiente"
                    title="Mes siguiente"
                    className="flex h-9 w-9 items-center justify-center border border-[#DED9CD] text-[#263F3B] transition hover:bg-[#F7F5EF]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <h2 className="font-[var(--font-cormorant)] text-2xl font-medium capitalize">
                  {view === "semana" ? "Semana actual" : "Día de hoy"}
                </h2>
              )}
            </div>

            <div className="flex w-fit border border-[#DED9CD] text-xs font-semibold uppercase tracking-[0.18em]">
              <Link
                href={`/dashboard/admin/mi-panel/pacientes/${patient.id}/agenda?vista=mes&year=${year}&month=${month}`}
                className={`px-5 py-2 ${
                  view === "mes"
                    ? "bg-[#263F3B] text-white"
                    : "text-[#263F3B]"
                }`}
              >
                Mes
              </Link>

              <Link
                href={`/dashboard/admin/mi-panel/pacientes/${patient.id}/agenda?vista=semana&year=${year}&month=${month}`}
                className={`px-5 py-2 ${
                  view === "semana"
                    ? "bg-[#263F3B] text-white"
                    : "text-[#263F3B]"
                }`}
              >
                Semana
              </Link>

              <Link
                href={`/dashboard/admin/mi-panel/pacientes/${patient.id}/agenda?vista=dia&year=${year}&month=${month}`}
                className={`px-5 py-2 ${
                  view === "dia"
                    ? "bg-[#263F3B] text-white"
                    : "text-[#263F3B]"
                }`}
              >
                Día
              </Link>
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
                    className="min-h-[135px] border-r border-b border-[#DED9CD] p-3 last:border-r-0"
                  >
                    {day && (
                      <>
                        <div
                          className={`mb-2 text-sm ${
                            day === today.getDate() &&
                            month === today.getMonth() &&
                            year === today.getFullYear()
                              ? "flex h-7 w-7 items-center justify-center rounded-full bg-[#A2B38B] font-semibold text-white"
                              : "text-[#263F3B]"
                          }`}
                        >
                          {day}
                        </div>

                        <div className="space-y-2">
                          {(appointmentsByDay[day] || []).map(
                            (appointment) => (
                              <AppointmentCard
                                key={appointment.id}
                                appointment={appointment}
                              />
                            )
                          )}
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
                const dayAppointments = patient.appointments.filter(
                  (appointment) => {
                    const date = new Date(appointment.date);

                    return (
                      date.getFullYear() === day.getFullYear() &&
                      date.getMonth() === day.getMonth() &&
                      date.getDate() === day.getDate()
                    );
                  }
                );

                return (
                  <div
                    key={day.toISOString()}
                    className="min-h-[300px] border-r border-[#DED9CD] p-4 last:border-r-0"
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
                {today.toLocaleDateString("es-AR", {
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
                    <p className="text-sm text-[#6B7774]">
                      No hay turnos para este día.
                    </p>
                  </article>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}