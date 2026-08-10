import crypto from "crypto";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

const CLINICAL_COOKIE_NAME =
  "nazaret_clinical_access";

function hashToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function getClinicalExternalSession() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get(CLINICAL_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);

  const session =
    await prisma.clinicalExternalSession.findUnique({
      where: {
        tokenHash,
      },

      include: {
        doctor: {
          include: {
            clinicalAccess: true,
          },
        },
      },
    });

  if (!session) {
    return null;
  }

  /*
   * Sesión revocada.
   */
  if (session.revokedAt) {
    return null;
  }

  /*
   * Sesión vencida.
   */
  if (session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  /*
   * El especialista debe seguir activo.
   */
  if (!session.doctor.active) {
    return null;
  }

  /*
   * La admin debe seguir teniendo habilitado
   * el acceso a historias clínicas.
   */
  if (
    !session.doctor.clinicalAccess ||
    !session.doctor.clinicalAccess.active
  ) {
    return null;
  }

  return {
    sessionId: session.id,

    doctor: {
      id: session.doctor.id,
      name: session.doctor.name,
      email: session.doctor.email,
      specialty: session.doctor.specialty,
      professionalLicense:
        session.doctor.professionalLicense,
    },

    expiresAt: session.expiresAt,
  };
}