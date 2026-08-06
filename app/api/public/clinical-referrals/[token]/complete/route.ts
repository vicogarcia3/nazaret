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

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { token } = await context.params;
    const body = await request.json();

    const tokenHash = hashToken(token);

    const referral =
      await prisma.clinicalReferral.findUnique({
        where: {
          tokenHash,
        },
        include: {
          specialist: {
            select: {
              id: true,
              name: true,
              professionalLicense: true,
            },
          },
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

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
          status: 409,
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

    if (
      !diagnosis &&
      !treatment &&
      !evolution &&
      !indications &&
      !notes
    ) {
      return NextResponse.json(
        {
          error:
            "Completá al menos un campo antes de finalizar.",
        },
        {
          status: 400,
        }
      );
    }

    const result = await prisma.$transaction(
      async (transaction) => {
        const entry =
          await transaction.clinicalHistoryEntry.upsert({
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
                referral.specialist
                  .professionalLicense,
              diagnosis,
              treatment,
              evolution,
              indications,
              notes,
            },
          });

        const completedReferral =
          await transaction.clinicalReferral.update({
            where: {
              id: referral.id,
            },
            data: {
              status: "COMPLETED",
              completedAt: now,
            },
          });

        await transaction.notification.create({
          data: {
            doctorId: referral.referredById,
            patientId: referral.patientId,
            clinicalHistoryId:
              referral.clinicalHistoryId,
            title: "Derivación completada",
            message: `${
              referral.specialist.name ||
              "El especialista"
            } completó la derivación clínica de ${
              referral.patient.firstName
            } ${referral.patient.lastName}.`,
            type: "CLINICAL_HISTORY",
            actor: "DOCTOR",
            actionUrl: `/dashboard/admin/mi-panel/pacientes/${referral.patientId}`,
          },
        });

        return {
          entry,
          referral: completedReferral,
        };
      }
    );

    return NextResponse.json({
      message:
        "La derivación fue finalizada correctamente.",
      result,
    });
  } catch (error) {
    console.error(
      "Error finalizando derivación clínica:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo finalizar la derivación.",
      },
      {
        status: 500,
      }
    );
  }
}