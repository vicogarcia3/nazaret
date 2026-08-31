import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import BudgetManager from "@/app/dashboard/admin/mi-panel/pacientes/[id]/presupuestos/BudgetManager";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type BudgetStatus =
  | "CREATED"
  | "IN_PROGRESS"
  | "COMPLETED";

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

export default async function DoctorPresupuestosPacientePage({
  params,
}: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "DOCTOR") {
    redirect("/dashboard");
  }

  const { id } = await params;

  // Buscar al doctor correspondiente al usuario logueado
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

  // El paciente se relaciona con el doctor
  // mediante el campo "odontologo" de la historia clínica.
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
      branch: true,
      plan: true,
      budgets: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          doctors: {
            include: {
              doctor: {
                include: {
                  user: true,
                },
              },
            },
          },
          items: true,
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
      },
    },
  });

  if (!patient) {
    notFound();
  }

  // Mostrar solamente los presupuestos
  // asociados al doctor logueado.
  const visibleBudgets = patient.budgets.filter((budget) =>
    budget.doctors.some(
      (budgetDoctor) =>
        budgetDoctor.doctorId === doctor.id
    )
  );

  const normalizedBudgets = visibleBudgets.map((budget) => {
    const total = Number(budget.total);

    const paidAmount = budget.payments.reduce(
      (accumulator, payment) =>
        accumulator + Number(payment.amount),
      0
    );

    const remainingAmount = Math.max(
      total - paidAmount,
      0
    );

    return {
      id: budget.id,

      createdAt: budget.createdAt.toISOString(),

      total,

      paidAmount,

      remainingAmount,

      status: normalizeBudgetStatus(
        total,
        paidAmount
      ),

      doctorName:
        budget.doctors.length > 0
          ? budget.doctors
              .map(
                ({ doctor }) =>
                  doctor.name ||
                  doctor.user?.name ||
                  "Especialista"
              )
              .join(", ")
          : "Sin especialista asignado",

      doctorIds: budget.doctors.map(
        ({ doctorId }) => doctorId
      ),

      items: budget.items.map((item) => ({
        id: item.id,
        serviceName: item.serviceName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),

      payments: budget.payments.map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        concept: payment.concept,
        paymentMethod: payment.paymentMethod,
        paidAt: payment.paidAt
          ? payment.paidAt.toISOString()
          : null,
        createdAt: payment.createdAt.toISOString(),
      })),
    };
  });

  // Doctores disponibles para el componente reutilizado
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

  return (
    <main className="min-h-screen bg-[#F7F5EF] px-4 py-6 text-[#263F3B] sm:px-6 md:px-10 md:py-8">
      <div className="mx-auto max-w-[1500px] space-y-8">
        <Link
          href={`/dashboard/doctor/pacientes/${patient.id}`}
          className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6F855F] transition hover:text-[#263F3B]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al paciente
        </Link>

        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8FA07F]">
            Gestión del paciente
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#263F3B] md:text-4xl">
            Presupuestos
          </h1>

          <p className="mt-2 text-base text-[#6B7774]">
            {patient.lastName}, {patient.firstName}
          </p>
          
        </header>

        <BudgetManager
          patientId={patient.id}
          doctors={doctors}
          discountPercent={
            patient.plan?.visible
              ? Number(patient.plan.discount)
              : 0
          }
          budgets={normalizedBudgets}
          branchName={patient.branch.name}
        />
      </div>
    </main>
  );
}