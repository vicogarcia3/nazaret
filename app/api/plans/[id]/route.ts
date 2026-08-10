import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();

  return text || null;
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        {
          error:
            "El nombre del plan es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    if (!description) {
      return NextResponse.json(
        {
          error:
            "La descripción del plan es obligatoria.",
        },
        {
          status: 400,
        }
      );
    }

    const price =
      body.price === "" ||
      body.price === null ||
      body.price === undefined
        ? null
        : Number(body.price);

    const discount =
      body.discount === "" ||
      body.discount === null ||
      body.discount === undefined
        ? 0
        : Number(body.discount);

    if (
      price !== null &&
      (!Number.isFinite(price) ||
        price < 0)
    ) {
      return NextResponse.json(
        {
          error:
            "El precio mensual no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(discount) ||
      discount < 0 ||
      discount > 100
    ) {
      return NextResponse.json(
        {
          error:
            "El descuento debe estar entre 0 y 100.",
        },
        {
          status: 400,
        }
      );
    }

    const existingPlan =
      await prisma.plan.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      });

    if (!existingPlan) {
      return NextResponse.json(
        {
          error:
            "El plan no existe.",
        },
        {
          status: 404,
        }
      );
    }

    const plan =
      await prisma.plan.update({
        where: {
          id,
        },

        data: {
          name,
          description,

          benefits:
            normalizeOptionalText(
              body.benefits
            ),

          conditions:
            normalizeOptionalText(
              body.conditions
            ),

          price,

          discount,

          visible:
            typeof body.visible ===
            "boolean"
              ? body.visible
              : false,
        },
      });

    return NextResponse.json(plan);
  } catch (error) {
    console.error(
      "Error actualizando plan:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo actualizar el plan.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const existingPlan =
      await prisma.plan.findUnique({
        where: {
          id,
        },

        select: {
          id: true,

          _count: {
            select: {
              patients: true,
            },
          },
        },
      });

    if (!existingPlan) {
      return NextResponse.json(
        {
          error:
            "El plan ya fue eliminado o no existe.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Si ya hay pacientes asociados al plan,
     * no lo eliminamos porque forma parte de
     * información histórica.
     *
     * En ese caso la admin puede marcarlo como
     * no visible.
     */
    if (
      existingPlan._count.patients > 0
    ) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar este plan porque tiene pacientes asociados. Podés editarlo y marcarlo como no visible.",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.plan.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message:
        "Plan eliminado correctamente.",
    });
  } catch (error) {
    console.error(
      "Error eliminando plan:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo eliminar el plan.",
      },
      {
        status: 500,
      }
    );
  }
}