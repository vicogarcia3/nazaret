import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  ClipboardList,
  Calendar,
  Wallet,
  FileText,
} from "lucide-react";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PacienteDetallePage({ params }: Props) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      user: true,
      branch: true,
      plan: true,
      appointments: true,
      budgets: true,
      payments: true,
      histories: {
        orderBy: {
          createdAt: "desc",
        },
      },
      odontogram: true,
    },
  });

  if (!patient) {
    notFound();
  }

  const paidPayments = patient.payments.filter(
    (payment) => payment.status === "PAID"
  );

  const latestHistory = patient.histories[0];


  const nextAppointment = patient.appointments
    .filter((appointemnt) => new Date(appointemnt.date) > new Date())
    .sort(
      (a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    )[0];

  const delayedPayments = patient.payments.filter(
    (payment) =>
      payment.status === "PENDING" &&
      new Date(payment.dueDate) < new Date()
  );

  const pendingPayments = patient.payments.filter(
    (payment) =>
      payment.status === "PENDING" &&
      new Date(payment.dueDate) >= new Date()
  );

  const totalPaid = paidPayments.reduce(
    (acc, p) => acc + Number(p.amount),
    0
  );

  const totalPending = pendingPayments.reduce(
    (acc, p) => acc + Number(p.amount),
    0
  );

  const totalDelayed = delayedPayments.reduce(
    (acc, p) => acc + Number(p.amount),
    0
  );

  const completedAppointments = patient.appointments
    .filter((a) => a.status === "COMPLETED")
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

  const lastCompletedAppointment = completedAppointments[0];

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <div className="space-y-10">
        <header>
          <Link
            href="/dashboard/admin/mi-panel/pacientes"
            className="inline-flex items-center gap-2 text-sm text-[#A2B38B] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a pacientes
          </Link>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-[var(--font-cormorant)] text-4xl font-medium leading-tight">
                {patient.firstName} {patient.lastName}
              </h1>

              <p className="mt-2 text-sm text-[#6B7774]">
                Paciente · {patient.plan ? patient.plan.name : "Sin plan"}
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="border border-[#DED9CD] bg-white p-8">
            <User className="mb-3 h-4 w-4 text-[#A2B38B]" />

            <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
              Datos personales
            </h2>

            <div className="mt-4 grid gap-5 text-sm md:grid-cols-2">
              <p>
                <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  DNI
                </span>
                <span className="mt-1 block">{patient.dni}</span>
              </p>

              <p>
                <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Email
                </span>
                <span className="mt-1 block">
                  {patient.user?.email || patient.email || "No cargado"}
                </span>
              </p>

              <p>
                <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Teléfono
                </span>
                <span className="mt-1 block">{patient.phone}</span>
              </p>

              <p>
                <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Plan
                </span>
                <span className="mt-1 block">
                  {patient.plan ? patient.plan.name : "Sin plan"}
                </span>
              </p>

              <p className="md:col-span-2">
                <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Sucursal
                </span>
                <span className="mt-1 block">
                  {patient.branch.name} — {patient.branch.address}
                </span>
              </p>
            </div>
          </article>

          <article className="border border-[#DED9CD] bg-white p-8">
            <ClipboardList className="mb-3 h-4 w-4 text-[#A2B38B]" />

            <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
              Historia clínica
            </h2>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                Estado
              </p>

              <p className="mt-2 text-[15px]">
                {latestHistory ? "Completa" : "Incompleta"}
              </p>

              <p className="mt-4 text-sm leading-6 text-[#6B7774]">
                {latestHistory
                  ? "La historia clínica ya tiene información registrada."
                  : "Todavía no se registró la historia clínica del paciente."}
              </p>
            </div>

            <div className="mt-8 flex justify-end">
              <Link
                href={`/dashboard/admin/mi-panel/pacientes/${patient.id}/historia-clinica`}
                className="bg-[#263F3B] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#1d302d]"
              >
                {latestHistory ? "Editar historia" : "Completar historia"}
              </Link>
            </div>
          </article>

          <article className="border border-[#DED9CD] bg-white p-8">
            <Wallet className="mb-3 h-4 w-4 text-[#A2B38B]" />

            <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
              Pagos
            </h2>

            <div className="mt-4 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Cobrados
                </p>

                <p className="mt-2 text-[15px]">
                  ${totalPaid.toLocaleString("es-AR")}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Pendientes
                </p>

                <p className="mt-2 text-[15px]">
                  ${totalPending.toLocaleString("es-AR")}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Demorados
                </p>

                <p className="mt-2 text-[15px]">
                  ${totalDelayed.toLocaleString("es-AR")}
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Link
                href={`/dashboard/admin/mi-panel/pacientes/${patient.id}/pagos`}
                className="inline-flex items-center justify-center border border-[#22343D] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#22343D] transition hover:bg-[#22343D] hover:text-white"
              >
                Ver pagos
              </Link>
            </div>
          </article>

          <article className="border border-[#DED9CD] bg-white p-8">
            <Calendar className="mb-3 h-4 w-4 text-[#A2B38B]" />

            <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
              Turnos
            </h2>

            <div className="mt-4 space-y-5 text-sm">

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Total de turnos
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {patient.appointments.length}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Próximo turno
                </p>

                <p className="mt-2 text-[15px]">
                  {nextAppointment
                    ? new Date(nextAppointment.date).toLocaleDateString("es-AR")
                    : "Sin turnos"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                  Última visita
                </p>

                <p className="mt-2 text-[15px]">
                  {lastCompletedAppointment
                    ? new Date(lastCompletedAppointment.date).toLocaleDateString("es-AR")
                    : "Sin visitas registradas"}
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Link
                href={`/dashboard/admin/mi-panel/pacientes/${patient.id}/agenda`}
                className="border border-[#263F3B] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] transition hover:bg-[#263F3B] hover:text-white"
              >
                Ver agenda
              </Link>
            </div>
          </article>

          <article className="border border-[#DED9CD] bg-white px-8 py-6 md:col-span-2">
            <FileText className="mb-3 h-4 w-4 text-[#A2B38B]" />

            <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
              Presupuestos
            </h2>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                Total de presupuestos
              </p>

              <p className="mt-1 text-[15px] font-semibold">
                {patient.budgets.length}
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <Link
                href={`/dashboard/admin/mi-panel/pacientes/${patient.id}/presupuestos`}
                className="border border-[#263F3B] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] transition hover:bg-[#263F3B] hover:text-white"
              >
                Ver presupuestos
              </Link>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}