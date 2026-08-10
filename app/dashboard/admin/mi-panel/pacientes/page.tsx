import { prisma } from "@/lib/prisma";
import PacientesClient from "./PacientesClient";

export const dynamic = "force-dynamic";

export default async function PacientesPage() {
  const patientsRaw = await prisma.patient.findMany({
    include: {
      user: true,
      branch: true,
      plan: true,
    },
    orderBy: {
      lastName: "asc",
    },
  });

  const branches = await prisma.branch.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const plansRaw = await prisma.plan.findMany({
    where: {
      visible: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const patients = patientsRaw.map((patient) => ({
    ...patient,
    plan: patient.plan
      ? {
          ...patient.plan,
          price:
            patient.plan.price !== null
              ? Number(patient.plan.price)
              : null,
          discount: Number(patient.plan.discount),
        }
      : null,
  }));

  const plans = plansRaw.map((plan) => ({
    ...plan,
    price:
      plan.price !== null
        ? Number(plan.price)
        : null,
    discount: Number(plan.discount),
  }));

  return (
    <PacientesClient
      patients={patients}
      branches={branches}
      plans={plans}
    />
  );
}