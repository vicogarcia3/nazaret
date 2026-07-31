import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NewBudgetForm from "./NewBudgetForm";
import BudgetAccordion from "./BudgetAccordion";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type BudgetStatus = "CREATED" | "IN_PROGRESS" | "COMPLETED";

function normalizeBudgetStatus(
  total: number,
  paidAmount: number
): BudgetStatus {
  if (total > 0 && paidAmount >= total) {
    return "COMPLETED";
  }

  if (paidAmount > 0) {
    return "IN_PROGRESS";
  }

  return "CREATED";
}

export default async function PresupuestosPacientePage({
  params,
}: Props) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: {
      id,
    },

    include: {
      branch: true,
      plan: true,

      budgets: {
        include: {
          doctor: {
            include: {
              user: true,
            },
          },

          payments: {
            where: {
              status: "PAID",
            },

            orderBy: [
              {
                paidAt: "desc",
              },
              {
                createdAt: "desc",
              },
            ],
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!patient) {
    notFound();
  }

  const doctors = await prisma.doctor.findMany({
    where: {
      active: true,
    },

    include: {
      user: true,
    },

    orderBy: {
      user: {
        name: "asc",
      },
    },
  });

  const normalizedBudgets = patient.budgets.map((budget) => {
    const total = Number(budget.total);

    const paidAmount = budget.payments.reduce(
      (accumulator, payment) =>
        accumulator + Number(payment.amount),
      0
    );

    const remainingAmount = Math.max(total - paidAmount, 0);

    return {
      id: budget.id,
      createdAt: budget.createdAt.toISOString(),
      total,
      paidAmount,
      remainingAmount,
      status: normalizeBudgetStatus(total, paidAmount),
      doctorName:
        budget.doctor.name || budget.doctor.user?.name || "Sin especialista asignado",

      payments: budget.payments.map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        concept: payment.concept,
        paymentMethod: payment.paymentMethod,
        paidAt: payment.paidAt?.toISOString() || null,
        createdAt: payment.createdAt.toISOString(),
      })),
    };
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
              Presupuestos de {patient.firstName}{" "}
              {patient.lastName}
            </h1>

            <p className="mt-2 text-sm text-[#6B7774]">
              Creá presupuestos y consultá el historial y el saldo
              pendiente del paciente.
            </p>
          </div>
        </header>

        <NewBudgetForm
          patientId={patient.id}
          doctors={doctors}
          discountPercent={
            patient.plan?.active
              ? Number(patient.plan.discount)
              : 0
          }
        />

        <BudgetAccordion
          budgets={normalizedBudgets}
          branchName={patient.branch.name}
        />
      </div>
    </div>
  );
}