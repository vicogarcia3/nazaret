import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type UpdateClinicalAccessBody = {
  doctorIds?: string[];
};

function normalizeDoctorIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter(
          (doctorId): doctorId is string =>
            typeof doctorId === "string"
        )
        .map((doctorId) => doctorId.trim())
        .filter(Boolean)
    )
  );
}

export async function GET() {
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

    const accesses =
      await prisma.clinicalAccess.findMany({
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              email: true,
              specialty: true,
              professionalLicense: true,
              active: true,
            },
          },
        },

        orderBy: {
          grantedAt: "desc",
        },
      });

    return NextResponse.json(accesses);
  } catch (error) {
    console.error(
      "Error obteniendo accesos clínicos:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron obtener los accesos clínicos.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(request: Request) {
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

    const body =
      (await request.json()) as UpdateClinicalAccessBody;

    const doctorIds =
      normalizeDoctorIds(body.doctorIds);

    /*
     * Validamos que todos los especialistas
     * seleccionados existan, estén activos
     * y tengan email cargado.
     */
    if (doctorIds.length > 0) {
      const validDoctors =
        await prisma.doctor.findMany({
          where: {
            id: {
              in: doctorIds,
            },
            active: true,
            email: {
              not: null,
            },
          },

          select: {
            id: true,
            email: true,
          },
        });

      if (
        validDoctors.length !== doctorIds.length
      ) {
        return NextResponse.json(
          {
            error:
              "Uno o más especialistas seleccionados no existen, están inactivos o no tienen email cargado.",
          },
          {
            status: 400,
          }
        );
      }
    }

    await prisma.$transaction(
      async (transaction) => {
        /*
         * Primero desactivamos todos los accesos
         * existentes.
         *
         * No borramos registros, así conservamos
         * cuándo se otorgó el acceso originalmente.
         */
        await transaction.clinicalAccess.updateMany({
          where: {
            active: true,
          },

          data: {
            active: false,
          },
        });

        /*
         * Después activamos o creamos el acceso
         * para cada especialista seleccionado.
         */
        for (const doctorId of doctorIds) {
          await transaction.clinicalAccess.upsert({
            where: {
              doctorId,
            },

            create: {
              doctorId,
              active: true,
            },

            update: {
              active: true,
            },
          });
        }
      }
    );

    const updatedAccesses =
      await prisma.clinicalAccess.findMany({
        where: {
          active: true,
        },

        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              email: true,
              specialty: true,
              professionalLicense: true,
            },
          },
        },

        orderBy: {
          doctor: {
            name: "asc",
          },
        },
      });

    return NextResponse.json({
      success: true,
      accesses: updatedAccesses,
      message:
        "Accesos a historias clínicas actualizados correctamente.",
    });
  } catch (error) {
    console.error(
      "Error actualizando accesos clínicos:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron actualizar los accesos clínicos.",
      },
      {
        status: 500,
      }
    );
  }
}