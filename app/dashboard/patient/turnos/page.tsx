import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PatientTurnsClient from "./PatientTurnsClient";

export default async function PatientTurnsPage() {
  const session = await auth();

  if (!session?.user?.id) return null;

  const patient = await prisma.patient.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!patient) return null;

  const appointments = await prisma.appointment.findMany({
    where: {
      patientId: patient.id,
      status: {
        not: "CANCELED",
      },
    },
    include: {
      doctor: {
        include: {
          user: true,
        },
      },
      branch: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  return <PatientTurnsClient appointments={appointments} />;
}