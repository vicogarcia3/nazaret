import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeNullableText(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue || null;
}

function normalizeBranchIds(
  value: unknown
): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return Array.from(
    new Set(
      value.filter(
        (branchId): branchId is string =>
          typeof branchId === "string" &&
          branchId.trim().length > 0
      )
    )
  );
}

/**
 * Cambia solamente estados simples del especialista.
 * Se usa, por ejemplo, para el checkbox "Visible".
 */
export async function PATCH(
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
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const data: {
      visible?: boolean;
      active?: boolean;
    } = {};

    if (typeof body.visible === "boolean") {
      data.visible = body.visible;
    }

    if (typeof body.active === "boolean") {
      data.active = body.active;
    }

    if (
      data.visible === undefined &&
      data.active === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "No se enviaron cambios válidos.",
        },
        {
          status: 400,
        }
      );
    }

    const existingDoctor =
      await prisma.doctor.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      });

    if (!existingDoctor) {
      return NextResponse.json(
        {
          error:
            "El especialista no fue encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const updatedDoctor =
      await prisma.doctor.update({
        where: {
          id,
        },
        data,
        include: {
          user: true,
          branches: {
            include: {
              branch: true,
            },
          },
        },
      });

    return NextResponse.json({
      message:
        "Estado del especialista actualizado correctamente.",
      doctor: updatedDoctor,
    });
  } catch (error) {
    console.error(
      "Error actualizando el estado del especialista:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo actualizar el especialista.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * Edita la ficha pública del especialista
 * en la sección Equipo.
 */
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
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const existingDoctor =
      await prisma.doctor.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      });

    if (!existingDoctor) {
      return NextResponse.json(
        {
          error:
            "El especialista no fue encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      normalizeNullableText(
        body.email
      )?.toLowerCase() ?? null;

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Ingresá el nombre completo.",
        },
        {
          status: 400,
        }
      );
    }

    if (email) {
      const doctorWithSameEmail =
        await prisma.doctor.findFirst({
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

      if (doctorWithSameEmail) {
        return NextResponse.json(
          {
            error:
              "Ya existe otro especialista registrado con ese email.",
          },
          {
            status: 409,
          }
        );
      }
    }

    const branchIds =
      normalizeBranchIds(
        body.branchIds
      );

    if (
      branchIds !== undefined &&
      branchIds.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Seleccioná al menos una sucursal.",
        },
        {
          status: 400,
        }
      );
    }

    if (branchIds !== undefined) {
      const existingBranchesCount =
        await prisma.branch.count({
          where: {
            id: {
              in: branchIds,
            },
            active: true,
          },
        });

      if (
        existingBranchesCount !==
        branchIds.length
      ) {
        return NextResponse.json(
          {
            error:
              "Una o más sucursales seleccionadas no existen o están inactivas.",
          },
          {
            status: 400,
          }
        );
      }
    }

    const updatedDoctor =
      await prisma.$transaction(
        async (transaction) => {
          if (
            branchIds !== undefined
          ) {
            await transaction.doctorBranch.deleteMany(
              {
                where: {
                  doctorId: id,
                },
              }
            );
          }

          return transaction.doctor.update(
            {
              where: {
                id,
              },

              data: {
                name,
                email,

                specialty:
                  normalizeNullableText(
                    body.specialty
                  ),

                professionalLicense:
                  normalizeNullableText(
                    body.professionalLicense
                  ),

                description:
                  normalizeNullableText(
                    body.description
                  ),

                photo:
                  normalizeNullableText(
                    body.photo
                  ),

                ...(typeof body.active ===
                  "boolean" && {
                  active: body.active,
                }),

                ...(typeof body.visible ===
                  "boolean" && {
                  visible: body.visible,
                }),

                ...(branchIds !==
                  undefined && {
                  branches: {
                    create:
                      branchIds.map(
                        (branchId) => ({
                          branch: {
                            connect: {
                              id: branchId,
                            },
                          },
                        })
                      ),
                  },
                }),
              },

              include: {
                user: true,

                branches: {
                  include: {
                    branch: true,
                  },
                },
              },
            }
          );
        }
      );

    revalidatePath("/");
    revalidatePath(
      "/dashboard/admin/configuracion/servicios"
    );
    revalidatePath(
      "/dashboard/admin/configuracion/odontologos"
    );

    return NextResponse.json({
      message:
        "Especialista actualizado correctamente.",
      doctor: updatedDoctor,
    });
  } catch (error) {
    console.error(
      "Error actualizando especialista:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron guardar los cambios del especialista.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * Elimina la ficha del especialista de Equipo.
 * No elimina la cuenta de usuario asociada.
 */
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
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;

    const doctor =
      await prisma.doctor.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          name: true,
        },
      });

    if (!doctor) {
      return NextResponse.json(
        {
          error:
            "El especialista no fue encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * No permitimos eliminar especialistas
     * que todavía tengan turnos o presupuestos.
     */
    const [
      appointmentsCount,
      budgetsCount,
    ] = await Promise.all([
      prisma.appointment.count({
        where: {
          doctorId: doctor.id,
        },
      }),

      prisma.budget.count({
        where: {
          doctors: {
            some: {
              doctorId:
                doctor.id,
            },
          },
        },
      }),
    ]);

    if (
      appointmentsCount > 0 ||
      budgetsCount > 0
    ) {
      const reasons: string[] = [];

      if (
        appointmentsCount > 0
      ) {
        reasons.push(
          `${appointmentsCount} ${
            appointmentsCount === 1
              ? "turno asociado"
              : "turnos asociados"
          }`
        );
      }

      if (budgetsCount > 0) {
        reasons.push(
          `${budgetsCount} ${
            budgetsCount === 1
              ? "presupuesto asociado"
              : "presupuestos asociados"
          }`
        );
      }

      return NextResponse.json(
        {
          error: `No se puede eliminar este especialista porque tiene ${reasons.join(
            " y "
          )}. Podés ocultarlo del sitio o marcarlo como inactivo.`,
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Eliminamos primero todas las relaciones
     * que dependen del Doctor.
     */
    await prisma.$transaction(
      async (transaction) => {
        /*
         * Acceso externo a historias clínicas.
         */

        await transaction.clinicalAccessCode.deleteMany(
          {
            where: {
              doctorId:
                doctor.id,
            },
          }
        );

        await transaction.clinicalExternalSession.deleteMany(
          {
            where: {
              doctorId:
                doctor.id,
            },
          }
        );

        await transaction.clinicalAccess.deleteMany(
          {
            where: {
              doctorId:
                doctor.id,
            },
          }
        );

        /*
         * Horarios.
         */

        await transaction.doctorSchedule.deleteMany(
          {
            where: {
              doctorId:
                doctor.id,
            },
          }
        );

        await transaction.doctorSpecificSchedule.deleteMany(
          {
            where: {
              doctorId:
                doctor.id,
            },
          }
        );

        await transaction.doctorScheduleException.deleteMany(
          {
            where: {
              doctorId:
                doctor.id,
            },
          }
        );

        /*
         * Relación con sucursales.
         */

        await transaction.doctorBranch.deleteMany(
          {
            where: {
              doctorId:
                doctor.id,
            },
          }
        );

        /*
         * Las entradas del anexo clínico creadas
         * por este especialista NO deben borrarse,
         * porque forman parte de la historia clínica.
         *
         * Simplemente dejamos de asociarlas
         * al Doctor que estamos eliminando.
         */
        await transaction.clinicalHistoryAnnexEntry.updateMany(
          {
            where: {
              createdByDoctorId:
                doctor.id,
            },

            data: {
              createdByDoctorId:
                null,
            },
          }
        );

        /*
         * Finalmente eliminamos el Doctor.
         */
        await transaction.doctor.delete(
          {
            where: {
              id: doctor.id,
            },
          }
        );
      }
    );

    revalidatePath("/");

    revalidatePath(
      "/dashboard/admin/configuracion/servicios"
    );

    revalidatePath(
      "/dashboard/admin/configuracion/odontologos"
    );

    return NextResponse.json({
      message: `${
        doctor.name ||
        "El especialista"
      } fue eliminado correctamente.`,
    });
  } catch (error) {
    console.error(
      "Error eliminando especialista:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    if (
      errorMessage.includes(
        "Appointment_doctorId_fkey"
      ) ||
      errorMessage.includes(
        'referenced from table "Appointment"'
      )
    ) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar este especialista porque tiene turnos asociados.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      errorMessage.includes(
        "Budget_doctorId_fkey"
      ) ||
      errorMessage.includes(
        'referenced from table "Budget"'
      )
    ) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar este especialista porque tiene presupuestos asociados.",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "Ocurrió un error al eliminar el especialista.",
      },
      {
        status: 500,
      }
    );
  }
}