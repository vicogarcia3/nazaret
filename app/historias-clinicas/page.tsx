import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getClinicalExternalSession } from "@/lib/clinical-external-auth";

import ExternalClinicalHistories from "./ExternalClinicalHistories";

export default async function ExternalClinicalHistoriesPage() {
  const clinicalSession =
    await getClinicalExternalSession();

  if (!clinicalSession) {
    redirect("/acceso-clinico");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
        id: clinicalSession.doctor.id,
    },
    select: {
        branches: {
        select: {
            branchId: true,
        },
        },
    },
    });

    if (!doctor) {
    redirect("/acceso-clinico");
    }

    const branchIds = doctor.branches.map(
    (branch) => branch.branchId
    );

  const patients = await prisma.patient.findMany({
    where: {
        branchId: {
        in: branchIds,
        },
    },

    include: {
        branch: true,

        histories: {
        orderBy: {
            updatedAt: "desc",
        },

        take: 1,

        select: {
            id: true,
            createdAt: true,
            updatedAt: true,
        },
        },
    },

    orderBy: [
        {
        lastName: "asc",
        },
        {
        firstName: "asc",
        },
    ],
    });

  const serializedPatients = patients.map(
    (patient) => ({
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dni: patient.dni,
      branchName: patient.branch.name,
      branchCity: patient.branch.city,

      history: patient.histories[0]
        ? {
            id: patient.histories[0].id,

            createdAt:
              patient.histories[0].createdAt.toISOString(),

            updatedAt:
              patient.histories[0].updatedAt.toISOString(),
          }
        : null,
    })
  );

  return (
    <ExternalClinicalHistories
      doctor={clinicalSession.doctor}
      patients={serializedPatients}
    />
  );
}