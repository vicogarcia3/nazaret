import { NextResponse } from "next/server";

import { sendVerificationEmail } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Ingresá un correo electrónico válido." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        emailVerified: true,
      },
    });

    /*
     * Usamos un mensaje genérico para no revelar
     * si una dirección está registrada o no.
     */
    if (!user || !user.password) {
      return NextResponse.json({
        success: true,
        message:
          "Si existe una cuenta pendiente con ese correo, recibirás un nuevo enlace.",
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message:
          "Este correo ya se encuentra verificado. Podés iniciar sesión.",
      });
    }

    await sendVerificationEmail({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return NextResponse.json({
      success: true,
      message:
        "Te enviamos un nuevo enlace de verificación.",
    });
  } catch (error) {
    console.error(
      "Error al reenviar correo de verificación:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No pudimos enviar el correo. Intentá nuevamente más tarde.",
      },
      { status: 500 }
    );
  }
}