import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeBranchIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter(
          (branchId): branchId is string =>
            typeof branchId === "string"
        )
        .map((branchId) => branchId.trim())
        .filter(Boolean)
    )
  );
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue || null;
}

export async function GET() {
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

    const doctors = await prisma.doctor.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        branches: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true,
                active: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(doctors);
  } catch (error) {
    console.error(
      "ERROR OBTENIENDO ESPECIALISTAS:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron cargar los especialistas.",
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

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const specialty =
      typeof body.specialty === "string" && body.specialty.trim()
        ? body.specialty.trim()
        : null;

    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;

    const photo =
      typeof body.photo === "string" && body.photo.trim()
        ? body.photo.trim()
        : null;

    const active =
      typeof body.active === "boolean"
        ? body.active
        : true;

    const visible =
      typeof body.visible === "boolean"
        ? body.visible
        : true;

    const branchIds = normalizeBranchIds(
      body.branchIds ?? body.branches
    );

    if (!name) {
      return NextResponse.json(
        {
          error: "El nombre es obligatorio.",
        },
        { status: 400 }
      );
    }

    if (branchIds.length === 0) {
      return NextResponse.json(
        {
          error: "Seleccioná al menos una sucursal.",
        },
        { status: 400 }
      );
    }

    const validBranches = await prisma.branch.findMany({
      where: {
        id: {
          in: branchIds,
        },
        active: true,
      },
      select: {
        id: true,
      },
    });

    if (validBranches.length !== branchIds.length) {
      return NextResponse.json(
        {
          error:
            "Una o más sucursales seleccionadas no existen o están inactivas.",
        },
        { status: 400 }
      );
    }

    const doctor = await prisma.doctor.create({
      data: {
        name,
        userId: null,
        specialty,
        description,
        photo,
        active,
        visible,
        branches: {
          create: branchIds.map((branchId) => ({
            branchId,
          })),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        branches: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
                city: true,
                address: true,
                active: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        doctor,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ERROR CREANDO ESPECIALISTA:", error);

    return NextResponse.json(
      {
        error: "No se pudo crear el especialista.",
      },
      { status: 500 }
    );
  }
}