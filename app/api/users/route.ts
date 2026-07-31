import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLoginAt: true,
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            photo: true,
            active: true,
            visible: true,
            branches: {
              select: {
                branchId: true,
              },
            },
          },
        },
      },
    });

    const currentUser =
      users.find((user) => user.id === session.user.id) ?? null;

    return NextResponse.json({
      currentUser,
      admins: users.filter((user) => user.role === "ADMIN"),
      doctors: users.filter((user) => user.role === "DOCTOR"),
      patients: users.filter((user) => user.role === "PATIENT"),
    });
  } catch (error) {
    console.error("ERROR OBTENIENDO USUARIOS:", error);

    return NextResponse.json(
      { error: "No se pudieron cargar los usuarios." },
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

    const role =
      body.role === "ADMIN" ||
      body.role === "DOCTOR" ||
      body.role === "PATIENT"
        ? body.role
        : null;

    const doctorId =
      typeof body.doctorId === "string"
        ? body.doctorId.trim()
        : "";

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        {
          error:
            "Nombre, correo electrónico, contraseña y rol son obligatorios.",
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

    if (role === "DOCTOR" && !doctorId) {
      return NextResponse.json(
        {
          error:
            "Seleccioná el especialista al que querés asociar la cuenta.",
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

    if (role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({
        where: {
          id: doctorId,
        },
        select: {
          id: true,
          name: true,
          userId: true,
        },
      });

      if (!doctor) {
        return NextResponse.json(
          {
            error:
              "El especialista seleccionado no existe.",
          },
          { status: 404 }
        );
      }

      if (doctor.userId) {
        return NextResponse.json(
          {
            error:
              "Ese especialista ya tiene una cuenta asociada.",
          },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          emailVerified: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      if (role === "DOCTOR") {
        await tx.doctor.update({
          where: {
            id: doctorId,
          },
          data: {
            userId: createdUser.id,
          },
        });
      }

      return createdUser;
    });

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ERROR CREANDO USUARIO:", error);

    return NextResponse.json(
      {
        error:
          "No se pudo crear el usuario.",
      },
      { status: 500 }
    );
  }
}