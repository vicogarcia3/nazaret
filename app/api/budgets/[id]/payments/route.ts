import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type CreatePaymentBody = {
  amount?: number | string;
  paidAt?: string;
  concept?: string;
  paymentMethod?: string;
};

function normalizeText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "DOCTOR"
    ) {
      return NextResponse.json(
        {
          error:
            "No tenés permisos para consultar pagos.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } = await context.params;

    const budget =
      await prisma.budget.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          total: true,

          doctors: {
            select: {
              doctorId: true,
            },
          },
        },
      });

    if (!budget) {
      return NextResponse.json(
        {
          error: "Presupuesto no encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (session.user.role === "DOCTOR") {
      const doctor =
        await prisma.doctor.findUnique({
          where: {
            userId: session.user.id,
          },
          select: {
            id: true,
          },
        });

      const doctorBelongsToBudget =
        doctor &&
        budget.doctors.some(
          (budgetDoctor) =>
            budgetDoctor.doctorId === doctor.id
        );

      if (!doctorBelongsToBudget) {
        return NextResponse.json(
          {
            error:
              "No tenés permisos para consultar estos pagos.",
          },
          {
            status: 403,
          }
        );
      }
    }

    const payments =
      await prisma.payment.findMany({
        where: {
          budgetId: budget.id,
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
      });

    const paidAmount = payments.reduce(
      (total, payment) =>
        total + Number(payment.amount),
      0
    );

    const budgetTotal =
      Number(budget.total);

    const remainingAmount = Math.max(
      budgetTotal - paidAmount,
      0
    );

    return NextResponse.json({
      payments,
      summary: {
        total: budgetTotal,
        paidAmount,
        remainingAmount,
      },
    });
  } catch (error) {
    console.error(
      "Error obteniendo pagos del presupuesto:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron obtener los pagos.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "DOCTOR"
    ) {
      return NextResponse.json(
        {
          error:
            "No tenés permisos para registrar pagos.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } = await context.params;

    const body =
      (await request.json()) as CreatePaymentBody;

    const amount = Number(body.amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "El monto debe ser mayor que cero.",
        },
        {
          status: 400,
        }
      );
    }

    const paidAt = body.paidAt
      ? new Date(
          `${body.paidAt}T12:00:00`
        )
      : new Date();

    if (Number.isNaN(paidAt.getTime())) {
      return NextResponse.json(
        {
          error:
            "La fecha del pago no es válida.",
        },
        {
          status: 400,
        }
      );
    }

    const paymentMethod = normalizeText(
      body.paymentMethod
    );

    const concept = normalizeText(
      body.concept
    );

    const result =
      await prisma.$transaction(
        async (transaction) => {
          const budget =
            await transaction.budget.findUnique({
              where: {
                id,
              },

              include: {
                patient: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },

                doctors: {
                  include: {
                    doctor: {
                      select: {
                        id: true,
                        name: true,
                        specialty: true,
                        professionalLicense: true,
                        user: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },

                payments: {
                  where: {
                    status: "PAID",
                  },

                  select: {
                    amount: true,
                  },
                },
              },
            });

          if (!budget) {
            throw new Error(
              "BUDGET_NOT_FOUND"
            );
          }

          if (
            session.user.role === "DOCTOR"
          ) {
            const sessionDoctor =
              await transaction.doctor.findUnique({
                where: {
                  userId: session.user.id,
                },
                select: {
                  id: true,
                },
              });

            const doctorBelongsToBudget =
              sessionDoctor &&
              budget.doctors.some(
                (budgetDoctor) =>
                  budgetDoctor.doctorId ===
                  sessionDoctor.id
              );

            if (!doctorBelongsToBudget) {
              throw new Error("FORBIDDEN");
            }
          }

          const budgetTotal =
            Number(budget.total);

          const currentPaidAmount =
            budget.payments.reduce(
              (total, payment) =>
                total +
                Number(payment.amount),
              0
            );

          const currentRemainingAmount =
            Math.max(
              budgetTotal -
                currentPaidAmount,
              0
            );

          if (
            currentRemainingAmount <= 0
          ) {
            throw new Error(
              "BUDGET_COMPLETED"
            );
          }

          if (
            amount >
            currentRemainingAmount
          ) {
            throw new Error(
              "AMOUNT_EXCEEDS_REMAINING"
            );
          }

          const payment =
            await transaction.payment.create({
              data: {
                amount,

                concept:
                  concept ||
                  `Pago de presupuesto - ${budget.patient.lastName}, ${budget.patient.firstName}`,

                paymentMethod,

                status: "PAID",

                dueDate: paidAt,
                paidAt,

                patientId:
                  budget.patientId,

                budgetId:
                  budget.id,
              },
            });

          const newPaidAmount =
            currentPaidAmount + amount;

          const newRemainingAmount =
            Math.max(
              budgetTotal -
                newPaidAmount,
              0
            );

          const newStatus =
            newRemainingAmount <= 0
              ? "COMPLETED"
              : "IN_PROGRESS";

          const updatedBudget =
            await transaction.budget.update({
              where: {
                id: budget.id,
              },

              data: {
                status: newStatus,
              },

              include: {
                patient: {
                  include: {
                    plan: true,
                    branch: true,
                  },
                },

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
            });

          return {
            payment,

            budget: {
              ...updatedBudget,

              subtotal: Number(
                updatedBudget.subtotal
              ),

              discount: Number(
                updatedBudget.discount
              ),

              total: Number(
                updatedBudget.total
              ),

              doctors:
                updatedBudget.doctors.map(
                  ({ doctor }) => ({
                    id: doctor.id,

                    name:
                      doctor.name ||
                      doctor.user?.name ||
                      "Especialista sin nombre",

                    specialty:
                      doctor.specialty,

                    professionalLicense:
                      doctor.professionalLicense,
                  })
                ),

              paidAmount:
                newPaidAmount,

              remainingAmount:
                newRemainingAmount,

              status:
                newStatus,
            },
          };
        }
      );

    return NextResponse.json(
      result,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error registrando pago:",
      error
    );

    if (
      error instanceof Error &&
      error.message ===
        "BUDGET_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error:
            "Presupuesto no encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      error instanceof Error &&
      error.message === "FORBIDDEN"
    ) {
      return NextResponse.json(
        {
          error:
            "No tenés permisos para registrar pagos en este presupuesto.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "BUDGET_COMPLETED"
    ) {
      return NextResponse.json(
        {
          error:
            "Este presupuesto ya está completamente pagado.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "AMOUNT_EXCEEDS_REMAINING"
    ) {
      return NextResponse.json(
        {
          error:
            "El monto ingresado supera el saldo pendiente.",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "No se pudo registrar el pago.",
      },
      {
        status: 500,
      }
    );
  }
}