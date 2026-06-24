import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ClinicalHistoryEditor from "./ClinicalHistoryEditor";

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

  const pendingPayments = patient.payments.filter(
    (payment) => payment.status === "PENDING"
  );

  return (
    <div className="space-y-8">
      <Link
        href="/dashboard/admin/mi-panel/pacientes"
        className="text-sm text-[#A2B38B] hover:underline"
      >
        ← Volver a pacientes
      </Link>

      <div>
        <h1 className="text-4xl font-bold">
          {patient.firstName} {patient.lastName}
        </h1>

        <p className="mt-2 text-gray-500">
          Ficha completa del paciente.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Datos personales</h2>

          <div className="mt-4 space-y-2">
            <p>DNI: {patient.dni}</p>
            <p>Email: {patient.user.email}</p>
            <p>Teléfono: {patient.phone}</p>
            <p>
              Sucursal: {patient.branch.name} — {patient.branch.address}
            </p>
            <p>Plan: {patient.plan ? patient.plan.name : "Sin plan"}</p>
          </div>
        </section>

        <Link
          href={`/dashboard/admin/mi-panel/pacientes/${patient.id}/historia-clinica`}
          className="inline-block rounded bg-[#A2B38B] px-5 py-3 text-white hover:bg-[#8FA178]"
        >
          Completar historia clínica
        </Link>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Pagos</h2>

          <div className="mt-4 space-y-2">
            <p>Pagos realizados: {paidPayments.length}</p>
            <p>Pagos pendientes: {pendingPayments.length}</p>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Turnos</h2>

          <p className="mt-4">
            Total de turnos: {patient.appointments.length}
          </p>
        </section>

        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Presupuestos</h2>

          <p className="mt-4">
            Total de presupuestos: {patient.budgets.length}
          </p>
        </section>
      </div>
    </div>
  );
}