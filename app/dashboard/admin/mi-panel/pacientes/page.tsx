import { prisma } from "@/lib/prisma";
import Link from "next/link";

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Mis pacientes</h1>
        <p className="mt-2 text-gray-500">
          Pacientes registrados en el consultorio.
        </p>
      </div>

      <div className="grid gap-4">
        {patients.map((patient) => (
          <Link
            key={patient.id}
            href={`/dashboard/admin/mi-panel/pacientes/${patient.id}`}
            className="rounded-xl border bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-2xl font-semibold">
              {patient.lastName}, {patient.firstName}
            </h2>

            <p className="mt-1 text-gray-500">
              DNI: {patient.dni}
            </p>

            <p className="mt-2">
              Teléfono: {patient.phone}
            </p>

            <p>
              Sucursal: {patient.branch.name} — {patient.branch.address}
            </p>

            <p>
              Plan: {patient.plan ? patient.plan.name : "Sin plan"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}