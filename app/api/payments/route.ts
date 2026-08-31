import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

import { prisma } from "@/lib/prisma";

async function getAuthenticatedDoctor(userId: string) {
  return prisma.doctor.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      name: true,
    },
  });
}

async function doctorCanAccessPatient(
  userId: string,
  patientId: string
) {
  const doctor = await getAuthenticatedDoctor(userId);

  if (!doctor) {
    return {
      allowed: false,
      doctor: null,
    };
  }

  const patient = await prisma.patient.findFirst({
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

  return {
    allowed: Boolean(patient),
    doctor,
  };
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "DOCTOR"
  ) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 403 }
    );
  }

  try {
    let where;

    if (session.user.role === "ADMIN") {
      where = undefined;
    } else {
      const doctor = await getAuthenticatedDoctor(
        session.user.id
      );

      if (!doctor) {
        return NextResponse.json(
          {
            error:
              "No se encontró el perfil profesional.",
          },
          { status: 404 }
        );
      }

      where = {
        patient: {
          histories: {
            some: {
              data: {
                path: ["odontologo"],
                equals: doctor.name,
              },
            },
          },
        },
      };
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        patient: {
          include: {
            branch: true,
            plan: true,
          },
        },
        budget: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error(
      "Error obteniendo pagos:",
      error
    );

    return NextResponse.json(
      {
        error: "No se pudieron obtener los pagos.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "DOCTOR"
  ) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    const patientId =
      typeof body.patientId === "string"
        ? body.patientId.trim()
        : "";

    const budgetId = body.budgetId
      ? String(body.budgetId)
      : null;

    const amount = Number(body.amount);

    const status =
      body.status === "PAID"
        ? "PAID"
        : "PENDING";

    if (!patientId) {
      return NextResponse.json(
        {
          error: "El paciente es obligatorio.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Ingresá un monto válido mayor a cero.",
        },
        { status: 400 }
      );
    }

    if (!body.dueDate) {
      return NextResponse.json(
        {
          error: "La fecha es obligatoria.",
        },
        { status: 400 }
      );
    }

    const patient =
      await prisma.patient.findUnique({
        where: {
          id: patientId,
        },
        select: {
          id: true,
        },
      });

    if (!patient) {
      return NextResponse.json(
        {
          error: "El paciente no existe.",
        },
        { status: 404 }
      );
    }

    /*
     * =====================================================
     * DOCTOR
     * =====================================================
     *
     * El doctor solamente puede registrar pagos
     * de sus propios pacientes.
     *
     * También obtenemos el nombre del especialista
     * para utilizarlo en la notificación.
     */

    let authenticatedDoctor = null;

    if (session.user.role === "DOCTOR") {
      authenticatedDoctor =
        await getAuthenticatedDoctor(
          session.user.id
        );

      if (!authenticatedDoctor) {
        return NextResponse.json(
          {
            error:
              "No se encontró el perfil profesional.",
          },
          { status: 404 }
        );
      }

      const access =
        await doctorCanAccessPatient(
          session.user.id,
          patientId
        );

      if (!access.allowed) {
        return NextResponse.json(
          {
            error:
              "No tenés permiso para administrar pagos de este paciente.",
          },
          { status: 403 }
        );
      }
    }

    const payment =
      await prisma.$transaction(
        async (transaction) => {
          /*
           * =================================================
           * VALIDACIÓN DEL PRESUPUESTO
           * =================================================
           */

          if (budgetId) {
            const budget =
              await transaction.budget.findUnique({
                where: {
                  id: budgetId,
                },
                include: {
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
              budget.patientId !== patientId
            ) {
              throw new Error(
                "INVALID_BUDGET_PATIENT"
              );
            }

            /*
             * El especialista también debe poder
             * administrar el presupuesto asociado.
             */

            if (
              session.user.role === "DOCTOR"
            ) {
              const access =
                await doctorCanAccessPatient(
                  session.user.id,
                  patientId
                );

              if (!access.allowed) {
                throw new Error(
                  "BUDGET_NOT_ALLOWED"
                );
              }
            }

            const total =
              Number(budget.total);

            const currentPaidAmount =
              budget.payments.reduce(
                (
                  accumulator,
                  currentPayment
                ) =>
                  accumulator +
                  Number(
                    currentPayment.amount
                  ),
                0
              );

            const remainingAmount =
              Math.max(
                total -
                  currentPaidAmount,
                0
              );

            if (
              status === "PAID" &&
              amount > remainingAmount
            ) {
              throw new Error(
                `AMOUNT_EXCEEDS_REMAINING:${remainingAmount}`
              );
            }
          }

          /*
           * =================================================
           * CREAR PAGO
           * =================================================
           */

          const createdPayment =
            await transaction.payment.create({
              data: {
                patientId,
                budgetId,
                amount,

                concept:
                  typeof body.concept ===
                    "string" &&
                  body.concept.trim()
                    ? body.concept.trim()
                    : null,

                dueDate: new Date(
                  `${body.dueDate}T12:00:00`
                ),

                status,

                paidAt:
                  status === "PAID"
                    ? new Date()
                    : null,

                paymentMethod:
                  typeof body.paymentMethod ===
                    "string" &&
                  body.paymentMethod.trim()
                    ? body.paymentMethod.trim()
                    : null,
              },
            });

          /*
           * =================================================
           * NOTIFICACIÓN AL PACIENTE
           * =================================================
           *
           * Solamente se crea cuando un DOCTOR registra
           * un pago efectivamente cobrado.
           */

          if (
            status === "PAID" &&
            session.user.role === "DOCTOR" &&
            authenticatedDoctor
          ) {
            await transaction.notification.create({
              data: {
                patientId,
                paymentId: createdPayment.id,
                type: "PAYMENT",
                actor: "DOCTOR",
                title: "Nuevo pago registrado",
                message:
                  `${authenticatedDoctor.name} registró un nuevo pago. Podés descargar el comprobante en "Pagos".`,
                actionUrl:
                  "/dashboard/patient/pagos",
              },
            });
          }

          /*
           * =================================================
           * ACTUALIZAR ESTADO DEL PRESUPUESTO
           * =================================================
           */

          if (budgetId) {
            const budget =
              await transaction.budget.findUnique({
                where: {
                  id: budgetId,
                },
                include: {
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

            if (budget) {
              const total =
                Number(budget.total);

              const totalPaid =
                budget.payments.reduce(
                  (
                    accumulator,
                    currentPayment
                  ) =>
                    accumulator +
                    Number(
                      currentPayment.amount
                    ),
                  0
                );

              const budgetStatus =
                totalPaid >= total
                  ? "COMPLETED"
                  : totalPaid > 0
                  ? "IN_PROGRESS"
                  : "CREATED";

              await transaction.budget.update({
                where: {
                  id: budget.id,
                },
                data: {
                  status: budgetStatus,
                },
              });
            }
          }

          return createdPayment;
        }
      );

    return NextResponse.json(
      {
        message:
          "Pago registrado correctamente.",
        payment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Error registrando pago:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    if (
      message === "BUDGET_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error:
            "El presupuesto seleccionado no existe.",
        },
        { status: 404 }
      );
    }

    if (
      message ===
      "INVALID_BUDGET_PATIENT"
    ) {
      return NextResponse.json(
        {
          error:
            "El presupuesto seleccionado no pertenece a este paciente.",
        },
        { status: 400 }
      );
    }

    if (
      message === "BUDGET_NOT_ALLOWED"
    ) {
      return NextResponse.json(
        {
          error:
            "No tenés permiso para administrar este presupuesto.",
        },
        { status: 403 }
      );
    }

    if (
      message.startsWith(
        "AMOUNT_EXCEEDS_REMAINING:"
      )
    ) {
      const remainingAmount =
        Number(
          message.split(":")[1]
        );

      const formattedRemainingAmount =
        new Intl.NumberFormat(
          "es-AR",
          {
            style: "currency",
            currency: "ARS",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }
        ).format(
          remainingAmount
        );

      return NextResponse.json(
        {
          error: `El monto no puede superar el saldo pendiente de ${formattedRemainingAmount}.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          "No se pudo registrar el pago.",
      },
      { status: 500 }
    );
  }
}