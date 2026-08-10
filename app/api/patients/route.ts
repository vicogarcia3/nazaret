import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
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

  const patients =
    await prisma.patient.findMany({
      include: {
        branch: true,
        plan: true,
        user: true,
      },
      orderBy: {
        lastName: "asc",
      },
    });

  return NextResponse.json(patients);
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

    const firstName = String(
      body.firstName || ""
    ).trim();

    const lastName = String(
      body.lastName || ""
    ).trim();

    const dni = String(
      body.dni || ""
    ).trim();

    const phone = String(
      body.phone || ""
    ).trim();

    const email = String(
      body.email || ""
    )
      .trim()
      .toLowerCase();

    const branchId = String(
      body.branchId || ""
    ).trim();

    const planId =
      typeof body.planId === "string" &&
      body.planId.trim()
        ? body.planId.trim()
        : null;

    if (
      !firstName ||
      !lastName ||
      !dni ||
      !phone ||
      !branchId
    ) {
      return NextResponse.json(
        {
          error:
            "Completá todos los campos obligatorios.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      email &&
      !EMAIL_REGEX.test(email)
    ) {
      return NextResponse.json(
        {
          error:
            "Ingresá un correo electrónico válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (email) {
      const existingPatient =
        await prisma.patient.findFirst({
          where: {
            email: {
              equals: email,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
          },
        });

      if (existingPatient) {
        return NextResponse.json(
          {
            error:
              "Ya existe un paciente registrado con ese email.",
          },
          {
            status: 409,
          }
        );
      }
    }

    const existingDni =
      await prisma.patient.findFirst({
        where: {
          dni,
        },
        select: {
          id: true,
        },
      });

    if (existingDni) {
      return NextResponse.json(
        {
          error:
            "Ya existe un paciente registrado con ese DNI.",
        },
        {
          status: 409,
        }
      );
    }

    const branch =
      await prisma.branch.findFirst({
        where: {
          id: branchId,
          active: true,
        },
        select: {
          id: true,
        },
      });

    if (!branch) {
      return NextResponse.json(
        {
          error:
            "La sucursal seleccionada no es válida.",
        },
        {
          status: 400,
        }
      );
    }

    if (planId) {
      const plan =
        await prisma.plan.findUnique({
          where: {
            id: planId,
          },
          select: {
            id: true,
          },
        });

      if (!plan) {
        return NextResponse.json(
          {
            error:
              "El plan seleccionado no es válido.",
          },
          {
            status: 400,
          }
        );
      }
    }

    const patient =
      await prisma.patient.create({
        data: {
          firstName,
          lastName,
          dni,
          phone,
          email: email || null,
          branchId,
          planId,
        },
      });

    return NextResponse.json(
      patient,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error creando paciente:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo crear el paciente.",
      },
      {
        status: 500,
      }
    );
  }
}