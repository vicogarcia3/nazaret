import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

const TOKEN_EXPIRATION_HOURS = 24;

type SendVerificationEmailParams = {
  userId: string;
  email: string;
  name: string;
};

export async function sendVerificationEmail({
  userId,
  email,
  name,
}: SendVerificationEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const from = process.env.EMAIL_FROM;

  if (!appUrl) {
    throw new Error("Falta configurar NEXT_PUBLIC_APP_URL.");
  }

  if (!from) {
    throw new Error("Falta configurar EMAIL_FROM.");
  }

  await prisma.emailVerificationToken.deleteMany({
    where: {
      userId,
    },
  });

  const token = crypto.randomBytes(32).toString("hex");

  const expiresAt = new Date(
    Date.now() + TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000
  );

  await prisma.emailVerificationToken.create({
    data: {
      token,
      expiresAt,
      userId,
    },
  });

  const verificationUrl =
    `${appUrl}/verificar-email?token=${encodeURIComponent(token)}`;

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "Verificá tu cuenta de Consultorios Nazaret",
    html: `
      <!DOCTYPE html>
      <html lang="es">
        <body style="
          margin: 0;
          padding: 0;
          background-color: #F7F5F0;
          font-family: Arial, sans-serif;
          color: #333333;
        ">
          <div style="padding: 40px 16px;">
            <div style="
              max-width: 560px;
              margin: 0 auto;
              background-color: #FFFFFF;
              border-radius: 16px;
              overflow: hidden;
              border: 1px solid #E7E3DB;
            ">
              <div style="
                padding: 24px 32px;
                background-color: #A2B38B;
                color: #FFFFFF;
                text-align: center;
              ">
                <h1 style="
                  margin: 0;
                  font-size: 25px;
                  font-weight: 600;
                ">
                  Consultorios Nazaret
                </h1>
              </div>

              <div style="padding: 32px;">
                <h2 style="
                  margin: 0 0 20px;
                  color: #59634D;
                  font-size: 24px;
                ">
                  ¡Bienvenido/a, ${escapeHtml(name)}!
                </h2>

                <p style="
                  margin: 0 0 16px;
                  font-size: 16px;
                  line-height: 1.6;
                ">
                  Tu cuenta fue creada correctamente.
                </p>

                <p style="
                  margin: 0 0 28px;
                  font-size: 16px;
                  line-height: 1.6;
                ">
                  Para finalizar el registro y poder ingresar al portal,
                  verificá tu dirección de correo electrónico.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                  <a
                    href="${verificationUrl}"
                    style="
                      display: inline-block;
                      padding: 14px 24px;
                      border-radius: 9px;
                      background-color: #A2B38B;
                      color: #FFFFFF;
                      text-decoration: none;
                      font-weight: 600;
                    "
                  >
                    Verificar mi cuenta
                  </a>
                </div>

                <p style="
                  margin: 28px 0 0;
                  font-size: 14px;
                  color: #777777;
                  line-height: 1.5;
                ">
                  El enlace vence dentro de ${TOKEN_EXPIRATION_HOURS} horas.
                </p>

                <p style="
                  margin: 12px 0 0;
                  font-size: 13px;
                  color: #999999;
                  line-height: 1.5;
                ">
                  Si no creaste esta cuenta, podés ignorar este correo.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    await prisma.emailVerificationToken.deleteMany({
      where: {
        userId,
      },
    });

    throw new Error(error.message);
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}