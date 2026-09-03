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
            clinicalAccess: {
              include: {
                sharedPatients: {
                  select: {
                    patientId: true,
                  },
                },
              },
            },
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

    /*
     * Alcance de historias clínicas habilitado
     * para este especialista: todas, o solo
     * las de los pacientes puntuales listados.
     */
    clinicalAccess: {
      shareAll: session.doctor.clinicalAccess.shareAll,
      patientIds:
        session.doctor.clinicalAccess.sharedPatients.map(
          (shared) => shared.patientId
        ),
    },

    expiresAt: session.expiresAt,
  };
}

/*
 * Valida si un doctor con sesión externa puede
 * ver la historia clínica de un paciente puntual:
 * - Si tiene "compartir todas", debe pertenecer
 *   a una de sus sucursales.
 * - Si tiene selección puntual, debe estar en
 *   la lista de pacientes compartidos.
 */
export async function canExternalDoctorAccessPatient(
  doctorId: string,
  clinicalAccessScope: {
    shareAll: boolean;
    patientIds: string[];
  },
  patientId: string
) {
  if (!clinicalAccessScope.shareAll) {
    return clinicalAccessScope.patientIds.includes(
      patientId
    );
  }

  const doctorBranches =
    await prisma.doctorBranch.findMany({
      where: {
        doctorId,
      },
      select: {
        branchId: true,
      },
    });

  const branchIds = doctorBranches.map(
    (branch) => branch.branchId
  );

  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      branchId: {
        in: branchIds,
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(patient);
}