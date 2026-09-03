import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import ClinicalHistoriesManager from "./ClinicalHistoriesManager";

export default async function ClinicalHistoriesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const patients = await prisma.patient.findMany({
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

  const doctors = await prisma.doctor.findMany({
    where: {
      active: true,
    },

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

    orderBy: {
      name: "asc",
    },
  });

  const serializedPatients = patients.map((patient) => ({
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    dni: patient.dni,

    branchId: patient.branch.id,
    branchName: patient.branch.name,
    branchCity: patient.branch.city,
    branchAddress: patient.branch.address,

    history: patient.histories[0]
      ? {
          id: patient.histories[0].id,
          createdAt:
            patient.histories[0].createdAt.toISOString(),
          updatedAt:
            patient.histories[0].updatedAt.toISOString(),
        }
      : null,
  }));

  const serializedDoctors = doctors.map((doctor) => ({
    id: doctor.id,
    name: doctor.name,
    email: doctor.email,
    specialty: doctor.specialty,
    professionalLicense:
      doctor.professionalLicense,

    hasClinicalAccess:
      doctor.clinicalAccess?.active === true,

    shareAll:
      doctor.clinicalAccess?.shareAll !== false,

    sharedPatientIds:
      doctor.clinicalAccess?.sharedPatients.map(
        (shared) => shared.patientId
      ) ?? [],
  }));

  return (
    <ClinicalHistoriesManager
      patients={serializedPatients}
      doctors={serializedDoctors}
    />
  );
}