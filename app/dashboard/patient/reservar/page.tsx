import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import ReservarTurnoClient from "./ReservarTurnoClient";

export default async function ReservarTurnoPage() {
  const treatments = await prisma.treatment.findMany({
    where: {
      active: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="min-h-screen bg-[#F7F5EF]">
      <div className="mx-auto max-w-7xl px-2 py-4">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/dashboard/patient"
              className="mb-5 inline-flex items-center gap-2 text-sm text-[#A2B38B]"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>

            <h1 className="font-serif text-4xl">
              Reservar turno
            </h1>

            <p className="mt-2 text-sm text-[#6B7774]">
              Elegí el tratamiento que necesitás.
            </p>
          </div>
        </div>
      </div>

      <section>
        <article className="w-full border border-[#DED9CD] bg-white p-8">
          <ReservarTurnoClient treatments={treatments} />
        </article>
      </section>
    </div>
  );
}