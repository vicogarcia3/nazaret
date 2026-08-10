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

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error(
      "Error obteniendo planes:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron cargar los planes.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (
      !session ||
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error: "No autorizado",
        },
        {
          status: 401,
        }
      );
    }

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

    const plan =
      await prisma.plan.create({
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
            typeof body.visible === "boolean"
              ? body.visible
              : false,
        },
      });

    return NextResponse.json(
      plan,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error creando plan:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo crear el plan.",
      },
      {
        status: 500,
      }
    );
  }
}