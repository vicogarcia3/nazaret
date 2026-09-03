import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import {
  getClinicalExternalSession,
  canExternalDoctorAccessPatient,
} from "@/lib/clinical-external-auth";

import ExternalClinicalHistoryViewer from "./ExternalClinicalHistoryViewer";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ExternalClinicalHistoryPage({
  params,
}: Props) {
  const clinicalSession =
    await getClinicalExternalSession();

  if (!clinicalSession) {
    redirect("/acceso-clinico");
  }

  const { id } = await params;

  /*
   * Si tiene "compartir todas", debe pertenecer
   * a una sucursal del doctor. Si tiene selección
   * puntual, alcanza con estar en esa lista
   * (sin importar la sucursal).
   */
  const hasAccess = await canExternalDoctorAccessPatient(
    clinicalSession.doctor.id,
    clinicalSession.clinicalAccess,
    id
  );

  if (!hasAccess) {
    redirect("/historias-clinicas");
  }

  const patient = await prisma.patient.findUnique({
    where: {
      id,
    },

    include: {
      branch: true,

      histories: {
        orderBy: {
          updatedAt: "desc",
        },

        take: 1,

        include: {
          annexEntries: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
  });

  if (!patient) {
    notFound();
  }

  const history = patient.histories[0];

  if (!history) {
    notFound();
  }

  const historyData =
    history.data &&
    typeof history.data === "object" &&
    !Array.isArray(history.data)
      ? history.data
      : {};

  const serializedEntries = history.annexEntries.map(
    (entry) => ({
      id: entry.id,

      professionalName: entry.professionalName,

      treatment: entry.treatment,

      indications: entry.indications,

      debit:
        entry.debit !== null
          ? Number(entry.debit)
          : null,

      credit:
        entry.credit !== null
          ? Number(entry.credit)
          : null,

      balance:
        entry.balance !== null
          ? Number(entry.balance)
          : null,

      performedAt: entry.performedAt.toISOString(),

      nextAppointment: entry.nextAppointment
        ? entry.nextAppointment.toISOString()
        : null,

      patientSignature: entry.patientSignature,

      createdAt: entry.createdAt.toISOString(),

      updatedAt: entry.updatedAt.toISOString(),

      isOwn:
        entry.createdByDoctorId ===
        clinicalSession.doctor.id,
    })
  );

  return (
    <ExternalClinicalHistoryViewer
      patient={{
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dni: patient.dni,
        phone: patient.phone,
        email: patient.email,
        branchName: patient.branch.name,
        branchCity: patient.branch.city,
      }}
      history={{
        id: history.id,
        diagnosis: history.diagnosis,
        treatment: history.treatment,
        data: historyData,
        updatedAt: history.updatedAt.toISOString(),
      }}
      doctor={{
        id: clinicalSession.doctor.id,
        name: clinicalSession.doctor.name,
      }}
      entries={serializedEntries}
    />
  );
}