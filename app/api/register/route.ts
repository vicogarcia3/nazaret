import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

import { sendVerificationEmail } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Ingresá un correo electrónico válido." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error: "La contraseña debe tener al menos 8 caracteres.",
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

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: `${firstName} ${lastName}`,
          email,
          password: hashedPassword,
          role: "PATIENT",
          emailVerified: null,
        },
      });

      await tx.patient.create({
        data: {
          userId: createdUser.id,
          firstName,
          lastName,
          phone,
          email,
          dni,
          branchId,
        },
      });

      return createdUser;
    });

    try {
      await sendVerificationEmail({
        userId: user.id,
        email: user.email,
        name: user.name,
      });
    } catch (emailError) {
      console.error(
        "La cuenta se creó, pero no se pudo enviar la verificación:",
        emailError
      );

      return NextResponse.json(
        {
          success: true,
          emailSent: false,
          email,
          message:
            "La cuenta fue creada, pero no pudimos enviar el correo. Solicitá uno nuevo desde el inicio de sesión.",
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        emailSent: true,
        email,
        message:
          "Cuenta creada. Revisá tu correo para verificarla antes de iniciar sesión.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al registrar paciente:", error);

    return NextResponse.json(
      { error: "No se pudo crear la cuenta." },
      { status: 500 }
    );
  }
}