import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const data = await req.json();

    const currentPassword = String(data.currentPassword || "");
    const newPassword = String(data.newPassword || "");
    const confirmPassword = String(data.confirmPassword || "");

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          error: "La nueva contraseña debe tener al menos 8 caracteres.",
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Las contraseñas nuevas no coinciden." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 }
      );
    }

    if (user.password) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Ingresá tu contraseña actual." },
          { status: 400 }
        );
      }

      const validPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!validPassword) {
        return NextResponse.json(
          { error: "La contraseña actual es incorrecta." },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);

    return NextResponse.json(
      { error: "No se pudo cambiar la contraseña." },
      { status: 500 }
    );
  }
}