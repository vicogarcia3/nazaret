import { prisma } from "@/lib/prisma";

import { auth } from "@/lib/auth";

import { NextResponse } from "next/server";

async function doctorCanAccessPatient(
  userId: string,
  patientId: string
) {
  const doctor =
    await prisma.doctor.findUnique({
      where: {
        userId,
      },
      select: {
        id: true,
        name: true,
      },
    });

  if (!doctor) {
    return false;
  }

  const patient =
    await prisma.patient.findFirst({
      where: {
        id: patientId,

        histories: {
          some: {
            data: {
              path: ["odontologo"],
              equals: doctor.name,
            },
          },
        },
      },

      select: {
        id: true,
      },
    });

  return Boolean(patient);
}

export async function PUT(
  req: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      {
        error: "No autorizado",
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
        error: "No autorizado",
      },
      {
        status: 403,
      }
    );
  }

  const { id } =
    await context.params;

  const existingPayment =
    await prisma.payment.findUnique({
      where: {
        id,
      },
      include: {
        budget: true,
      },
    });

  if (!existingPayment) {
    return NextResponse.json(
      {
        error:
          "El pago no existe.",
      },
      {
        status: 404,
      }
    );
  }

  /*
   * DOCTOR:
   * solamente puede marcar como pagado
   * un pago perteneciente a un paciente
   * que esté vinculado a él mediante
   * la Historia Clínica.
   */
  if (
    session.user.role === "DOCTOR"
  ) {
    const allowed =
      await doctorCanAccessPatient(
        session.user.id,
        existingPayment.patientId
      );

    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "No tenés permiso para administrar este pago.",
        },
        {
          status: 403,
        }
      );
    }
  }

  const payment =
    await prisma.payment.update({
      where: {
        id,
      },

      data: {
        status: "PAID",

        paidAt:
          new Date(),
      },
    });

  if (payment.budgetId) {
    const budget =
      await prisma.budget.findUnique({
        where: {
          id: payment.budgetId,
        },
      });

    if (budget) {
      const paidPayments =
        await prisma.payment.findMany(
          {
            where: {
              budgetId:
                payment.budgetId,

              status:
                "PAID",
            },
          }
        );

      const totalPaid =
        paidPayments.reduce(
          (acc, item) =>
            acc +
            Number(
              item.amount
            ),
          0
        );

      const budgetTotal =
        Number(
          budget.total
        );

      const newStatus =
        totalPaid >=
        budgetTotal
          ? "COMPLETED"
          : totalPaid > 0
            ? "IN_PROGRESS"
            : "CREATED";

      await prisma.budget.update({
        where: {
          id:
            payment.budgetId,
        },

        data: {
          status:
            newStatus,
        },
      });
    }
  }

  return NextResponse.json(
    payment
  );
}