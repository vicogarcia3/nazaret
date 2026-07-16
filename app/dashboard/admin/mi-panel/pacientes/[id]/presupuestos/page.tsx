import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Plus,
  Percent,
  Wallet,
} from "lucide-react";
import NewBudgetForm from "./NewBudgetForm";
import ViewBudgetPdfButton from "./ViewBudgetPdfButton";
import AcceptBudgetButton from "./AcceptBudgetButton";
import RejectBudgetButton from "./RejectBudgetButton";
import DeleteBudgetButton from "./DeleteBudgetButton";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PresupuestosPacientePage({ params }: Props) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      branch: true,
      plan: true,
      budgets: {
        orderBy: {
          createdAt: "desc",
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

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <div className="space-y-10">
        <header>
          <Link
            href={`/dashboard/admin/mi-panel/pacientes/${patient.id}`}
            className="inline-flex items-center gap-2 text-sm text-[#A2B38B] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al paciente
          </Link>

          <div className="mt-6">
            <h1 className="font-[var(--font-cormorant)] text-4xl font-medium leading-tight">
              Presupuestos de {patient.firstName} {patient.lastName}
            </h1>

            <p className="mt-2 text-sm text-[#6B7774]">
              Creá presupuestos y consultá el historial del paciente.
            </p>
          </div>
        </header>

        <NewBudgetForm
          patientId={patient.id}
          doctors={doctors}
          discountPercent={patient.plan?.active ? Number(patient.plan.discount) : 0}
        />

        <section className="grid gap-6">
          {patient.budgets.map((budget, index) => (
            <article
              key={budget.id}
              className="border border-[#DED9CD] bg-white p-6"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#A2B38B]">#{index + 1}</span>
                  <FileText className="h-4 w-4 text-[#A2B38B]" />
                </div>

                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6B7774]">
                  {new Date(budget.createdAt).toLocaleDateString("es-AR")}
                </span>
              </div>

              <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
                Presupuesto
              </h2>

              <div className="mt-4 grid gap-5 text-sm md:grid-cols-3">
                <p>
                  <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Total
                  </span>
                  <span className="mt-2 block text-[15px]">
                    ${Number(budget.total).toLocaleString("es-AR")}
                  </span>
                </p>

                <p>
                  <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Estado
                  </span>
                  <span className="mt-2 block text-[15px]">
                    {!budget.status || budget.status === "DRAFT"
                      ? "Borrador"
                      : budget.status === "SENT"
                      ? "Enviado"
                      : budget.status === "ACCEPTED"
                      ? "Aceptado"
                      : budget.status === "IN_PROGRESS"
                      ? "En proceso"
                      : budget.status === "COMPLETED"
                      ? "Completado"
                      : budget.status === "REJECTED"
                      ? "Rechazado"
                      : budget.status === "EXPIRED"
                      ? "Vencido"
                      : budget.status}
                  </span>
                </p>

                <p>
                  <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Sucursal
                  </span>
                  <span className="mt-2 block text-[15px]">
                    {patient.branch.name}
                  </span>
                </p>
              </div>
              
              <div className="mt-8 flex items-center justify-end gap-5">
                <ViewBudgetPdfButton budgetId={budget.id} />

                {(!budget.status || budget.status === "DRAFT" || budget.status === "SENT") && (
                  <>
                    <AcceptBudgetButton budgetId={budget.id} />
                    <RejectBudgetButton budgetId={budget.id} />
                  </>
                )}

                <DeleteBudgetButton budgetId={budget.id} />
              </div>
            </article>
          ))}

          {patient.budgets.length === 0 && (
            <article className="border border-[#DED9CD] bg-white p-8">
              <p className="text-sm text-[#6B7774]">
                Este paciente todavía no tiene presupuestos registrados.
              </p>
            </article>
          )}
        </section>
      </div>
    </div>
  );
}