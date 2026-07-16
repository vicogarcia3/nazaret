import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
  });

  if (payment.budgetId) {
    const budget = await prisma.budget.findUnique({
      where: { id: payment.budgetId },
    });

    if (budget) {
      const paidPayments = await prisma.payment.findMany({
        where: {
          budgetId: payment.budgetId,
          status: "PAID",
        },
      });

      const totalPaid = paidPayments.reduce((acc, item) => {
        return acc + Number(item.amount);
      }, 0);

      const budgetTotal = Number(budget.total);

      console.log("Budget ID:", budget.id);
      console.log("Total presupuesto:", budgetTotal);
      console.log("Total pagado:", totalPaid);

      const newStatus =
        totalPaid >= budgetTotal ? "COMPLETED" : "IN_PROGRESS";

      await prisma.budget.update({
        where: { id: payment.budgetId },
        data: {
          status: newStatus,
        },
      });

      console.log("Nuevo estado presupuesto:", newStatus);
    }
  }

  return NextResponse.json(payment);
}