import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeNullableText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue || null;
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "El especialista no fue encontrado." },
        { status: 404 }
      );
    }

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : undefined;

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : undefined;

    const branchIds: string[] | undefined = Array.isArray(
      body.branchIds
    )
      ? Array.from(
          new Set<string>(
            body.branchIds.filter(
              (branchId: unknown): branchId is string =>
                typeof branchId === "string" &&
                branchId.trim().length > 0
            )
          )
        )
      : undefined;

    if (name !== undefined && !name) {
      return NextResponse.json(
        { error: "Ingresá el nombre completo." },
        { status: 400 }
      );
    }

    if (email !== undefined && !email) {
      return NextResponse.json(
        { error: "Ingresá un correo electrónico válido." },
        { status: 400 }
      );
    }

    if (branchIds !== undefined && branchIds.length === 0) {
      return NextResponse.json(
        { error: "Seleccioná al menos una sucursal." },
        { status: 400 }
      );
    }

    if (email !== undefined) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: {
            not: doctor.userId,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingUser) {
        return NextResponse.json(
          {
            error:
              "Ya existe otro usuario registrado con ese correo.",
          },
          { status: 409 }
        );
      }
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

      if (existingBranchesCount !== branchIds.length) {
        return NextResponse.json(
          {
            error:
              "Una o más sucursales seleccionadas no existen o están inactivas.",
          },
          { status: 400 }
        );
      }
    }

    const updatedDoctor = await prisma.$transaction(
      async (transaction) => {
        const shouldUpdateUser =
          name !== undefined || email !== undefined;

        if (shouldUpdateUser) {
          await transaction.user.update({
            where: {
              id: doctor.userId,
            },
            data: {
              ...(name !== undefined && { name }),
              ...(email !== undefined && { email }),
            },
          });
        }

        if (branchIds !== undefined) {
          await transaction.doctorBranch.deleteMany({
            where: {
              doctorId: doctor.id,
            },
          });
        }

        return transaction.doctor.update({
          where: {
            id: doctor.id,
          },
          data: {
            ...(body.specialty !== undefined && {
              specialty: normalizeNullableText(body.specialty),
            }),
            ...(body.description !== undefined && {
              description: normalizeNullableText(body.description),
            }),
            ...(body.photo !== undefined && {
              photo: normalizeNullableText(body.photo),
            }),
            ...(typeof body.active === "boolean" && {
              active: body.active,
            }),
            ...(branchIds !== undefined && {
              branches: {
                create: branchIds.map((branchId) => ({
                  branch: {
                    connect: {
                      id: branchId,
                    },
                  },
                })),
              },
            }),
          },
          select: {
            id: true,
            specialty: true,
            description: true,
            photo: true,
            active: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            branches: {
              select: {
                branchId: true,
              },
            },
          },
        });
      }
    );

    return NextResponse.json({
      message: "Especialista actualizado correctamente.",
      doctor: updatedDoctor,
    });
  } catch (error) {
    console.error("Error actualizando especialista:", error);

    return NextResponse.json(
      {
        error:
          "No se pudieron guardar los cambios del especialista.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "El especialista no fue encontrado." },
        { status: 404 }
      );
    }

    const [appointmentsCount, budgetsCount] = await Promise.all([
      prisma.appointment.count({
        where: {
          doctorId: doctor.id,
        },
      }),

      prisma.budget.count({
        where: {
          doctorId: doctor.id,
        },
      }),
    ]);

    if (appointmentsCount > 0 || budgetsCount > 0) {
      const reasons: string[] = [];

      if (appointmentsCount > 0) {
        reasons.push(
          `${appointmentsCount} ${
            appointmentsCount === 1 ? "turno asociado" : "turnos asociados"
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
          )}. Podés editarlo y marcarlo como inactivo.`,
        },
        {
          status: 400,
        }
      );
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.doctorBranch.deleteMany({
        where: {
          doctorId: doctor.id,
        },
      });

      await transaction.doctor.delete({
        where: {
          id: doctor.id,
        },
      });

      await transaction.user.delete({
        where: {
          id: doctor.userId,
        },
      });
    });

    return NextResponse.json({
      message: `${
        doctor.user.name || "El especialista"
      } fue eliminado correctamente.`,
    });
  } catch (error) {
      console.error("Error eliminando especialista:", error);

      const errorMessage =
        error instanceof Error ? String(error) : String(error);

      if (
        errorMessage.includes("DoctorAvailability_doctorId_fkey") ||
        errorMessage.includes('referenced from table "DoctorAvailability"')
      ) {
        return NextResponse.json(
          {
            error:
              "No se puede eliminar este especialista porque tiene horarios configurados. Eliminá primero sus disponibilidades o marcá al especialista como inactivo.",
          },
          { status: 400 }
        );
      }

      if (
        errorMessage.includes("Appointment_doctorId_fkey") ||
        errorMessage.includes('referenced from table "Appointment"')
      ) {
        return NextResponse.json(
          {
            error:
              "No se puede eliminar este especialista porque tiene turnos asociados.",
          },
          { status: 400 }
        );
      }

      if (
        errorMessage.includes("Budget_doctorId_fkey") ||
        errorMessage.includes('referenced from table "Budget"')
      ) {
        return NextResponse.json(
          {
            error:
              "No se puede eliminar este especialista porque tiene presupuestos asociados.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: "Ocurrió un error al eliminar el especialista.",
        },
        { status: 500 }
      );
    }
}
