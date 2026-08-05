import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

    const current =
      await prisma.healthInsurance.findUnique({
        where: {
          id,
        },
      });

    if (!current) {
      return NextResponse.json(
        {
          error:
            "La obra social no fue encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : undefined;

    const logo =
      body.logo === null
        ? null
        : typeof body.logo === "string"
        ? body.logo.trim() || null
        : undefined;

    if (name !== undefined && !name) {
      return NextResponse.json(
        {
          error:
            "Ingresá el nombre de la obra social.",
        },
        {
          status: 400,
        }
      );
    }

    if (name !== undefined) {
      const duplicate =
        await prisma.healthInsurance.findFirst({
          where: {
            id: {
              not: id,
            },
            name: {
              equals: name,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
          },
        });

      if (duplicate) {
        return NextResponse.json(
          {
            error:
              "Ya existe otra obra social con ese nombre.",
          },
          {
            status: 409,
          }
        );
      }
    }

    const healthInsurance =
      await prisma.healthInsurance.update({
        where: {
          id,
        },
        data: {
          ...(name !== undefined && {
            name,
          }),
          ...(logo !== undefined && {
            logo,
          }),
          ...(typeof body.visible ===
            "boolean" && {
            visible: body.visible,
          }),
        },
      });

    return NextResponse.json(
      healthInsurance
    );
  } catch (error) {
    console.error(
      "Error actualizando obra social:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo actualizar la obra social.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
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

    const existing =
      await prisma.healthInsurance.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "La obra social no fue encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.healthInsurance.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message:
        "Obra social eliminada correctamente.",
    });
  } catch (error) {
    console.error(
      "Error eliminando obra social:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo eliminar la obra social.",
      },
      {
        status: 500,
      }
    );
  }
}