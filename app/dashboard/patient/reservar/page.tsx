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
      
      <section>
        <article className="w-full border border-[#DED9CD] bg-white p-8">
          <ReservarTurnoClient treatments={treatments} />
        </article>
      </section>
    </div>
  );
}