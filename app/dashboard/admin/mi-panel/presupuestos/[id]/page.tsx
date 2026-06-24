import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BudgetActions from "./BudgetActions";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PresupuestoDetallePage({ params }: Props) {
  const { id } = await params;

  const budget = await prisma.budget.findUnique({
    where: { id },
    include: {
      patient: {
        include: {
          user: true,
          plan: true,
        },
      },
      doctor: {
        include: {
          user: true,
        },
      },
      items: true,
    },
  });

  if (!budget) {
    notFound();
  }

  const whatsappMessage = `Hola ${budget.patient.firstName}, te enviamos tu presupuesto odontológico por un total de $${budget.total.toLocaleString(
    "es-AR"
  )}.`;

  const phone = budget.patient.phone.replace(/\D/g, "");

  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  return (
    <BudgetActions whatsappUrl={whatsappUrl} />
  );
}