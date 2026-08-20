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
          error:
            "Paciente no encontrado",
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
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    const serializedBudgets =
      budgets.map((budget) => ({
        id: budget.id,

        subtotal:
          Number(budget.subtotal),

        discount:
          Number(budget.discount),

        total:
          Number(budget.total),

        createdAt:
          budget.createdAt.toISOString(),

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

              total:
                Number(item.total),
            })
          ),
      }));

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