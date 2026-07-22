import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error: "Debés ingresar con Google para continuar.",
        },
        {
          status: 401,
        }
      );
    }

    const email = session.user.email.trim().toLowerCase();
    const data = await req.json();

    const firstName = String(data.firstName || "").trim();
    const lastName = String(data.lastName || "").trim();
    const dni = String(data.dni || "").trim();
    const phone = String(data.phone || "").trim();
    const branchId = String(data.branchId || "").trim();

    if (
      !firstName ||
      !lastName ||
      !dni ||
      !phone ||
      !branchId
    ) {
      return NextResponse.json(
        {
          error: "Completá todos los campos.",
        },
        {
          status: 400,
        }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        role: true,
        patient: {
          select: {
            id: true,
          },
        },
      },
    });

    if (existingUser) {
      if (
        existingUser.role === "PATIENT" &&
        existingUser.patient
      ) {
        return NextResponse.json({
          success: true,
          alreadyRegistered: true,
        });
      }

      return NextResponse.json(
        {
          error:
            "Este correo ya pertenece a una cuenta existente.",
        },
        {
          status: 409,
        }
      );
    }

    const activeBranch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        active: true,
      },
      select: {
        id: true,
      },
    });

    if (!activeBranch) {
      return NextResponse.json(
        {
          error: "La sucursal seleccionada no es válida.",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email,
          password: null,
          role: "PATIENT",
          lastLoginAt: new Date(),
        },
      });

      await tx.patient.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          dni,
          phone,
          email,
          branchId,
        },
      });
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Error al completar registro con Google:",
      error
    );

    return NextResponse.json(
      {
        error: "No se pudo completar el registro.",
      },
      {
        status: 500,
      }
    );
  }
}