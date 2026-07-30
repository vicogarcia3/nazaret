import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const email = session.user.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      role: true,
      patient: {
        select: {
          id: true,
        },
      },
      doctor: {
        select: {
          id: true,
        },
      },
    },
  });

  /*
   * Si ingresó por Google por primera vez y todavía
   * no existe como usuario en la base de datos.
   */
  if (!user) {
    redirect("/registro/google");
  }

  /*
   * Solo un paciente que todavía no completó sus datos
   * debe ingresar a la página de completar registro.
   */
  if (user.role === "PATIENT" && !user.patient) {
    redirect("/registro/google");
  }

  if (user.role === "ADMIN") {
    redirect("/dashboard/admin");
  }

  if (user.role === "DOCTOR") {
    redirect("/dashboard/doctor");
  }

  if (user.role === "PATIENT") {
    redirect("/dashboard/patient");
  }

  redirect("/login");
}