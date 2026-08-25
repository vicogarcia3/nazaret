import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  CircleCheck,
  Clock3,
  FileText,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
  UserRound,
  Wallet,
  AlertCircle,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const ARGENTINA_TIMEZONE = "America/Argentina/Cordoba";

function formatPhoneForWhatsApp(phone?: string | null) {
  if (!phone) return "";

  const onlyNumbers = phone.replace(/\D/g, "");

  if (onlyNumbers.startsWith("54")) {
    return onlyNumbers;
  }

  return `54${onlyNumbers}`;
}

function formatAppointmentDate(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: ARGENTINA_TIMEZONE,
  }).format(date);
}

function formatAppointmentTime(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: ARGENTINA_TIMEZONE,
  }).format(date);
}

function formatMoney(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default async function DoctorPatientPage({ params }: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "DOCTOR") {
    redirect("/dashboard");
  }

  const { id } = await params;

  /*
   * Buscamos al especialista asociado al usuario logueado.
   */
  const doctor = await prisma.doctor.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!doctor) {
    notFound();
  }

  /*
   * =====================================================
   * ACCESO AL PACIENTE
   * =====================================================
   *
   * El paciente solamente pertenece al portal del
   * especialista si alguna Historia Clínica tiene:
   *
   * data.odontologo === doctor.name
   *
   * No usamos sucursal, turnos ni presupuestos
   * como criterio de acceso.
   */
  const patient = await prisma.patient.findFirst({
    where: {
      id,
      histories: {
        some: {
          data: {
            path: ["odontologo"],
            equals: doctor.name,
          },
        },
      },
    },

    include: {
      user: true,
      branch: true,
      plan: true,

      histories: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 1,
      },

      budgets: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          items: true,
          payments: true,
        },
      },

      payments: {
        orderBy: {
          dueDate: "desc",
        },
      },

      appointments: {
        orderBy: {
          date: "desc",
        },
        include: {
          doctor: true,
          branch: true,
        },
      },
    },
  });

  if (!patient) {
    notFound();
  }

  const latestHistory = patient.histories[0];

  const paidPayments = patient.payments.filter(
    (payment) => payment.status === "PAID"
  );

  const pendingPayments = patient.payments.filter(
    (payment) => payment.status === "PENDING"
  );

  const delayedPayments = pendingPayments.filter(
    (payment) => new Date(payment.dueDate) < new Date()
  );

  const totalPaid = paidPayments.reduce(
    (acc, payment) => acc + Number(payment.amount),
    0
  );

  const totalPending = pendingPayments.reduce(
    (acc, payment) => acc + Number(payment.amount),
    0
  );

  const totalDelayed = delayedPayments.reduce(
    (acc, payment) => acc + Number(payment.amount),
    0
  );

  const totalBudgets = patient.budgets.reduce(
    (acc, budget) => acc + Number(budget.total),
    0
  );

  const completedAppointments = patient.appointments.filter(
    (appointment) => appointment.status === "COMPLETED"
  );

  const futureAppointments = patient.appointments
    .filter(
      (appointment) =>
        new Date(appointment.date) > new Date() &&
        appointment.status !== "CANCELED"
    )
    .sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    );

  const nextAppointment = futureAppointments[0];

  const whatsappPhone = formatPhoneForWhatsApp(patient.phone);

  const whatsappMessage = encodeURIComponent(
    `Hola ${patient.firstName}, te escribimos desde Consultorios Nazaret.`
  );

  const fullName = `${patient.lastName}, ${patient.firstName}`;

  const initials = getInitials(
    patient.firstName,
    patient.lastName
  );

  return (
    <main className="min-h-screen bg-[#F7F5EF] px-4 py-6 text-[#263F3B] sm:px-6 md:px-10 md:py-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <Link
          href="/dashboard/doctor/pacientes"
          className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6F855F] transition hover:text-[#263F3B]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a pacientes
        </Link>

        {/* =========================
            CABECERA DEL PACIENTE
        ========================== */}
        <header className="overflow-hidden border border-[#DED9CD] bg-white">
          <div className="grid lg:grid-cols-[360px_minmax(0,1fr)]">
            <section className="flex flex-col justify-between bg-[#EEF1E8] p-6 md:p-8">
              <div>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-xl font-semibold text-[#6F855F] shadow-sm">
                  {initials}
                </div>

                <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7F9171]">
                  Ficha del paciente
                </p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#263F3B] md:text-4xl">
                  {fullName}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5F6F6B]">
                    DNI {patient.dni || "Sin registrar"}
                  </span>

                  <span className="bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5F6F6B]">
                    {patient.plan?.name || "Sin plan"}
                  </span>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-xs leading-5 text-[#6B7774]">
                  Paciente registrado en
                </p>

                <p className="mt-1 font-semibold text-[#263F3B]">
                  {patient.branch.name}
                </p>

                <p className="mt-1 text-xs leading-5 text-[#6B7774]">
                  {patient.branch.city}
                </p>
              </div>
            </section>

            <section className="flex flex-col">
              <div className="flex flex-col justify-between gap-5 border-b border-[#EEEAE1] p-6 md:flex-row md:items-start md:p-8">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8FA07F]">
                    Información personal
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#263F3B]">
                    Datos del paciente
                  </h2>

                  <p className="mt-2 max-w-lg text-sm leading-6 text-[#6B7774]">
                    Información de contacto y datos generales del paciente.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {whatsappPhone && (
                    <a
                      href={`https://wa.me/${whatsappPhone}?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center justify-center gap-2 border border-[#263F3B] px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#263F3B] transition hover:bg-[#263F3B] hover:text-white"
                    >
                      <Phone className="h-4 w-4" />
                      WhatsApp
                    </a>
                  )}

                  <Link
                    href={`/dashboard/doctor/pacientes/${patient.id}/historia-clinica`}
                    className="inline-flex h-11 items-center justify-center gap-2 bg-[#263F3B] px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-[#1D302D]"
                  >
                    <Stethoscope className="h-4 w-4" />
                    Historia clínica
                  </Link>
                </div>
              </div>

              <div className="grid flex-1 gap-x-8 gap-y-6 p-6 sm:grid-cols-2 md:p-8">
                <PatientData
                  icon={<Phone className="h-4 w-4" />}
                  label="Teléfono"
                  value={patient.phone || "Sin registrar"}
                />

                <PatientData
                  icon={<Mail className="h-4 w-4" />}
                  label="Correo electrónico"
                  value={
                    patient.user?.email ||
                    patient.email ||
                    "Sin correo registrado"
                  }
                />

                <PatientData
                  icon={<MapPin className="h-4 w-4" />}
                  label="Sucursal"
                  value={patient.branch.name}
                  detail={`${patient.branch.address}, ${patient.branch.city}`}
                />

                <PatientData
                  icon={<BadgeCheck className="h-4 w-4" />}
                  label="Plan"
                  value={patient.plan?.name || "Sin plan"}
                />
              </div>
            </section>
          </div>
        </header>

        {/* =========================
            RESUMEN
        ========================== */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<CalendarDays className="h-5 w-5" />}
            label="Turnos"
            value={String(patient.appointments.length)}
            detail="Turnos registrados"
          />

          <MetricCard
            icon={<CircleCheck className="h-5 w-5" />}
            label="Atenciones"
            value={String(completedAppointments.length)}
            detail="Atenciones completadas"
          />

          <MetricCard
            icon={<FileText className="h-5 w-5" />}
            label="Presupuestos"
            value={String(patient.budgets.length)}
            detail={formatMoney(totalBudgets)}
          />

          <MetricCard
            icon={<Wallet className="h-5 w-5" />}
            label="Pagos"
            value={String(patient.payments.length)}
            detail={formatMoney(totalPaid)}
          />
        </section>

        {/* =========================
            PAGOS / SALDOS
        ========================== */}
        <section className="grid gap-4 md:grid-cols-3">
          <article className="border border-[#DED9CD] bg-white p-6">
            <Wallet className="mb-4 h-5 w-5 text-[#A2B38B]" />

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Cobrado
            </p>

            <p className="mt-3 text-3xl font-semibold text-green-700">
              {formatMoney(totalPaid)}
            </p>

            <p className="mt-2 text-sm text-[#6B7774]">
              Pagos registrados como cobrados.
            </p>
          </article>

          <article className="border border-[#DED9CD] bg-white p-6">
            <Clock3 className="mb-4 h-5 w-5 text-[#A2B38B]" />

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Pendiente
            </p>

            <p className="mt-3 text-3xl font-semibold text-amber-700">
              {formatMoney(totalPending)}
            </p>

            <p className="mt-2 text-sm text-[#6B7774]">
              Pagos pendientes.
            </p>
          </article>

          <article className="border border-[#DED9CD] bg-white p-6">
            <AlertCircle className="mb-4 h-5 w-5 text-[#A2B38B]" />

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Demorados
            </p>

            <p className="mt-3 text-3xl font-semibold text-red-600">
              {formatMoney(totalDelayed)}
            </p>

            <p className="mt-2 text-sm text-[#6B7774]">
              Pagos pendientes con vencimiento superado.
            </p>
          </article>
        </section>

        {/* =========================
            PRESUPUESTOS
        ========================== */}
        <section className="border border-[#DED9CD] bg-white">
          <div className="border-b border-[#DED9CD] px-6 py-5 md:px-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8FA07F]">
              Información económica
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Presupuestos
            </h2>
          </div>

          {patient.budgets.length === 0 ? (
            <div className="p-8 text-sm text-[#6B7774]">
              El paciente no tiene presupuestos registrados.
            </div>
          ) : (
            <div>
              {patient.budgets.map((budget, index) => {
                const budgetPaid = budget.payments
                  .filter((payment) => payment.status === "PAID")
                  .reduce(
                    (sum, payment) => sum + Number(payment.amount),
                    0
                  );

                const remaining = Math.max(
                  Number(budget.total) - budgetPaid,
                  0
                );

                return (
                  <article
                    key={budget.id}
                    className="border-b border-[#EEEAE1] p-6 last:border-b-0 md:p-8"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
                          Presupuesto #{index + 1}
                        </p>

                        <h3 className="mt-2 text-xl font-semibold">
                          {budget.description || "Sin descripción"}
                        </h3>

                        <p className="mt-2 text-sm text-[#6B7774]">
                          Estado: {budget.status}
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3 md:min-w-[420px]">
                        <MoneySummary
                          label="Total"
                          value={Number(budget.total)}
                        />

                        <MoneySummary
                          label="Abonado"
                          value={budgetPaid}
                          className="text-green-700"
                        />

                        <MoneySummary
                          label="Pendiente"
                          value={remaining}
                          className="text-amber-700"
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* =========================
            TURNOS
        ========================== */}
        <section className="border border-[#DED9CD] bg-white">
          <div className="flex flex-col justify-between gap-4 border-b border-[#DED9CD] px-6 py-5 sm:flex-row sm:items-center md:px-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8FA07F]">
                Actividad
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Turnos
              </h2>
            </div>

            <Link
              href="/dashboard/doctor/agenda"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#6F855F] transition hover:text-[#263F3B]"
            >
              Ver agenda
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {patient.appointments.length === 0 ? (
            <div className="p-8 text-sm text-[#6B7774]">
              No hay turnos registrados para este paciente.
            </div>
          ) : (
            <div>
              {patient.appointments.slice(0, 10).map((appointment, index) => (
                <article
                  key={appointment.id}
                  className={`grid gap-4 px-6 py-5 md:grid-cols-[120px_minmax(0,1fr)_auto] md:items-center md:px-8 ${
                    index !==
                    Math.min(patient.appointments.length, 10) - 1
                      ? "border-b border-[#EEEAE1]"
                      : ""
                  }`}
                >
                  <div>
                    <p className="text-xl font-semibold tracking-tight">
                      {formatAppointmentTime(appointment.date)}
                    </p>

                    <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A2B38B]">
                      Horario
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="capitalize font-semibold text-[#263F3B]">
                      {formatAppointmentDate(appointment.date)}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-[#6B7774]">
                      {appointment.notes || "Consulta sin especificar"}
                    </p>

                    <p className="mt-1 text-xs text-[#8A9692]">
                      {appointment.doctor?.name || "Profesional no informado"}
                    </p>
                  </div>

                  <AppointmentStatus status={appointment.status} />
                </article>
              ))}
            </div>
          )}

          {nextAppointment && (
            <div className="border-t border-[#DED9CD] bg-[#FAF9F5] px-6 py-5 md:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
                Próximo turno
              </p>

              <p className="mt-2 text-sm font-semibold text-[#263F3B]">
                {formatAppointmentDate(nextAppointment.date)} a las{" "}
                {formatAppointmentTime(nextAppointment.date)}
              </p>
            </div>
          )}
        </section>

        {/* =========================
            ACCESOS RÁPIDOS
        ========================== */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <QuickAccess
            href={`/dashboard/doctor/pacientes/${patient.id}/historia-clinica`}
            icon={<Stethoscope className="h-5 w-5" />}
            title="Historia clínica"
            description="Consultar los datos clínicos y el odontograma."
            primary
          />

          <QuickAccess
            href={`/print/historia-clinica/${patient.id}`}
            target="_blank"
            icon={<FileText className="h-5 w-5" />}
            title="Historia clínica en PDF"
            description="Abrir la versión imprimible."
          />

          <QuickAccess
            href="/dashboard/doctor/agenda"
            icon={<CalendarDays className="h-5 w-5" />}
            title="Consultar agenda"
            description="Revisar y gestionar turnos."
          />

          {whatsappPhone && (
            <a
              href={`https://wa.me/${whatsappPhone}?text=${whatsappMessage}`}
              target="_blank"
              rel="noreferrer"
              className="group block border border-[#DED9CD] bg-white p-5 transition hover:border-[#6F855F]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEF1E8] text-[#6F855F]">
                  <Phone className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[#263F3B]">
                    Contactar por WhatsApp
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-[#6B7774]">
                    Iniciar una conversación con {patient.firstName}.
                  </p>
                </div>

                <ArrowUpRight className="h-4 w-4 text-[#8FA07F]" />
              </div>
            </a>
          )}
        </section>
      </div>
    </main>
  );
}

function PatientData({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF1E8] text-[#6F855F]">
        {icon}
      </div>

      <div className="min-w-0 pt-0.5">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8FA07F]">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold leading-6 text-[#263F3B]">
          {value}
        </p>

        {detail && (
          <p className="mt-1 text-xs leading-5 text-[#6B7774]">
            {detail}
          </p>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="flex items-center gap-4 border border-[#DED9CD] bg-white p-5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EEF1E8] text-[#6F855F]">
        {icon}
      </div>

      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8FA07F]">
          {label}
        </p>

        <p className="mt-1 text-2xl font-semibold tracking-tight text-[#263F3B]">
          {value}
        </p>

        <p className="mt-1 text-xs text-[#6B7774]">{detail}</p>
      </div>
    </article>
  );
}

function MoneySummary({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#A2B38B]">
        {label}
      </p>

      <p className={`mt-1 text-lg font-semibold ${className}`}>
        {formatMoney(value)}
      </p>
    </div>
  );
}

function QuickAccess({
  href,
  icon,
  title,
  description,
  target,
  primary = false,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  target?: "_blank";
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      target={target}
      className={`group block border p-5 transition ${
        primary
          ? "border-[#263F3B] bg-[#263F3B] text-white hover:bg-[#1D302D]"
          : "border-[#DED9CD] bg-white hover:border-[#6F855F]"
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
            primary
              ? "bg-white/10 text-white"
              : "bg-[#EEF1E8] text-[#6F855F] group-hover:bg-[#6F855F] group-hover:text-white"
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h3
            className={`font-semibold ${
              primary ? "text-white" : "text-[#263F3B]"
            }`}
          >
            {title}
          </h3>

          <p
            className={`mt-1 text-sm leading-6 ${
              primary ? "text-white/70" : "text-[#6B7774]"
            }`}
          >
            {description}
          </p>
        </div>

        <ArrowUpRight
          className={`h-4 w-4 shrink-0 ${
            primary ? "text-white/70" : "text-[#8FA07F]"
          }`}
        />
      </div>
    </Link>
  );
}

function AppointmentStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-[#FFF4D8] text-[#8A6D1D]",
    CONFIRMED: "bg-[#E8F0E3] text-[#5F7653]",
    COMPLETED: "bg-[#E8ECEB] text-[#455B57]",
    CANCELED: "bg-[#F8E6E6] text-[#A45858]",
  };

  const labels: Record<string, string> = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    COMPLETED: "Completado",
    CANCELED: "Cancelado",
  };

  return (
    <span
      className={`w-fit px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.14em] ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {labels[status] || status}
    </span>
  );
}