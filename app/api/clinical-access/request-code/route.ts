import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

type RequestCodeBody = {
  email?: string;
};

function generateSixDigitCode() {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as RequestCodeBody;

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Ingresá tu correo electrónico.",
        },
        {
          status: 400,
        }
      );
    }

    const doctor =
      await prisma.doctor.findFirst({
        where: {
          email: {
            equals: email,
            mode: "insensitive",
          },

          active: true,

          clinicalAccess: {
            is: {
              active: true,
            },
          },
        },

        select: {
          id: true,
          name: true,
          email: true,
        },
      });

    if (!doctor || !doctor.email) {
      return NextResponse.json({
        success: true,
        message:
          "Si el correo está habilitado, vas a recibir un código de acceso.",
      });
    }

    await prisma.clinicalAccessCode.updateMany({
      where: {
        doctorId: doctor.id,
        usedAt: null,
      },

      data: {
        usedAt: new Date(),
      },
    });

    const code =
      generateSixDigitCode();

    const codeHash =
      await bcrypt.hash(code, 10);

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await prisma.clinicalAccessCode.create({
      data: {
        doctorId: doctor.id,
        codeHash,
        expiresAt,
      },
    });

    await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "Consultorios Nazaret <onboarding@resend.dev>",

      to: doctor.email,

      subject:
        "Código de acceso a Historias Clínicas",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 560px;
          margin: 0 auto;
          padding: 32px;
          color: #263F3B;
        ">
          <p style="
            font-size: 12px;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #A2B38B;
            margin-bottom: 12px;
          ">
            Consultorios Nazaret
          </p>

          <h1 style="
            font-size: 26px;
            margin: 0 0 16px;
          ">
            Acceso a Historias Clínicas
          </h1>

          <p style="
            font-size: 15px;
            line-height: 1.6;
            color: #5F6F6B;
          ">
            Hola ${doctor.name}. Usá el siguiente código para verificar tu identidad.
          </p>

          <div style="
            margin: 28px 0;
            padding: 20px;
            text-align: center;
            background: #F7F5EF;
            border: 1px solid #DED9CD;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 8px;
          ">
            ${code}
          </div>

          <p style="
            font-size: 14px;
            line-height: 1.6;
            color: #6B7774;
          ">
            El código vence en 10 minutos.
          </p>

          <p style="
            margin-top: 24px;
            font-size: 13px;
            line-height: 1.6;
            color: #8A918F;
          ">
            Si no solicitaste este acceso, podés ignorar este correo.
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message:
        "Si el correo está habilitado, vas a recibir un código de acceso.",
    });
  } catch (error) {
    console.error(
      "Error solicitando código clínico:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo enviar el código de acceso.",
      },
      {
        status: 500,
      }
    );
  }
}