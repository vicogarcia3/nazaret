import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeBranchIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((branchId): branchId is string => {
          return typeof branchId === "string";
        })
        .map((branchId) => branchId.trim())
        .filter(Boolean)
    )
  );
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
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
        user: {
          name: "asc",
        },
      },
    });

    return NextResponse.json(doctors);
  } catch (error) {
    console.error("ERROR OBTENIENDO ODONTÓLOGOS:", error);

    return NextResponse.json(
      { error: "No se pudieron cargar los odontólogos." },
      { status: 500 }
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

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const specialty =
      typeof body.specialty === "string"
        ? body.specialty.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const photo =
      typeof body.photo === "string" && body.photo.trim()
        ? body.photo.trim()
        : null;

    const active =
      typeof body.active === "boolean"
        ? body.active
        : true;

    const branchIds = normalizeBranchIds(
      body.branchIds ?? body.branches
    );

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          error:
            "Nombre, correo electrónico y contraseña son obligatorios.",
        },
        { status: 400 }
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { error: "Ingresá un correo electrónico válido." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "La contraseña debe tener al menos 8 caracteres.",
        },
        { status: 400 }
      );
    }

    if (branchIds.length === 0) {
      return NextResponse.json(
        {
          error:
            "Seleccioná al menos una sucursal para el odontólogo.",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "Ya existe un usuario registrado con ese correo electrónico.",
        },
        { status: 409 }
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

    const hashedPassword = await bcrypt.hash(password, 12);

    const doctor = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "DOCTOR",
          image: photo,
        },
      });

      return tx.doctor.create({
        data: {
          userId: user.id,
          specialty: specialty || null,
          description: description || null,
          photo,
          active,
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
    });

    return NextResponse.json(
      {
        success: true,
        doctor,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ERROR CREANDO ODONTÓLOGO:", error);

    return NextResponse.json(
      {
        error:
          "No se pudo crear la cuenta del odontólogo.",
      },
      { status: 500 }
    );
  }
}