import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  FileText,
  CreditCard,
  CalendarPlus,
  MapPin,
  Headphones,
  Phone,
} from "lucide-react";

export default async function PatientDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const patient = await prisma.patient.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      branch: true,
      appointments: {
        where: {
          date: {
            gte: new Date(),
          },
          status: {
            not: "CANCELED",
          },
        },
        include: {
          doctor: {
            include: {
              user: true,
            },
          },
          branch: true,
        },
        orderBy: {
          date: "asc",
        },
        take: 1,
      },
      payments: {
        where: {
          status: {
            not: "PAID",
          },
        },
        orderBy: {
          dueDate: "asc",
        },
        take: 2,
      },
      budgets: {
        orderBy: {
          createdAt: "desc",
        },
        take: 3,
      },
    },
  });

  if (!patient) {
    redirect("/login");
  }

  const nextAppointment = patient.appointments[0];

  return (
    <div className="space-y-8">
      <section className="grid gap-8 lg:grid-cols-[1fr_420px]">
        <div>
          <h1 className="font-serif text-4xl font-medium">
            ¡Hola, {patient.firstName}!
          </h1>

          <p className="mt-3 text-[#6B7774]">
            Bienvenida/o a tu portal. Desde aquí podés gestionar tus turnos, 
            presupuestos y pagos.
          </p>
        </div>

        <article className="border border-[#DED9CD] bg-white p-6">
          <div className="flex gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F0EDE6]">
              <CalendarDays className="h-6 w-6 text-[#6F855F]" />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#6B7774]">
                Próximo turno
              </p>

              {nextAppointment ? (
                <>
                  <h2 className="mt-1 text-xl font-semibold">
                    {formatAppointmentDate(nextAppointment.date)}
                  </h2>

                  <p className="mt-2 text-sm">
                    {nextAppointment.notes || "Consulta odontológica"}
                  </p>

                  <Link
                    href="/dashboard/patient/turnos"
                    className="mt-3 inline-block text-sm font-medium text-[#6F855F]"
                  >
                    Ver detalles →
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="mt-1 text-xl font-semibold">
                    Sin turnos próximos
                  </h2>

                  <Link
                    href="/dashboard/patient/reservar"
                    className="mt-3 inline-block text-sm font-medium text-[#6F855F]"
                  >
                    Reservar turno →
                  </Link>
                </>
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <PatientCard
          icon={<CalendarPlus />}
          title="Reservar turno"
          text="Solicitar un nuevo turno de manera rápida."
          link="Reservar"
          href="/dashboard/patient/reservar"
        />

        <PatientCard
          icon={<CalendarDays />}
          title="Mis turnos"
          text="Consultá tus próximos turnos agendados."
          link="Ver turnos"
          href="/dashboard/patient/turnos"
        />

        <PatientCard
          icon={<FileText />}
          title="Presupuestos"
          text="Ver y descargar los presupuestos recibidos."
          link="Ver presupuestos"
          href="/dashboard/patient/presupuestos"
        />

        <PatientCard
          icon={<CreditCard />}
          title="Pagos"
          text="Consultá tus pagos realizados y pendientes."
          link="Ver pagos"
          href="/dashboard/patient/pagos"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="border border-[#DED9CD] bg-white p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
            Próximo turno
          </h2>

          {nextAppointment ? (
            <div className="mt-6 flex gap-6">
              <div className="flex h-28 w-20 flex-col items-center justify-center bg-[#F0EDE6] text-[#6F855F]">
                <span className="text-xs font-semibold uppercase">
                  {new Date(nextAppointment.date).toLocaleDateString("es-AR", {
                    weekday: "short",
                  })}
                </span>

                <span className="text-4xl font-semibold">
                  {new Date(nextAppointment.date).getDate()}
                </span>

                <span className="text-xs font-semibold uppercase">
                  {new Date(nextAppointment.date).toLocaleDateString("es-AR", {
                    month: "short",
                  })}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-semibold">
                  {nextAppointment.notes || "Consulta odontológica"}
                </h3>

                <p className="mt-2 text-sm">
                  {formatAppointmentTime(nextAppointment.date)} hs
                </p>

                <p className="mt-3 flex items-center gap-2 text-sm text-[#6B7774]">
                  <MapPin className="h-4 w-4" />
                  {nextAppointment.branch.name} —{" "}
                  {nextAppointment.branch.address}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-[#6B7774]">
              No tenés turnos próximos.
            </p>
          )}
        </article>

        <article className="border border-[#DED9CD] bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Pagos pendientes
            </h2>

            <Link
              href="/dashboard/patient/pagos"
              className="text-sm text-[#6F855F]"
            >
              Ver todos →
            </Link>
          </div>

          <div className="mt-6 space-y-5">
            {patient.payments.length > 0 ? (
              patient.payments.map((payment) => (
                <PaymentRow
                  key={payment.id}
                  title={payment.concept || "Pago pendiente"}
                  date={new Date(payment.dueDate).toLocaleDateString("es-AR")}
                  amount={`$${Number(payment.amount).toLocaleString("es-AR")}`}
                />
              ))
            ) : (
              <p className="text-sm text-[#6B7774]">
                No tenés pagos pendientes.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="flex flex-col gap-6 border border-[#DED9CD] bg-white p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4 md:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#6F855F] text-white">
            <Headphones className="h-7 w-7" />
          </div>

          <div>
            <h2 className="font-semibold">¿Necesitás ayuda?</h2>

            <p className="mt-1 text-sm leading-5 text-[#6B7774]">
              Estamos para ayudarte. Contactanos por WhatsApp o teléfono.
            </p>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:flex md:w-auto">
          <button className="w-full border border-[#A2B38B] px-6 py-3 text-sm font-medium text-[#263F3B] transition hover:bg-[#F0EDE6] md:w-auto">
            WhatsApp
          </button>

          <button className="flex w-full items-center justify-center gap-2 border border-[#A2B38B] px-6 py-3 text-sm font-medium text-[#263F3B] transition hover:bg-[#F0EDE6] md:w-auto">
            <Phone className="h-4 w-4 shrink-0" />
            Llamar
          </button>
        </div>
      </section>
    </div>
  );
}

function formatAppointmentDate(date: Date) {
  return new Date(date).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAppointmentTime(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

function PatientCard({
  icon,
  title,
  text,
  link,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  link: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="border border-[#DED9CD] bg-white p-6 transition hover:bg-[#FFFCF7]"
    >
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-[#F0EDE6] text-[#6F855F]">
        {icon}
      </div>

      <h2 className="text-xl font-semibold">{title}</h2>

      <p className="mt-3 text-sm leading-6 text-[#6B7774]">{text}</p>

      <p className="mt-5 text-sm font-medium text-[#6F855F]">{link} →</p>
    </Link>
  );
}

function PaymentRow({
  title,
  date,
  amount,
}: {
  title: string;
  date: string;
  amount: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#DED9CD] pb-4 last:border-b-0">
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-[#6B7774]">{date}</p>
      </div>

      <div className="text-right">
        <p className="font-semibold">{amount}</p>
        <span className="mt-1 inline-block rounded bg-yellow-100 px-3 py-1 text-xs text-yellow-700">
          Pendiente
        </span>
      </div>
    </div>
  );
}