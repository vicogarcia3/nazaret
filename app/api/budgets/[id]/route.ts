import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  request: Request,
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
          error: "No tenés permisos para eliminar presupuestos.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error: "El identificador del presupuesto no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    const budget = await prisma.budget.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        doctorId: true,
      },
    });

    if (!budget) {
      return NextResponse.json(
        {
          error: "El presupuesto no fue encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (session.user.role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
        },
      });

      if (!doctor) {
        return NextResponse.json(
          {
            error: "No se encontró el perfil profesional.",
          },
          {
            status: 404,
          }
        );
      }

      if (budget.doctorId !== doctor.id) {
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

    await prisma.$transaction(async (tx) => {
      // Eliminar todos los ítems del presupuesto
      await tx.budgetItem.deleteMany({
        where: {
          budgetId: budget.id,
        },
    });

    // Eliminar el presupuesto
    await tx.budget.delete({
      where: {
        id: budget.id,
      },
    });
  });

    return NextResponse.json({
      message: "Presupuesto eliminado correctamente.",
    });
  } catch (error) {
    console.error("Error eliminando presupuesto:", error);

    return NextResponse.json(
      {
        error: "No se pudo eliminar el presupuesto.",
      },
      {
        status: 500,
      }
    );
  }
}