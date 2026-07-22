import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  Clock3,
  FileText,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
  UserRound,
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

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      branches: {
        select: {
          branchId: true,
        },
      },
    },
  });

  if (!doctor) {
    notFound();
  }

  const branchIds = doctor.branches.map(
    (doctorBranch) => doctorBranch.branchId
  );

  const patient = await prisma.patient.findFirst({
    where: {
      id,
      OR: [
        {
          branchId: {
            in: branchIds,
          },
        },
        {
          appointments: {
            some: {
              doctorId: doctor.id,
            },
          },
        },
        {
          budgets: {
            some: {
              doctorId: doctor.id,
            },
          },
        },
      ],
    },
    include: {
      user: true,
      branch: true,
      plan: true,
      appointments: {
        where: {
          doctorId: doctor.id,
        },
        orderBy: {
          date: "desc",
        },
        take: 5,
      },
    },
  });

  if (!patient) {
    notFound();
  }

  const fullName = `${patient.lastName}, ${patient.firstName}`;
  const initials = getInitials(patient.firstName, patient.lastName);

  const whatsappPhone = formatPhoneForWhatsApp(patient.phone);

  const whatsappMessage = encodeURIComponent(
    `Hola ${patient.firstName}, te escribimos desde Consultorios Nazaret.`
  );

  const completedAppointments = patient.appointments.filter(
    (appointment) => appointment.status === "COMPLETED"
  ).length;

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

        <header className="overflow-hidden border border-[#DED9CD] bg-white">
          <div className="grid lg:grid-cols-[360px_minmax(0,1fr)]">
            {/* Perfil principal */}
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

            {/* Información y acciones */}
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
                    Información de contacto y asignación dentro de Consultorios
                    Nazaret.
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

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            icon={<CalendarDays className="h-5 w-5" />}
            label="Turnos recientes"
            value={String(patient.appointments.length)}
            detail="Últimos registros disponibles"
          />

          <MetricCard
            icon={<CircleCheck className="h-5 w-5" />}
            label="Atenciones completadas"
            value={String(completedAppointments)}
            detail="Dentro de los últimos turnos"
          />

          <MetricCard
            icon={<MapPin className="h-5 w-5" />}
            label="Sucursal asignada"
            value={patient.branch.city}
            detail={patient.branch.name}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px]">
          <article className="border border-[#DED9CD] bg-white">
            <div className="flex flex-col justify-between gap-4 border-b border-[#DED9CD] px-5 py-5 sm:flex-row sm:items-center md:px-7">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8FA07F]">
                  Actividad reciente
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Últimos turnos
                </h2>
              </div>

              <Link
                href="/dashboard/doctor/agenda"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#6F855F] transition hover:text-[#263F3B]"
              >
                Ver agenda
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {patient.appointments.length === 0 ? (
              <div className="flex min-h-[350px] flex-col items-center justify-center px-6 py-14 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EEF1E8] text-[#6F855F]">
                  <CalendarDays className="h-7 w-7" />
                </div>

                <h3 className="mt-5 text-2xl font-semibold tracking-tight">
                  No hay turnos registrados
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-[#6B7774]">
                  Este paciente todavía no tiene atenciones registradas con
                  vos.
                </p>

                <Link
                  href="/dashboard/doctor/agenda"
                  className="mt-6 inline-flex items-center gap-2 border border-[#263F3B] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#263F3B] transition hover:bg-[#263F3B] hover:text-white"
                >
                  Abrir agenda
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div>
                {patient.appointments.map((appointment, index) => (
                  <article
                    key={appointment.id}
                    className={`grid gap-4 px-5 py-5 md:grid-cols-[110px_minmax(0,1fr)_auto] md:items-center md:px-7 ${
                      index !== patient.appointments.length - 1
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

                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#6B7774]">
                        {appointment.notes || "Consulta sin especificar"}
                      </p>
                    </div>

                    <AppointmentStatus status={appointment.status} />
                  </article>
                ))}
              </div>
            )}
          </article>

          <aside className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8FA07F]">
                Accesos rápidos
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Gestión del paciente
              </h2>
            </div>

            <QuickAccess
              href={`/dashboard/doctor/pacientes/${patient.id}/historia-clinica`}
              icon={<Stethoscope className="h-5 w-5" />}
              title="Historia clínica"
              description="Consultar y actualizar los datos clínicos y el odontograma."
              primary
            />

            <QuickAccess
              href={`/print/historia-clinica/${patient.id}`}
              target="_blank"
              icon={<FileText className="h-5 w-5" />}
              title="Historia clínica en PDF"
              description="Abrir la versión imprimible de la historia clínica."
            />

            <QuickAccess
              href="/dashboard/doctor/agenda"
              icon={<CalendarDays className="h-5 w-5" />}
              title="Consultar agenda"
              description="Revisar turnos y actualizar el estado de las atenciones."
            />

            {whatsappPhone && (
              <a
                href={`https://wa.me/${whatsappPhone}?text=${whatsappMessage}`}
                target="_blank"
                rel="noreferrer"
                className="group block border border-[#DED9CD] bg-white p-5 transition hover:border-[#6F855F]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEF1E8] text-[#6F855F] transition group-hover:bg-[#6F855F] group-hover:text-white">
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

                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[#8FA07F]" />
                </div>
              </a>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}

function HeaderDetail({
  icon,
  label,
  value,
  detail,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 gap-3 px-5 py-4 ${
        last
          ? ""
          : "border-b border-[#EEEAE1] sm:border-b-0 sm:border-r"
      }`}
    >
      <div className="mt-0.5 text-[#8FA07F]">{icon}</div>

      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8FA07F]">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-medium text-[#263F3B]">
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