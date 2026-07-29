import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = String(body.token || "").trim();

    if (!token) {
      return NextResponse.json(
        { error: "El enlace de verificación no es válido." },
        { status: 400 }
      );
    }

    const verificationToken =
      await prisma.emailVerificationToken.findUnique({
        where: {
          token,
        },
        select: {
          id: true,
          expiresAt: true,
          userId: true,
        },
      });

    if (!verificationToken) {
      return NextResponse.json(
        {
          error:
            "El enlace no existe o ya fue utilizado.",
        },
        { status: 400 }
      );
    }

    if (verificationToken.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({
        where: {
          id: verificationToken.id,
        },
      });

      return NextResponse.json(
        {
          error:
            "El enlace venció. Solicitá un nuevo correo de verificación.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: verificationToken.userId,
        },
        data: {
          emailVerified: new Date(),
        },
      }),

      prisma.emailVerificationToken.deleteMany({
        where: {
          userId: verificationToken.userId,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Tu correo fue verificado correctamente.",
    });
  } catch (error) {
    console.error("Error al verificar correo:", error);

    return NextResponse.json(
      { error: "No se pudo verificar el correo." },
      { status: 500 }
    );
  }
}