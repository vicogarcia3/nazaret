import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const token =
      typeof body.token === "string"
        ? body.token.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!token) {
      return NextResponse.json(
        {
          error:
            "El enlace de recuperación no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "La nueva contraseña debe tener al menos 8 caracteres.",
        },
        {
          status: 400,
        }
      );
    }

    const tokenHash = hashToken(token);

    const resetToken =
      await prisma.passwordResetToken.findUnique({
        where: {
          tokenHash,
        },
        select: {
          id: true,
          userId: true,
          expiresAt: true,
          usedAt: true,
        },
      });

    if (!resetToken) {
      return NextResponse.json(
        {
          error:
            "El enlace de recuperación no es válido o ya no existe.",
        },
        {
          status: 400,
        }
      );
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        {
          error:
            "Este enlace de recuperación ya fue utilizado.",
        },
        {
          status: 400,
        }
      );
    }

    if (resetToken.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        {
          error:
            "El enlace de recuperación venció. Solicitá uno nuevo.",
        },
        {
          status: 400,
        }
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      12
    );

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          password: hashedPassword,
        },
      }),

      prisma.passwordResetToken.update({
        where: {
          id: resetToken.id,
        },
        data: {
          usedAt: new Date(),
        },
      }),

      prisma.passwordResetToken.deleteMany({
        where: {
          userId: resetToken.userId,
          id: {
            not: resetToken.id,
          },
        },
      }),
    ]);

    return NextResponse.json({
      message:
        "Tu contraseña fue actualizada correctamente.",
    });
  } catch (error) {
    console.error(
      "Error restableciendo contraseña:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo restablecer la contraseña. Intentá nuevamente.",
      },
      {
        status: 500,
      }
    );
  }
}