import { prisma } from "@/lib/prisma";
import PacientesClient from "./PacientesClient";

export const dynamic = "force-dynamic";

export default async function PacientesPage() {
  const patients = await prisma.patient.findMany({
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

  const plans = await prisma.plan.findMany({
    where: {
      active: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <PacientesClient
      patients={patients}
      branches={branches}
      plans={plans}
    />
  );
}