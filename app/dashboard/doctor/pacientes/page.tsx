import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DoctorPacientesClient from "./DoctorPacientesClient";

export default async function DoctorPacientesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "DOCTOR") {
    redirect("/dashboard");
  }

  /*
   * Buscamos el perfil de odontólogo asociado
   * al usuario que inició sesión.
   */
  const doctor = await prisma.doctor.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      branches: {
        select: {
          branchId: true,
        },
      },
    },
  });

  if (!doctor) {
    return (
      <main className="min-h-screen bg-[#F7F5EF] px-5 py-8 md:px-10">
        <section className="border border-[#DED9CD] bg-white p-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#263F3B]">
            Perfil profesional no encontrado
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6B7774]">
            Tu usuario todavía no está asociado a un perfil de odontólogo.
            Comunicate con administración para completar la configuración.
          </p>
        </section>
      </main>
    );
  }

  /*
   * =====================================================
   * PACIENTES DEL ESPECIALISTA
   * =====================================================
   *
   * El vínculo se obtiene desde la HISTORIA CLÍNICA.
   *
   * En ClinicalHistory.data se guarda:
   *
   * {
   *   odontologo: "Victoria Garcia",
   *   ...
   * }
   *
   * Por lo tanto, un paciente aparece en el portal
   * del especialista cuando alguna de sus historias clínicas
   * tiene data.odontologo igual al nombre del especialista.
   *
   * NO usamos patient.doctorId.
   */

  const [histories, branches] = await Promise.all([
    prisma.clinicalHistory.findMany({
      where: {
        data: {
          path: ["odontologo"],
          equals: doctor.name,
        },
      },
      include: {
        patient: {
          include: {
            branch: true,
            plan: true,
          },
        },
      },
    }),

    /*
     * Mostramos solamente las sucursales a las
     * que pertenece este especialista.
     */
    prisma.branch.findMany({
      where: {
        id: {
          in: doctor.branches.map(
            (doctorBranch) => doctorBranch.branchId
          ),
        },
        active: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  /*
   * Una misma persona podría tener más de una Historia Clínica.
   * Por eso eliminamos pacientes duplicados.
   */
  const patientsMap = new Map<
    string,
    (typeof histories)[number]["patient"]
  >();

  for (const history of histories) {
    if (history.patient) {
      patientsMap.set(history.patient.id, history.patient);
    }
  }

  const patients = Array.from(patientsMap.values()).sort((a, b) => {
    const lastNameCompare = a.lastName.localeCompare(b.lastName);

    if (lastNameCompare !== 0) {
      return lastNameCompare;
    }

    return a.firstName.localeCompare(b.firstName);
  });

  return (
    <DoctorPacientesClient
      patients={patients}
      branches={branches}
    />
  );
}