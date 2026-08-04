import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const includeInactive =
      searchParams.get("includeInactive") === "true";

    const treatments = await prisma.treatment.findMany({
      where: includeInactive
        ? undefined
        : {
            active: true,
          },
      orderBy: {
        price: "asc",
      },
    });

    return NextResponse.json(
      treatments.map((treatment) => ({
        ...treatment,
        price:
          treatment.price !== null
            ? Number(treatment.price)
            : null,
      }))
    );
  } catch (error) {
    console.error("Error cargando tratamientos:", error);

    return NextResponse.json(
      {
        error: "No se pudieron cargar los tratamientos.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  if (!body.name) {
    return NextResponse.json(
      { error: "El nombre es obligatorio" },
      { status: 400 }
    );
  }

  const treatment = await prisma.treatment.create({
    data: {
      name: body.name,
      description: body.description || null,
      price: body.price ? Number(body.price) : null,
    },
  });

  return NextResponse.json(treatment);
}