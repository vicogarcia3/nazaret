import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";

import { prisma } from "@/lib/prisma";

const GENERIC_MESSAGE =
  "Si existe una cuenta asociada a ese correo, recibirás las instrucciones para restablecer tu contraseña.";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getAppUrl(request: Request) {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    new URL(request.url).origin
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return NextResponse.json(
        { error: "Ingresá un correo electrónico válido." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const createdToken = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const resetUrl = `${getAppUrl(
      request
    )}/restablecer-contrasena?token=${encodeURIComponent(rawToken)}`;

    const apiKey = process.env.RESEND_API_KEY;
    const emailFrom =
      process.env.EMAIL_FROM ||
      "Consultorios Nazaret <onboarding@resend.dev>";

    if (!apiKey) {
      if (process.env.NODE_ENV === "development") {
        console.log("\n========================================");
        console.log("ENLACE DE RECUPERACIÓN DE CONTRASEÑA");
        console.log(resetUrl);
        console.log("========================================\n");

        return NextResponse.json({
          message: GENERIC_MESSAGE,
          developmentUrl: resetUrl,
        });
      }

      await prisma.passwordResetToken.delete({
        where: { id: createdToken.id },
      });

      return NextResponse.json(
        {
          error:
            "El servicio de recuperación no está disponible temporalmente.",
        },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from: emailFrom,
      to: user.email,
      subject: "Restablecer contraseña | Consultorios Nazaret",
      html: `
        <div style="background:#f7f5ef;padding:40px 20px;font-family:Arial,Helvetica,sans-serif;color:#30343a">
          <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e3de;padding:36px">
            <p style="margin:0 0 12px;color:#879b75;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase">
              Consultorios Nazaret
            </p>

            <h1 style="margin:0;color:#263f3b;font-size:28px;font-weight:500">
              Restablecer contraseña
            </h1>

            <p style="margin:24px 0 0;color:#5f676f;font-size:15px;line-height:1.7">
              Hola ${escapeHtml(user.name)}:
            </p>

            <p style="margin:12px 0 0;color:#5f676f;font-size:15px;line-height:1.7">
              Recibimos una solicitud para cambiar la contraseña de tu cuenta.
            </p>

            <div style="margin:30px 0">
              <a
                href="${resetUrl}"
                style="display:inline-block;background:#263f3b;color:#ffffff;padding:14px 22px;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase"
              >
                Restablecer contraseña
              </a>
            </div>

            <p style="margin:0;color:#6c737c;font-size:13px;line-height:1.7">
              Este enlace vence dentro de 30 minutos y solo puede utilizarse una vez.
            </p>

            <p style="margin:14px 0 0;color:#6c737c;font-size:13px;line-height:1.7">
              Si no solicitaste este cambio, podés ignorar este correo.
            </p>
          </div>
        </div>
      `,
      text: [
        `Hola ${user.name}:`,
        "",
        "Recibimos una solicitud para cambiar la contraseña de tu cuenta.",
        "",
        `Abrí este enlace: ${resetUrl}`,
        "",
        "El enlace vence dentro de 30 minutos y solo puede utilizarse una vez.",
        "",
        "Si no solicitaste este cambio, podés ignorar este correo.",
      ].join("\n"),
    });

    if (error) {
      await prisma.passwordResetToken.delete({
        where: { id: createdToken.id },
      });

      console.error("Error enviando recuperación:", error);

      return NextResponse.json(
        {
          error:
            "No pudimos enviar el correo de recuperación. Intentá nuevamente.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("Error solicitando recuperación:", error);

    return NextResponse.json(
      {
        error:
          "No se pudo procesar la solicitud. Intentá nuevamente más tarde.",
      },
      { status: 500 }
    );
  }
}