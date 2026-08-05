import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
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

  try {
    const expense = await prisma.expense.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!expense) {
      return NextResponse.json(
        {
          error: "El gasto ya fue eliminado o no existe.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.expense.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Gasto eliminado correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar gasto:", error);

    return NextResponse.json(
      {
        error: "No se pudo eliminar el gasto.",
      },
      {
        status: 500,
      }
    );
  }
}