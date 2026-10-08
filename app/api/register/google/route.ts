
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
        { status: 401 }
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
        { error: "Completá todos los campos." },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe.
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        patient: {
          select: { id: true },
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
        { status: 409 }
      );
    }

    // Buscar fichas de pacientes creadas previamente.
    // Ignoramos mayúsculas y minúsculas.
    const patientsByEmail = await prisma.patient.findMany({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
      },
      take: 2,
    });

    // No elegir una ficha automáticamente si hay duplicados.
    if (patientsByEmail.length > 1) {
      return NextResponse.json(
        {
          error:
            "Existe más de una ficha de paciente con este correo. Contactá al consultorio.",
        },
        { status: 409 }
      );
    }

    const existingPatient = patientsByEmail[0] ?? null;

    // Evitar vincular una ficha que ya tiene otro usuario.
    if (existingPatient?.userId) {
      return NextResponse.json(
        {
          error:
            "Este paciente ya tiene una cuenta asociada.",
        },
        { status: 409 }
      );
    }

    const activeBranch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        active: true,
      },
      select: { id: true },
    });

    if (!activeBranch) {
      return NextResponse.json(
        {
          error: "La sucursal seleccionada no es válida.",
        },
        { status: 400 }
      );
    }

    // Crear el usuario y vincularlo con la ficha existente
    // o crear una nueva si no había ninguna coincidencia.
    const result = await prisma.$transaction(async (tx) => {
      const userName = existingPatient
        ? `${existingPatient.firstName} ${existingPatient.lastName}`
        : `${firstName} ${lastName}`;

      const user = await tx.user.create({
        data: {
          name: userName,
          email,
          password: null,
          role: "PATIENT",
          lastLoginAt: new Date(),
        },
      });

      if (existingPatient) {
        // Vinculación condicional: solo si la ficha
        // sigue sin tener un usuario asociado.
        const updated = await tx.patient.updateMany({
          where: {
            id: existingPatient.id,
            userId: null,
          },
          data: {
            userId: user.id,
          },
        });

        if (updated.count !== 1) {
          throw new Error(
            "La ficha ya fue vinculada durante el registro."
          );
        }

        return {
          linkedExistingPatient: true,
        };
      }

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

      return {
        linkedExistingPatient: false,
      };
    });

    return NextResponse.json({
      success: true,
      linkedExistingPatient: result.linkedExistingPatient,
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
      { status: 500 }
    );
  }
}
