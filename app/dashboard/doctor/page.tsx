import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Stethoscope,
  UsersRound,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function getFirstName(name?: string | null) {
  if (!name) return "Profesional";

  return name.trim().split(" ")[0];
}

export default async function DoctorDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "DOCTOR") {
    redirect("/dashboard");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      user: true,
      branches: {
        select: {
          branchId: true,
        },
      },
    },
  });

  if (!doctor) {
    return (
      <main className="min-h-screen bg-[#F7F5EF] p-5 md:p-10">
        <section className="border border-[#DED9CD] bg-white p-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#263F3B]">
            Perfil profesional no encontrado
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6B7774]">
            Tu usuario todavía no está asociado a un perfil de odontólogo.
            Comunicate con administración para completar la configuración.
          </p>
        </section>
      </main>
    );
  }

  const now = new Date();

  const branchIds = doctor.branches.map(
    (doctorBranch) => doctorBranch.branchId
  );

  const [todayAppointments, nextAppointment, patientsCount, monthAppointments] =
    await Promise.all([
      prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
          branchId: {
            in: branchIds,
          },
          date: {
            gte: startOfDay(now),
            lte: endOfDay(now),
          },
          status: {
            not: "CANCELED",
          },
        },
        include: {
          patient: true,
          branch: true,
        },
        orderBy: {
          date: "asc",
        },
      }),

      prisma.appointment.findFirst({
        where: {
          doctorId: doctor.id,
          branchId: {
            in: branchIds,
          },
          date: {
            gte: now,
          },
          status: {
            not: "CANCELED",
          },
        },
        include: {
          patient: true,
          branch: true,
        },
        orderBy: {
          date: "asc",
        },
      }),

      prisma.patient.count({
        where: {
          branchId: {
            in: branchIds,
          },
        },
      }),

      prisma.appointment.count({
        where: {
          doctorId: doctor.id,
          branchId: {
            in: branchIds,
          },
          date: {
            gte: startOfMonth(now),
            lte: endOfMonth(now),
          },
          status: {
            not: "CANCELED",
          },
        },
      }),
    ]);

  /*
    Estos valores quedan listos para reemplazarlos cuando
    conectemos el dashboard con el módulo real de pagos.
  */
  const collectedThisMonth = 0;
  const pendingThisMonth = 0;

  const firstName = getFirstName(
    doctor.name || doctor.user?.name || "Especialista"
  );

  return (
    <main className="min-h-screen bg-[#F7F5EF] px-5 py-8 text-[#263F3B] md:px-10 md:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Encabezado */}

        <section className="grid gap-8 xl:grid-cols-[1fr_420px] xl:items-start">
          <header className="pt-1">
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
              ¡Hola, {firstName}!
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-[#6B7774]">
              Bienvenida/o a tu portal profesional. Desde acá podés consultar
              tu agenda, gestionar pacientes y controlar tus ingresos.
            </p>
          </header>

          <NextAppointmentCard appointment={nextAppointment} />
        </section>

        {/* Accesos principales */}

        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardAccess
            href="/dashboard/doctor/agenda"
            icon={<CalendarDays className="h-6 w-6" />}
            title="Agenda"
            description="Consultá y gestioná tus turnos y disponibilidad."
            action="Ver agenda"
          />

          <DashboardAccess
            href="/dashboard/doctor/pacientes"
            icon={<UsersRound className="h-6 w-6" />}
            title="Pacientes"
            description="Accedé a tus pacientes e historias clínicas."
            action="Ver pacientes"
          />

          <DashboardAccess
            href="/dashboard/doctor/balance"
            icon={<CircleDollarSign className="h-6 w-6" />}
            title="Balance"
            description="Revisá cobros, pendientes e ingresos."
            action="Ver balance"
          />

          <DashboardAccess
            href="/dashboard/doctor/agenda"
            icon={<Stethoscope className="h-6 w-6" />}
            title="Jornada"
            description="Consultá todas las atenciones programadas para hoy."
            action="Ver jornada"
          />
        </section>

        {/* Agenda, actividad y balance */}

        <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <TodayAgenda appointments={todayAppointments} />

          <div className="space-y-6">
            <ActivityCard
              todayAppointments={todayAppointments.length}
              monthAppointments={monthAppointments}
              patientsCount={patientsCount}
            />

            <BalanceCard
              collected={collectedThisMonth}
              pending={pendingThisMonth}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function NextAppointmentCard({
  appointment,
}: {
  appointment:
    | {
        date: Date;
        patient: {
          firstName: string;
          lastName: string;
        };
        branch: {
          name: string;
          address: string;
          city: string;
        };
      }
    | null;
}) {
  return (
    <article className="border border-[#DED9CD] bg-white p-6">
      <div className="flex items-start gap-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F0EDE6] text-[#6F855F]">
          <CalendarDays className="h-6 w-6" />
        </div>

        {appointment ? (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#6B7774]">
              Próximo turno
            </p>

            <p className="mt-1 text-xl font-semibold capitalize text-[#263F3B]">
              {formatShortDate(appointment.date)} ·{" "}
              {formatTime(appointment.date)}
            </p>

            <p className="mt-3 font-medium text-[#263F3B]">
              {appointment.patient.firstName}{" "}
              {appointment.patient.lastName}
            </p>

            <p className="mt-1 text-sm leading-6 text-[#6B7774]">
              {appointment.branch.name}
              <span className="block">
                {appointment.branch.address}, {appointment.branch.city}
              </span>
            </p>

            <Link
              href="/dashboard/doctor/agenda"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#6F855F] transition hover:text-[#263F3B]"
            >
              Ver detalles
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-sm font-semibold text-[#6B7774]">
              Próximo turno
            </p>

            <p className="mt-2 text-xl font-semibold text-[#263F3B]">
              Sin turnos programados
            </p>

            <p className="mt-2 text-sm leading-6 text-[#6B7774]">
              Cuando se registre una nueva reserva aparecerá acá.
            </p>

            <Link
              href="/dashboard/doctor/agenda"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#6F855F] transition hover:text-[#263F3B]"
            >
              Revisar agenda
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}

function DashboardAccess({
  href,
  icon,
  title,
  description,
  action,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[274px] flex-col border border-[#DED9CD] bg-white p-6 transition hover:border-[#A2B38B]"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F0EDE6] text-[#6F855F] transition group-hover:bg-[#E7EBDF]">
        {icon}
      </div>

      <h2 className="mt-8 text-xl font-semibold tracking-tight text-[#263F3B]">
        {title}
      </h2>

      <p className="mt-3 flex-1 text-sm leading-7 text-[#6B7774]">
        {description}
      </p>

      <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#6F855F]">
        {action}
        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function TodayAgenda({
  appointments,
}: {
  appointments: Array<{
    id: string;
    date: Date;
    status: string;
    patient: {
      firstName: string;
      lastName: string;
    };
    branch: {
      name: string;
    };
  }>;
}) {
  return (
    <article className="border border-[#DED9CD] bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-[#DED9CD] px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
            Agenda de hoy
          </p>
        </div>

        <Link
          href="/dashboard/doctor/agenda"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#6F855F] transition hover:text-[#263F3B]"
        >
          Ver agenda completa
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {appointments.length === 0 ? (
        <div className="flex min-h-[355px] flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F0EDE6] text-[#6F855F]">
            <CalendarDays className="h-6 w-6" />
          </div>

          <h2 className="mt-5 text-2xl font-semibold tracking-tight">
            No hay turnos para hoy
          </h2>

          <p className="mt-2 text-sm text-[#6B7774]">
            La jornada está libre por el momento.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#EEEAE1] px-5">
          {appointments.slice(0, 5).map((appointment) => (
            <article
              key={appointment.id}
              className="grid gap-4 py-5 sm:grid-cols-[75px_1fr_auto] sm:items-center"
            >
              <p className="text-xl font-semibold tracking-tight text-[#263F3B]">
                {formatTime(appointment.date)}
              </p>

              <div>
                <p className="font-semibold text-[#263F3B]">
                  {appointment.patient.firstName}{" "}
                  {appointment.patient.lastName}
                </p>

                <p className="mt-1 text-sm text-[#6B7774]">
                  {appointment.branch.name}
                </p>
              </div>

              <AppointmentStatus status={appointment.status} />
            </article>
          ))}
        </div>
      )}

      {appointments.length > 0 && (
        <div className="border-t border-[#DED9CD] px-6 py-5">
          <Link
            href="/dashboard/doctor/agenda"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#6F855F] transition hover:text-[#263F3B]"
          >
            Ver todas las atenciones
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </article>
  );
}

function ActivityCard({
  todayAppointments,
  monthAppointments,
  patientsCount,
}: {
  todayAppointments: number;
  monthAppointments: number;
  patientsCount: number;
}) {
  return (
    <article className="border border-[#DED9CD] bg-white p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
          Resumen de actividad
        </p>

        <Clock3 className="h-5 w-5 text-[#A2B38B]" />
      </div>

      <div className="mt-5 divide-y divide-[#EEEAE1]">
        <ActivityRow
          icon={<CalendarDays className="h-4 w-4" />}
          label="Turnos de hoy"
          value={String(todayAppointments)}
        />

        <ActivityRow
          icon={<CalendarDays className="h-4 w-4" />}
          label="Turnos del mes"
          value={String(monthAppointments)}
        />

        <ActivityRow
          icon={<UsersRound className="h-4 w-4" />}
          label="Pacientes disponibles"
          value={String(patientsCount)}
        />
      </div>
    </article>
  );
}

function ActivityRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0EDE6] text-[#6F855F]">
        {icon}
      </div>

      <p className="flex-1 text-sm text-[#6B7774]">{label}</p>

      <p className="text-xl font-semibold tracking-tight text-[#263F3B]">
        {value}
      </p>
    </div>
  );
}

function BalanceCard({
  collected,
  pending,
}: {
  collected: number;
  pending: number;
}) {
  return (
    <article className="border border-[#DED9CD] bg-white p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
          Balance del mes
        </p>

        <CircleDollarSign className="h-5 w-5 text-[#A2B38B]" />
      </div>

      <div className="mt-5 divide-y divide-[#EEEAE1]">
        <BalanceRow
          label="Cobrado"
          value={formatCurrency(collected)}
        />

        <BalanceRow
          label="Pendiente"
          value={formatCurrency(pending)}
        />
      </div>

      <Link
        href="/dashboard/doctor/balance"
        className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#6F855F] transition hover:text-[#263F3B]"
      >
        Ver balance completo
        <ChevronRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

function BalanceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <p className="text-sm text-[#6B7774]">{label}</p>

      <p className="text-xl font-semibold tracking-tight text-[#263F3B]">
        {value}
      </p>
    </div>
  );
}

function AppointmentStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-blue-50 text-blue-700",
    CONFIRMED: "bg-[#EEF2E9] text-[#6F855F]",
    COMPLETED: "bg-green-50 text-green-700",
    CANCELED: "bg-red-50 text-red-700",
  };

  const labels: Record<string, string> = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    COMPLETED: "Completado",
    CANCELED: "Cancelado",
  };

  return (
    <span
      className={`w-fit px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.15em] ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}