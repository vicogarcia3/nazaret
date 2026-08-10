import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(
  req: Request,
  context: RouteContext
) {
  const session = await auth();

  if (
    !session ||
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
  const body = await req.json();

  try {
    const firstName = String(
      body.firstName || ""
    ).trim();

    const lastName = String(
      body.lastName || ""
    ).trim();

    const dni = String(
      body.dni || ""
    ).trim();

    const phone = String(
      body.phone || ""
    ).trim();

    const email = String(
      body.email || ""
    )
      .trim()
      .toLowerCase();

    const branchId = String(
      body.branchId || ""
    ).trim();

    const planId =
      typeof body.planId === "string" &&
      body.planId.trim()
        ? body.planId.trim()
        : null;

    if (
      !firstName ||
      !lastName ||
      !dni ||
      !phone ||
      !branchId
    ) {
      return NextResponse.json(
        {
          error:
            "Completá todos los campos obligatorios.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      email &&
      !EMAIL_REGEX.test(email)
    ) {
      return NextResponse.json(
        {
          error:
            "Ingresá un correo electrónico válido.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Verificamos que el paciente exista.
     */
    const existingPatient =
      await prisma.patient.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          userId: true,
          email: true,
        },
      });

    if (!existingPatient) {
      return NextResponse.json(
        {
          error:
            "El paciente no existe.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * No permitimos que otro paciente
     * tenga el mismo email.
     */
    if (email) {
      const patientWithSameEmail =
        await prisma.patient.findFirst({
          where: {
            id: {
              not: id,
            },
            email: {
              equals: email,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
          },
        });

      if (patientWithSameEmail) {
        return NextResponse.json(
          {
            error:
              "Ya existe otro paciente registrado con ese email.",
          },
          {
            status: 409,
          }
        );
      }
    }

    /*
     * También evitamos duplicar DNI.
     */
    const patientWithSameDni =
      await prisma.patient.findFirst({
        where: {
          id: {
            not: id,
          },
          dni,
        },
        select: {
          id: true,
        },
      });

    if (patientWithSameDni) {
      return NextResponse.json(
        {
          error:
            "Ya existe otro paciente registrado con ese DNI.",
        },
        {
          status: 409,
        }
      );
    }

    const branch =
      await prisma.branch.findFirst({
        where: {
          id: branchId,
          active: true,
        },
        select: {
          id: true,
        },
      });

    if (!branch) {
      return NextResponse.json(
        {
          error:
            "La sucursal seleccionada no es válida.",
        },
        {
          status: 400,
        }
      );
    }

    if (planId) {
      const plan =
        await prisma.plan.findUnique({
          where: {
            id: planId,
          },
          select: {
            id: true,
          },
        });

      if (!plan) {
        return NextResponse.json(
          {
            error:
              "El plan seleccionado no es válido.",
          },
          {
            status: 400,
          }
        );
      }
    }

    const patient =
      await prisma.$transaction(
        async (tx) => {
          const updatedPatient =
            await tx.patient.update({
              where: {
                id,
              },
              data: {
                firstName,
                lastName,
                dni,
                phone,
                email,
                branchId,
                planId,
              },
              include: {
                branch: true,
                plan: true,
                user: true,
              },
            });

          /*
           * Si el paciente ya tiene una cuenta vinculada,
           * mantenemos sincronizado su email de acceso.
           */
          if (
            existingPatient.userId &&
            existingPatient.email?.toLowerCase() !==
              email
          ) {
            const userWithSameEmail =
              await tx.user.findUnique({
                where: {
                  email,
                },
                select: {
                  id: true,
                },
              });

            if (
              userWithSameEmail &&
              userWithSameEmail.id !==
                existingPatient.userId
            ) {
              throw new Error(
                "USER_EMAIL_ALREADY_EXISTS"
              );
            }

            await tx.user.update({
              where: {
                id: existingPatient.userId,
              },
              data: {
                email,
                name: `${firstName} ${lastName}`,
              },
            });
          }

          return updatedPatient;
        }
      );

    return NextResponse.json(patient);
  } catch (error) {
    console.error(
      "Error al actualizar paciente:",
      error
    );

    if (
      error instanceof Error &&
      error.message ===
        "USER_EMAIL_ALREADY_EXISTS"
    ) {
      return NextResponse.json(
        {
          error:
            "Ese email ya está asociado a otra cuenta de usuario.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "No se pudieron guardar los cambios del paciente.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _req: Request,
  context: RouteContext
) {
  const session = await auth();

  if (
    !session ||
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

  try {
    const patient =
      await prisma.patient.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          userId: true,
        },
      });

    if (!patient) {
      return NextResponse.json(
        {
          error:
            "El paciente ya fue eliminado o no existe.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.$transaction(
      async (tx) => {
        /*
         * Buscamos presupuestos del paciente.
         */
        const budgets =
          await tx.budget.findMany({
            where: {
              patientId: id,
            },
            select: {
              id: true,
            },
          });

        const budgetIds =
          budgets.map(
            (budget) => budget.id
          );

        /*
         * Pagos.
         */
        await tx.payment.deleteMany({
          where: {
            patientId: id,
          },
        });

        /*
         * Relaciones presupuesto-especialistas.
         *
         * Ahora son necesarias porque Budget
         * tiene múltiples profesionales.
         */
        if (budgetIds.length > 0) {
          await tx.budgetDoctor.deleteMany({
            where: {
              budgetId: {
                in: budgetIds,
              },
            },
          });

          await tx.budgetItem.deleteMany({
            where: {
              budgetId: {
                in: budgetIds,
              },
            },
          });
        }

        /*
         * Notificaciones asociadas al paciente
         * se eliminan antes de los presupuestos.
         */
        await tx.notification.deleteMany({
          where: {
            patientId: id,
          },
        });

        /*
         * Presupuestos.
         */
        await tx.budget.deleteMany({
          where: {
            patientId: id,
          },
        });

        /*
         * Turnos.
         */
        await tx.appointment.deleteMany({
          where: {
            patientId: id,
          },
        });

        /*
         * Testimonios.
         */
        await tx.testimonial.deleteMany({
          where: {
            patientId: id,
          },
        });

        /*
        * Historia clínica.
        * Eliminamos primero sus entradas
        * y luego la historia clínica principal.
        */
        const histories =
          await tx.clinicalHistory.findMany({
            where: {
              patientId: id,
            },
            select: {
              id: true,
            },
          });

        const historyIds =
          histories.map(
            (history) => history.id
          );

        if (historyIds.length > 0) {
          await tx.clinicalHistoryEntry.deleteMany({
            where: {
              clinicalHistoryId: {
                in: historyIds,
              },
            },
          });
        }

        await tx.clinicalHistory.deleteMany({
          where: {
            patientId: id,
          },
        });

        /*
         * Odontograma.
         */
        await tx.odontogram.deleteMany({
          where: {
            patientId: id,
          },
        });

        /*
         * Finalmente eliminamos al paciente.
         */
        await tx.patient.delete({
          where: {
            id,
          },
        });

        /*
         * Si tenía cuenta vinculada,
         * eliminamos también el User.
         */
        if (patient.userId) {
          await tx.user.delete({
            where: {
              id: patient.userId,
            },
          });
        }
      }
    );

    return NextResponse.json({
      message:
        "Paciente y todos sus datos asociados fueron eliminados correctamente.",
    });
  } catch (error) {
    console.error(
      "Error al eliminar paciente:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo eliminar completamente el paciente.",
      },
      {
        status: 500,
      }
    );
  }
}