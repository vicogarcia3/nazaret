import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (
      !session ||
      session.user.role !== "PATIENT"
    ) {
      return NextResponse.json(
        {
          error: "No autorizado",
        },
        {
          status: 401,
        }
      );
    }

    const patient =
      await prisma.patient.findUnique({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
        },
      });

    if (!patient) {
      return NextResponse.json(
        {
          error: "Paciente no encontrado",
        },
        {
          status: 404,
        }
      );
    }

    const budgets =
      await prisma.budget.findMany({
        where: {
          patientId: patient.id,
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

        orderBy: {
          createdAt: "desc",
        },
      });

    const serializedBudgets =
      budgets.map((budget) => {
        const total =
          Number(budget.total);

        const paidAmount =
          budget.payments.reduce(
            (sum, payment) =>
              sum + Number(payment.amount),
            0
          );

        const remainingAmount =
          Math.max(
            total - paidAmount,
            0
          );

        const status =
          paidAmount >= total
            ? "COMPLETED"
            : "PENDING";

        return {
          id: budget.id,

          subtotal:
            Number(budget.subtotal),

          discount:
            Number(budget.discount),

          total,

          createdAt:
            budget.createdAt.toISOString(),

          status,

          paidAmount,

          remainingAmount,

          doctors:
            budget.doctors.map(
              ({ doctor }) => ({
                id: doctor.id,

                name:
                  doctor.name,

                user: doctor.user
                  ? {
                      name:
                        doctor.user.name,
                    }
                  : null,
              })
            ),

          items:
            budget.items.map(
              (item) => ({
                id: item.id,

                serviceName:
                  item.serviceName,

                quantity:
                  item.quantity,

                unitPrice:
                  Number(item.unitPrice),

                total:
                  Number(item.total),
              })
            ),

          payments:
            budget.payments.map(
              (payment) => ({
                id: payment.id,

                amount:
                  Number(payment.amount),

                concept:
                  payment.concept,

                paymentMethod:
                  payment.paymentMethod,

                paidAt:
                  payment.paidAt
                    ? payment.paidAt.toISOString()
                    : null,

                createdAt:
                  payment.createdAt.toISOString(),
              })
            ),
        };
      });

    return NextResponse.json(
      serializedBudgets
    );
  } catch (error) {
    console.error(
      "Error cargando presupuestos del paciente:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron cargar los presupuestos.",
      },
      {
        status: 500,
      }
    );
  }
}