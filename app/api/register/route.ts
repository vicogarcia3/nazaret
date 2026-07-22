import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const firstName = String(data.firstName || "").trim();
    const lastName = String(data.lastName || "").trim();
    const phone = String(data.phone || "").trim();
    const dni = String(data.dni || "").trim();
    const branchId = String(data.branchId || "").trim();
    const email = String(data.email || "").trim().toLowerCase();
    const password = String(data.password || "");

    if (
      !firstName ||
      !lastName ||
      !phone ||
      !dni ||
      !branchId ||
      !email ||
      !password
    ) {
      return NextResponse.json(
        { error: "Completá todos los campos." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "El correo ya está registrado." },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.findFirst({
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
        { error: "La sucursal seleccionada no es válida." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email,
          password: hashedPassword,
          role: "PATIENT",
        },
      });

      await tx.patient.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          phone,
          email,
          dni,
          branchId,
        },
      });
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error al registrar paciente:", error);

    return NextResponse.json(
      { error: "No se pudo crear la cuenta." },
      { status: 500 }
    );
  }
}