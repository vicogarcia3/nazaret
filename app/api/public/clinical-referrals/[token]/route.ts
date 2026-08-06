import crypto from "crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

function hashToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue || null;
}

async function findReferralByToken(token: string) {
  const tokenHash = hashToken(token);

  return prisma.clinicalReferral.findUnique({
    where: {
      tokenHash,
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dni: true,
          birthDate: true,
        },
      },

      referredBy: {
        select: {
          id: true,
          name: true,
          specialty: true,
          professionalLicense: true,
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
        include: {
          entries: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              professionalName: true,
              professionalLicense: true,
              diagnosis: true,
              treatment: true,
              evolution: true,
              indications: true,
              notes: true,
              createdAt: true,
            },
          },
        },
      },

      entry: true,
    },
  });
}

/**
 * Devuelve únicamente la historia derivada.
 * No necesita sesión.
 */
export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json(
        {
          error: "El enlace no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    const referral = await findReferralByToken(token);

    if (!referral) {
      return NextResponse.json(
        {
          error:
            "La derivación no existe o el enlace no es válido.",
        },
        {
          status: 404,
        }
      );
    }

    const now = new Date();

    if (
      referral.status === "REVOKED" ||
      referral.revokedAt
    ) {
      return NextResponse.json(
        {
          error:
            "El acceso a esta derivación fue revocado.",
        },
        {
          status: 410,
        }
      );
    }

    if (
      referral.status === "COMPLETED" ||
      referral.completedAt
    ) {
      return NextResponse.json(
        {
          error:
            "Esta derivación ya fue finalizada.",
          completed: true,
        },
        {
          status: 410,
        }
      );
    }

    if (referral.expiresAt <= now) {
      if (referral.status !== "EXPIRED") {
        await prisma.clinicalReferral.update({
          where: {
            id: referral.id,
          },
          data: {
            status: "EXPIRED",
          },
        });
      }

      return NextResponse.json(
        {
          error: "El enlace de derivación venció.",
        },
        {
          status: 410,
        }
      );
    }

    if (referral.status === "PENDING") {
      await prisma.clinicalReferral.update({
        where: {
          id: referral.id,
        },
        data: {
          status: "OPENED",
          openedAt: referral.openedAt || now,
        },
      });
    }

    return NextResponse.json({
      id: referral.id,

      status:
        referral.status === "PENDING"
          ? "OPENED"
          : referral.status,

      reason: referral.reason,
      instructions: referral.instructions,
      expiresAt: referral.expiresAt,
      createdAt: referral.createdAt,

      patient: referral.patient,
      referredBy: referral.referredBy,
      specialist: referral.specialist,

      clinicalHistory: {
        id: referral.clinicalHistory.id,
        diagnosis: referral.clinicalHistory.diagnosis,
        treatment: referral.clinicalHistory.treatment,
        data: referral.clinicalHistory.data,
        entries: referral.clinicalHistory.entries,
      },

      draft: referral.entry
        ? {
            diagnosis: referral.entry.diagnosis,
            treatment: referral.entry.treatment,
            evolution: referral.entry.evolution,
            indications: referral.entry.indications,
            notes: referral.entry.notes,
          }
        : null,
    });
  } catch (error) {
    console.error(
      "Error obteniendo derivación pública:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo cargar la derivación clínica.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * Guarda un borrador de la intervención.
 */
export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { token } = await context.params;
    const body = await request.json();

    const referral = await findReferralByToken(token);

    if (!referral) {
      return NextResponse.json(
        {
          error: "La derivación no existe.",
        },
        {
          status: 404,
        }
      );
    }

    const now = new Date();

    if (
      referral.status === "REVOKED" ||
      referral.revokedAt
    ) {
      return NextResponse.json(
        {
          error:
            "El acceso a esta derivación fue revocado.",
        },
        {
          status: 410,
        }
      );
    }

    if (
      referral.status === "COMPLETED" ||
      referral.completedAt
    ) {
      return NextResponse.json(
        {
          error:
            "Esta derivación ya fue finalizada.",
        },
        {
          status: 410,
        }
      );
    }

    if (referral.expiresAt <= now) {
      return NextResponse.json(
        {
          error: "El enlace de derivación venció.",
        },
        {
          status: 410,
        }
      );
    }

    const diagnosis = normalizeOptionalText(
      body.diagnosis
    );

    const treatment = normalizeOptionalText(
      body.treatment
    );

    const evolution = normalizeOptionalText(
      body.evolution
    );

    const indications = normalizeOptionalText(
      body.indications
    );

    const notes = normalizeOptionalText(body.notes);

    const entry = await prisma.clinicalHistoryEntry.upsert({
      where: {
        referralId: referral.id,
      },

      update: {
        diagnosis,
        treatment,
        evolution,
        indications,
        notes,
      },

      create: {
        clinicalHistoryId:
          referral.clinicalHistoryId,

        doctorId: referral.specialistId,
        referralId: referral.id,

        professionalName:
          referral.specialist.name ||
          "Especialista derivado",

        professionalLicense:
          referral.specialist.professionalLicense,

        diagnosis,
        treatment,
        evolution,
        indications,
        notes,
      },
    });

    if (referral.status === "PENDING") {
      await prisma.clinicalReferral.update({
        where: {
          id: referral.id,
        },
        data: {
          status: "OPENED",
          openedAt: now,
        },
      });
    }

    return NextResponse.json({
      message: "Borrador guardado correctamente.",
      entry,
    });
  } catch (error) {
    console.error(
      "Error guardando borrador de derivación:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo guardar el borrador.",
      },
      {
        status: 500,
      }
    );
  }
}