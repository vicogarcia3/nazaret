import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type BudgetItemInput = {
  serviceName?: string;
  unitPrice?: number;
};

type UpdateBudgetBody = {
  patientId?: string;
  doctorIds?: string[];
  items?: BudgetItemInput[];
};

/* =========================================================
   PATCH - EDITAR PRESUPUESTO
========================================================= */

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (
      !session?.user?.id ||
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error:
            "El identificador del presupuesto no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      (await request.json()) as UpdateBudgetBody;

    const patientId =
      typeof body.patientId === "string"
        ? body.patientId.trim()
        : "";

    const doctorIds = Array.from(
      new Set(
        Array.isArray(body.doctorIds)
          ? body.doctorIds
              .filter(
                (
                  doctorId
                ): doctorId is string =>
                  typeof doctorId === "string"
              )
              .map((doctorId) =>
                doctorId.trim()
              )
              .filter(Boolean)
          : []
      )
    );

    const items = Array.isArray(
      body.items
    )
      ? body.items
      : [];

    /* VALIDACIONES */

    if (!patientId) {
      return NextResponse.json(
        {
          error:
            "El paciente es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    if (doctorIds.length === 0) {
      return NextResponse.json(
        {
          error:
            "Seleccioná al menos un especialista.",
        },
        {
          status: 400,
        }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        {
          error:
            "Agregá al menos un tratamiento.",
        },
        {
          status: 400,
        }
      );
    }

    const normalizedItems =
      items.map((item) => {
        const serviceName =
          typeof item.serviceName ===
          "string"
            ? item.serviceName.trim()
            : "";

        const unitPrice = Number(
          item.unitPrice
        );

        return {
          serviceName,
          unitPrice,
        };
      });

    const invalidItem =
      normalizedItems.some(
        (item) =>
          !item.serviceName ||
          !Number.isFinite(
            item.unitPrice
          ) ||
          item.unitPrice < 0
      );

    if (invalidItem) {
      return NextResponse.json(
        {
          error:
            "Todos los tratamientos deben tener una descripción y un precio válido.",
        },
        {
          status: 400,
        }
      );
    }

    /* PRESUPUESTO ACTUAL */

    const currentBudget =
      await prisma.budget.findUnique({
        where: {
          id,
        },

        include: {
          payments: {
            where: {
              status: "PAID",
            },
          },
        },
      });

    if (!currentBudget) {
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
      currentBudget.patientId !==
      patientId
    ) {
      return NextResponse.json(
        {
          error:
            "El presupuesto no pertenece al paciente indicado.",
        },
        {
          status: 400,
        }
      );
    }

    /* PACIENTE Y DESCUENTO */

    const patient =
      await prisma.patient.findUnique({
        where: {
          id: patientId,
        },

        include: {
          plan: true,
        },
      });

    if (!patient) {
      return NextResponse.json(
        {
          error:
            "Paciente no encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const discount =
      patient.plan?.visible
        ? Number(
            patient.plan.discount
          )
        : 0;

    /* ESPECIALISTAS */

    const validDoctors =
      await prisma.doctor.findMany({
        where: {
          id: {
            in: doctorIds,
          },

          active: true,
        },

        select: {
          id: true,
        },
      });

    if (
      validDoctors.length !==
      doctorIds.length
    ) {
      return NextResponse.json(
        {
          error:
            "Uno o más especialistas seleccionados no existen o están inactivos.",
        },
        {
          status: 400,
        }
      );
    }

    /* TOTALES */

    const subtotal =
      normalizedItems.reduce(
        (
          accumulator,
          item
        ) =>
          accumulator +
          item.unitPrice,
        0
      );

    const discountAmount =
      subtotal *
      (discount / 100);

    const total =
      subtotal - discountAmount;

    const paidAmount =
      currentBudget.payments.reduce(
        (
          accumulator,
          payment
        ) =>
          accumulator +
          Number(payment.amount),
        0
      );

    /*
     * No dejamos editar el presupuesto
     * por debajo de lo que ya fue pagado.
     */
    if (total < paidAmount) {
      return NextResponse.json(
        {
          error: `No podés reducir el presupuesto a $${total.toLocaleString(
            "es-AR"
          )} porque el paciente ya abonó $${paidAmount.toLocaleString(
            "es-AR"
          )}.`,
        },
        {
          status: 400,
        }
      );
    }

    const status =
      total > 0 &&
      paidAmount >= total
        ? "COMPLETED"
        : paidAmount > 0
        ? "IN_PROGRESS"
        : "CREATED";

    /* ACTUALIZACIÓN */

    const updatedBudget =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Reemplazamos especialistas.
           */
          await tx.budgetDoctor.deleteMany(
            {
              where: {
                budgetId: id,
              },
            }
          );

          await tx.budgetDoctor.createMany(
            {
              data: doctorIds.map(
                (doctorId) => ({
                  budgetId: id,
                  doctorId,
                })
              ),
            }
          );

          /*
           * Reemplazamos tratamientos.
           */
          await tx.budgetItem.deleteMany({
            where: {
              budgetId: id,
            },
          });

          await tx.budgetItem.createMany({
            data: normalizedItems.map(
              (item) => ({
                budgetId: id,

                serviceName:
                  item.serviceName,

                quantity: 1,

                unitPrice:
                  item.unitPrice,

                total:
                  item.unitPrice,
              })
            ),
          });

          return tx.budget.update({
            where: {
              id,
            },

            data: {
              subtotal,
              discount,
              total,
              status,
            },

            include: {
              items: true,

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
                },

                orderBy: [
                  {
                    paidAt: "desc",
                  },
                  {
                    createdAt:
                      "desc",
                  },
                ],
              },
            },
          });
        }
      );

    return NextResponse.json({
      success: true,
      budget: updatedBudget,
      message:
        "Presupuesto actualizado correctamente.",
    });
  } catch (error) {
    console.error(
      "Error actualizando presupuesto:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo actualizar el presupuesto.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE - ELIMINAR PRESUPUESTO
========================================================= */

export async function DELETE(
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
            "No tenés permisos para eliminar presupuestos.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error:
            "El identificador del presupuesto no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    const budget =
      await prisma.budget.findUnique({
        where: {
          id,
        },

        select: {
          id: true,

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
          error:
            "El presupuesto no fue encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      session.user.role === "DOCTOR"
    ) {
      const doctor =
        await prisma.doctor.findUnique({
          where: {
            userId:
              session.user.id,
          },

          select: {
            id: true,
          },
        });

      if (!doctor) {
        return NextResponse.json(
          {
            error:
              "No se encontró el perfil profesional.",
          },
          {
            status: 404,
          }
        );
      }

      const doctorBelongsToBudget =
        budget.doctors.some(
          (budgetDoctor) =>
            budgetDoctor.doctorId ===
            doctor.id
        );

      if (
        !doctorBelongsToBudget
      ) {
        return NextResponse.json(
          {
            error:
              "No tenés permisos para eliminar este presupuesto.",
          },
          {
            status: 403,
          }
        );
      }
    }

    await prisma.$transaction(
      async (tx) => {
        /*
         * Primero verificamos pagos.
         */
        const paymentCount =
          await tx.payment.count({
            where: {
              budgetId:
                budget.id,
            },
          });

        if (paymentCount > 0) {
          throw new Error(
            "BUDGET_HAS_PAYMENTS"
          );
        }

        /*
         * Eliminamos asociaciones
         * con especialistas.
         */
        await tx.budgetDoctor.deleteMany(
          {
            where: {
              budgetId:
                budget.id,
            },
          }
        );

        /*
         * Eliminamos ítems.
         */
        await tx.budgetItem.deleteMany({
          where: {
            budgetId:
              budget.id,
          },
        });

        /*
         * Finalmente presupuesto.
         */
        await tx.budget.delete({
          where: {
            id:
              budget.id,
          },
        });
      }
    );

    return NextResponse.json({
      message:
        "Presupuesto eliminado correctamente.",
    });
  } catch (error) {
    console.error(
      "Error eliminando presupuesto:",
      error
    );

    if (
      error instanceof Error &&
      error.message ===
        "BUDGET_HAS_PAYMENTS"
    ) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar un presupuesto que ya tiene pagos registrados.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "No se pudo eliminar el presupuesto.",
      },
      {
        status: 500,
      }
    );
  }
}