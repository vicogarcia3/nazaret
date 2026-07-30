import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import DoctorDashboardShell from "./components/DoctorDashboardShell";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (
    !session?.user?.id ||
    session.user.role !== "DOCTOR"
  ) {
    redirect("/login");
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  if (!doctor) {
    redirect("/login");
  }

  const doctorName =
    doctor.user.name?.trim() || "Especialista";

  return (
    <DoctorDashboardShell
      doctorName={doctorName}
      initials={getInitials(doctorName) || "DR"}
      doctorImage={doctor.user.image}
      clinicName="Consultorios Nazaret"
      logoUrl={null}
    >
      {children}
    </DoctorDashboardShell>
  );
}