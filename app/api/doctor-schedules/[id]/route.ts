import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

    if (!session || session.user.role !== "ADMIN") {
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

    if (!id) {
      return NextResponse.json(
        {
          error: "Falta el identificador del horario.",
        },
        {
          status: 400,
        }
      );
    }

    const schedule = await prisma.doctorSchedule.findUnique({
      where: {
        id,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        {
          error: "El horario no existe.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.doctorSchedule.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error al eliminar horario semanal:", error);

    return NextResponse.json(
      {
        error: "No se pudo eliminar el horario.",
      },
      {
        status: 500,
      }
    );
  }
}