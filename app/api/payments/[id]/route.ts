import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function createReceiptNumber(
  paymentId: string,
  issuedAt: Date
) {
  const year = issuedAt.getFullYear();
  const month = String(
    issuedAt.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    issuedAt.getDate()
  ).padStart(2, "0");

  const paymentReference = paymentId
    .slice(-8)
    .toUpperCase();

  return `REC-${year}${month}${day}-${paymentReference}`;
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      session.user.role !== "ADMIN"
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

    const { id } = await context.params;

    const payment =
      await prisma.payment.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          receiptNumber: true,
        },
      });

    if (!payment) {
      return NextResponse.json(
        {
          error: "El pago no existe.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Conviene impedir la eliminación de pagos que ya tienen
     * un comprobante emitido, para no perder el registro.
     */
    if (payment.receiptNumber) {
      return NextResponse.json(
        {
          error:
            "Este pago ya tiene un comprobante emitido y no puede eliminarse.",
        },
        {
          status: 409,
        }
      );
    }

    await prisma.payment.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Pago eliminado",
    });
  } catch (error) {
    console.error(
      "Error eliminando pago:",
      error
    );

    return NextResponse.json(
      {
        error: "No se pudo eliminar el pago.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      session.user.role !== "ADMIN"
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

    const { id } = await context.params;
    const body = await request.json();

    const existingPayment =
      await prisma.payment.findUnique({
        where: {
          id,
        },
        include: {
          patient: {
            include: {
              branch: true,
            },
          },
          budget: {
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
              payments: {
                where: {
                  status: "PAID",
                  id: {
                    not: id,
                  },
                },
                select: {
                  amount: true,
                },
              },
            },
          },
        },
      });

    if (!existingPayment) {
      return NextResponse.json(
        {
          error: "El pago no existe.",
        },
        {
          status: 404,
        }
      );
    }

    const nextStatus =
      body.status ?? existingPayment.status;

    const nextAmount =
      body.amount !== undefined &&
      body.amount !== null &&
      body.amount !== ""
        ? Number(body.amount)
        : Number(existingPayment.amount);

    if (
      !Number.isFinite(nextAmount) ||
      nextAmount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "El importe del pago debe ser mayor que cero.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * El comprobante se genera solamente la primera vez que
     * el pago pasa a PAID.
     */
    const shouldIssueReceipt =
      nextStatus === "PAID" &&
      !existingPayment.receiptNumber;

    const now = new Date();

    const paidAt =
      nextStatus === "PAID"
        ? existingPayment.paidAt ?? now
        : existingPayment.paidAt;

    let receiptNumber:
      | string
      | undefined;

    let receiptIssuedAt:
      | Date
      | undefined;

    let receiptData:
      | Prisma.InputJsonValue
      | undefined;

    if (shouldIssueReceipt) {
      receiptNumber = createReceiptNumber(
        existingPayment.id,
        now
      );

      receiptIssuedAt = now;

      const previousPaidAmount =
        existingPayment.budget?.payments.reduce(
          (total, payment) =>
            total + Number(payment.amount),
          0
        ) ?? 0;

      const paidAmountAfterPayment =
        previousPaidAmount + nextAmount;

      const budgetTotal =
        existingPayment.budget
          ? Number(existingPayment.budget.total)
          : null;

      const remainingBalance =
        budgetTotal !== null
          ? Math.max(
              budgetTotal -
                paidAmountAfterPayment,
              0
            )
          : null;

      const doctorNames =
        existingPayment.budget?.doctors
          .map(
            ({ doctor }) =>
              doctor.name ||
              doctor.user?.name ||
              "Profesional"
          )
          .join(", ") || "Profesional no informado";

      receiptData = {
        receiptNumber,
        issuedAt: now.toISOString(),
        paidAt: paidAt?.toISOString() ?? null,

        patient: {
          id: existingPayment.patient.id,
          name: `${existingPayment.patient.firstName} ${existingPayment.patient.lastName}`,
          dni: existingPayment.patient.dni ?? null,
          email: existingPayment.patient.email ?? null,
          phone: existingPayment.patient.phone,
        },

        branch: {
          id: existingPayment.patient.branch.id,
          name: existingPayment.patient.branch.name,
          address: existingPayment.patient.branch.address,
          city: existingPayment.patient.branch.city,
          phone: existingPayment.patient.branch.phone ?? null,
        },

        professional: {
          name: doctorNames,
          license:
            existingPayment.budget?.doctors
              .map(({ doctor }) => doctor.professionalLicense)
              .filter(Boolean)
              .join(", ") || null,
        },

        budget: existingPayment.budget
          ? {
              id: existingPayment.budget.id,
              description:
                existingPayment.budget.description ?? null,
              total: budgetTotal,
            }
          : null,

        payment: {
          id: existingPayment.id,
          concept:
            body.concept ??
            existingPayment.concept ??
            "Entrega de pago",
          amount: nextAmount,
          paymentMethod:
            body.paymentMethod ??
            existingPayment.paymentMethod ??
            "No informado",
        },

        amounts: {
          previousPaidAmount,
          paymentAmount: nextAmount,
          paidAmountAfterPayment,
          remainingBalance,
        },

        disclaimer:
          "Comprobante interno de pago. No válido como factura fiscal.",
      } satisfies Prisma.InputJsonValue;
    }

    const payment =
      await prisma.payment.update({
        where: {
          id,
        },
        data: {
          amount:
            body.amount !== undefined &&
            body.amount !== null &&
            body.amount !== ""
              ? nextAmount
              : undefined,

          concept:
            body.concept !== undefined
              ? body.concept
              : undefined,

          dueDate: body.dueDate
            ? new Date(body.dueDate)
            : undefined,

          paymentMethod:
            body.paymentMethod !== undefined
              ? body.paymentMethod
              : undefined,

          status: nextStatus,

          paidAt,

          receiptNumber,

          receiptIssuedAt,

          receiptData,
        },
      });

    return NextResponse.json({
      payment,
      receiptCreated:
        shouldIssueReceipt,
      receiptNumber:
        payment.receiptNumber,
    });
  } catch (error) {
    console.error(
      "Error actualizando pago:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo actualizar el pago.",
      },
      {
        status: 500,
      }
    );
  }
}