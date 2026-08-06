import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  _request: Request,
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
          error: "Falta el identificador de la derivación.",
        },
        {
          status: 400,
        }
      );
    }

    const referral =
      await prisma.clinicalReferral.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          referredById: true,
          entry: {
            select: {
              id: true,
            },
          },
        },
      });

    if (!referral) {
      return NextResponse.json(
        {
          error: "La derivación no existe.",
        },
        {
          status: 404,
        }
      );
    }

    const referringDoctor =
      await prisma.doctor.findUnique({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
        },
      });

    if (!referringDoctor) {
      return NextResponse.json(
        {
          error:
            "La cuenta administradora no está vinculada a un profesional.",
        },
        {
          status: 400,
        }
      );
    }

    if (referral.referredById !== referringDoctor.id) {
      return NextResponse.json(
        {
          error:
            "No tenés permiso para eliminar esta derivación.",
        },
        {
          status: 403,
        }
      );
    }

    await prisma.$transaction(async (transaction) => {
      if (referral.entry) {
        await transaction.clinicalHistoryEntry.delete({
          where: {
            id: referral.entry.id,
          },
        });
      }

      await transaction.clinicalReferral.delete({
        where: {
          id: referral.id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Derivación eliminada correctamente.",
    });
  } catch (error) {
    console.error(
      "Error eliminando derivación clínica:",
      error
    );

    return NextResponse.json(
      {
        error: "No se pudo eliminar la derivación.",
      },
      {
        status: 500,
      }
    );
  }
}