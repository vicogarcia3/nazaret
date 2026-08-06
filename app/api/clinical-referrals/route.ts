import crypto from "crypto";

import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue || null;
}

function createToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  return {
    rawToken,
    tokenHash,
  };
}

/**
 * Lista las derivaciones creadas por la odontóloga autenticada.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const referringDoctor = await prisma.doctor.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!referringDoctor) {
      return NextResponse.json(
        {
          error:
            "La cuenta administradora no está vinculada a un perfil profesional.",
        },
        {
          status: 400,
        }
      );
    }

    const referrals = await prisma.clinicalReferral.findMany({
      where: {
        referredById: referringDoctor.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dni: true,
          },
        },

        specialist: {
          select: {
            id: true,
            name: true,
            specialty: true,
            professionalLicense: true,
          },
        },

        clinicalHistory: {
          select: {
            id: true,
          },
        },

        entry: {
          select: {
            id: true,
            diagnosis: true,
            treatment: true,
            evolution: true,
            indications: true,
            notes: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json(referrals);
  } catch (error) {
    console.error(
      "Error obteniendo derivaciones clínicas:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron cargar las derivaciones clínicas.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * Crea una derivación y genera un enlace privado.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const clinicalHistoryId =
      typeof body.clinicalHistoryId === "string"
        ? body.clinicalHistoryId.trim()
        : "";

    const specialistId =
      typeof body.specialistId === "string"
        ? body.specialistId.trim()
        : "";

    const reason = normalizeOptionalText(body.reason);
    const instructions = normalizeOptionalText(
      body.instructions
    );

    const expiresInDays =
      typeof body.expiresInDays === "number" &&
      Number.isInteger(body.expiresInDays)
        ? body.expiresInDays
        : 7;

    if (!clinicalHistoryId) {
      return NextResponse.json(
        {
          error: "Falta la historia clínica.",
        },
        {
          status: 400,
        }
      );
    }

    if (!specialistId) {
      return NextResponse.json(
        {
          error: "Seleccioná un especialista.",
        },
        {
          status: 400,
        }
      );
    }

    if (expiresInDays < 1 || expiresInDays > 30) {
      return NextResponse.json(
        {
          error:
            "La derivación debe vencer entre 1 y 30 días.",
        },
        {
          status: 400,
        }
      );
    }

    const referringDoctor = await prisma.doctor.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!referringDoctor) {
      return NextResponse.json(
        {
          error:
            "La cuenta administradora no está vinculada a un perfil profesional.",
        },
        {
          status: 400,
        }
      );
    }

    if (referringDoctor.id === specialistId) {
      return NextResponse.json(
        {
          error:
            "No podés derivarte una historia clínica a vos misma.",
        },
        {
          status: 400,
        }
      );
    }

    const [clinicalHistory, specialist] = await Promise.all([
      prisma.clinicalHistory.findUnique({
        where: {
          id: clinicalHistoryId,
        },
        select: {
          id: true,
          patientId: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),

      prisma.doctor.findUnique({
        where: {
          id: specialistId,
        },
        select: {
          id: true,
          name: true,
          specialty: true,
          active: true,
          visible: true,
        },
      }),
    ]);

    if (!clinicalHistory) {
      return NextResponse.json(
        {
          error: "La historia clínica no existe.",
        },
        {
          status: 404,
        }
      );
    }

    if (!specialist) {
      return NextResponse.json(
        {
          error: "El especialista no existe.",
        },
        {
          status: 404,
        }
      );
    }

    if (!specialist.active) {
      return NextResponse.json(
        {
          error:
            "El especialista seleccionado está inactivo.",
        },
        {
          status: 400,
        }
      );
    }

    const existingReferral =
      await prisma.clinicalReferral.findFirst({
        where: {
          clinicalHistoryId,
          specialistId,
          status: {
            in: ["PENDING", "OPENED"],
          },
          expiresAt: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
        },
      });

    if (existingReferral) {
      return NextResponse.json(
        {
          error:
            "Ya existe una derivación activa de esta historia para ese especialista.",
        },
        {
          status: 409,
        }
      );
    }

    const { rawToken, tokenHash } = createToken();

    const expiresAt = new Date();

    expiresAt.setDate(
      expiresAt.getDate() + expiresInDays
    );

    const referral = await prisma.clinicalReferral.create({
      data: {
        clinicalHistoryId: clinicalHistory.id,
        patientId: clinicalHistory.patientId,
        referredById: referringDoctor.id,
        specialistId: specialist.id,
        reason,
        instructions,
        tokenHash,
        expiresAt,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },

        specialist: {
          select: {
            id: true,
            name: true,
            specialty: true,
            professionalLicense: true,
          },
        },
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(request.url).origin;

    const referralUrl = `${baseUrl}/derivacion/${rawToken}`;

    return NextResponse.json(
      {
        message: "Derivación creada correctamente.",
        referral: {
          id: referral.id,
          status: referral.status,
          reason: referral.reason,
          instructions: referral.instructions,
          expiresAt: referral.expiresAt,
          createdAt: referral.createdAt,
          patient: referral.patient,
          specialist: referral.specialist,
        },
        referralUrl,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error creando derivación clínica:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo crear la derivación clínica.",
      },
      {
        status: 500,
      }
    );
  }
}