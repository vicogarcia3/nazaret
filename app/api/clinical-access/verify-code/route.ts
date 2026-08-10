import bcrypt from "bcrypt";
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type VerifyCodeBody = {
  email?: string;
  code?: string;
};

function hashToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    const body =
      (await request.json()) as VerifyCodeBody;

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const code =
      typeof body.code === "string"
        ? body.code.trim()
        : "";

    if (!email || !code) {
      return NextResponse.json(
        {
          error:
            "Ingresá el correo y el código de acceso.",
        },
        {
          status: 400,
        }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        {
          error:
            "El código debe tener 6 dígitos.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Buscamos al especialista por email y
     * verificamos que siga teniendo acceso activo.
     */
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

    if (!doctor) {
      return NextResponse.json(
        {
          error:
            "El código no es válido o el acceso ya no está habilitado.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Tomamos el último código disponible
     * que todavía no fue utilizado.
     */
    const accessCode =
      await prisma.clinicalAccessCode.findFirst({
        where: {
          doctorId: doctor.id,
          usedAt: null,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    if (!accessCode) {
      return NextResponse.json(
        {
          error:
            "No hay un código de acceso vigente. Solicitá uno nuevo.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Verificamos vencimiento.
     */
    if (
      accessCode.expiresAt.getTime() <
      Date.now()
    ) {
      await prisma.clinicalAccessCode.update({
        where: {
          id: accessCode.id,
        },
        data: {
          usedAt: new Date(),
        },
      });

      return NextResponse.json(
        {
          error:
            "El código venció. Solicitá uno nuevo.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Máximo 5 intentos.
     */
    if (accessCode.attempts >= 5) {
      return NextResponse.json(
        {
          error:
            "Se alcanzó el máximo de intentos. Solicitá un código nuevo.",
        },
        {
          status: 429,
        }
      );
    }

    const codeMatches =
      await bcrypt.compare(
        code,
        accessCode.codeHash
      );

    if (!codeMatches) {
      const newAttempts =
        accessCode.attempts + 1;

      await prisma.clinicalAccessCode.update({
        where: {
          id: accessCode.id,
        },

        data: {
          attempts: newAttempts,

          ...(newAttempts >= 5 && {
            usedAt: new Date(),
          }),
        },
      });

      return NextResponse.json(
        {
          error:
            newAttempts >= 5
              ? "Se alcanzó el máximo de intentos. Solicitá un código nuevo."
              : `Código incorrecto. Te quedan ${
                  5 - newAttempts
                } intento${
                  5 - newAttempts === 1
                    ? ""
                    : "s"
                }.`,
        },
        {
          status:
            newAttempts >= 5 ? 429 : 401,
        }
      );
    }

    /*
     * Código correcto.
     *
     * Lo marcamos como usado.
     */
    await prisma.clinicalAccessCode.update({
      where: {
        id: accessCode.id,
      },

      data: {
        usedAt: new Date(),
      },
    });

    /*
     * Creamos un token aleatorio.
     * Al navegador mandamos el token real.
     * En la DB solamente guardamos su hash.
     */
    const sessionToken =
      crypto.randomBytes(32).toString("hex");

    const tokenHash =
      hashToken(sessionToken);

    const expiresAt = new Date(
      Date.now() +
        30 * 24 * 60 * 60 * 1000
    );

    await prisma.clinicalExternalSession.create({
      data: {
        doctorId: doctor.id,
        tokenHash,
        expiresAt,
      },
    });

    /*
     * Registramos el último acceso.
     */
    await prisma.clinicalAccess.update({
      where: {
        doctorId: doctor.id,
      },

      data: {
        lastAccessAt: new Date(),
      },
    });

    /*
     * Cookie exclusiva para el acceso externo
     * a historias clínicas.
     */
    const cookieStore = await cookies();

    cookieStore.set(
      "nazaret_clinical_access",
      sessionToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
      }
    );

    return NextResponse.json({
      success: true,

      doctor: {
        name: doctor.name,
      },

      message:
        "Identidad verificada correctamente.",
    });
  } catch (error) {
    console.error(
      "Error verificando código clínico:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo verificar el código de acceso.",
      },
      {
        status: 500,
      }
    );
  }
}