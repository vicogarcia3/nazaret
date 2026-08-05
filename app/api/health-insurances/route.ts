import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const includeHidden =
      searchParams.get("includeHidden") === "true";

    const healthInsurances =
      await prisma.healthInsurance.findMany({
        where: includeHidden
          ? undefined
          : {
              visible: true,
            },
        orderBy: {
          name: "asc",
        },
      });

    return NextResponse.json(healthInsurances);
  } catch (error) {
    console.error(
      "Error cargando obras sociales:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron cargar las obras sociales.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const logo =
      typeof body.logo === "string" &&
      body.logo.trim()
        ? body.logo.trim()
        : null;

    const visible =
      typeof body.visible === "boolean"
        ? body.visible
        : true;

    if (!name) {
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

    const existing =
      await prisma.healthInsurance.findFirst({
        where: {
          name: {
            equals: name,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          error:
            "Ya existe una obra social con ese nombre.",
        },
        {
          status: 409,
        }
      );
    }

    const healthInsurance =
      await prisma.healthInsurance.create({
        data: {
          name,
          logo,
          visible,
        },
      });

    return NextResponse.json(
      healthInsurance,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error creando obra social:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo crear la obra social.",
      },
      {
        status: 500,
      }
    );
  }
}