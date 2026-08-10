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

    const { id } =
      await context.params;

    const existingImage =
      await prisma.clinicalImage.findUnique(
        {
          where: {
            id,
          },
          select: {
            id: true,
            imageUrl: true,
          },
        }
      );

    if (!existingImage) {
      return NextResponse.json(
        {
          error:
            "La imagen ya fue eliminada o no existe.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.clinicalImage.delete(
      {
        where: {
          id,
        },
      }
    );

    return NextResponse.json({
      message:
        "Imagen clínica eliminada correctamente.",
    });
  } catch (error) {
    console.error(
      "Error eliminando imagen clínica:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo eliminar la imagen clínica.",
      },
      {
        status: 500,
      }
    );
  }
}