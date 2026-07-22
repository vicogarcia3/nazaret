import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PatientShell from "@/components/patient/PatientShell";

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      firstName: true,
      lastName: true,

      user: {
        select: {
          image: true,
        },
      },
    },
  });

  if (!patient) {
    redirect("/login");
  }

  const patientName =
    `${patient.firstName} ${patient.lastName}`.trim() || "Paciente";

  const initials =
    `${patient.firstName?.charAt(0) ?? ""}${
      patient.lastName?.charAt(0) ?? ""
    }`.toUpperCase() || "P";

  /*
   * Estos dos valores son temporales.
   * Después los reemplazaremos por los datos configurados
   * por la administradora.
   */
  const clinicName = "Consultorios Nazaret";
  const logoUrl: string | null = null;

  return (
    <PatientShell
      patientName={patientName}
      initials={initials}
      patientImage={patient.user?.image ?? null}
      clinicName={clinicName}
      logoUrl={logoUrl}
    >
      {children}
    </PatientShell>
  );
}