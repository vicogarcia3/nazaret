import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const payments = await prisma.payment.findMany({
    include: {
      patient: {
        include: {
          branch: true,
          plan: true,
        },
      },
      budget: true,
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  return NextResponse.json(payments);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const payment = await prisma.payment.create({
    data: {
      patientId: body.patientId,
      budgetId: body.budgetId || null,
      amount: Number(body.amount),
      concept: body.concept || null,
      dueDate: new Date(`${body.dueDate}T12:00:00`),      status: body.status || "PENDING",
      paidAt: body.status === "PAID" ? new Date() : null,
    },
  });

  if (body.budgetId) {
  const paidPayments = await prisma.payment.findMany({
    where: {
      budgetId: body.budgetId,
      status: "PAID",
    },
  });

  const totalPaid = paidPayments.reduce((acc, payment) => {
    return acc + Number(payment.amount);
  }, 0);

  const budget = await prisma.budget.findUnique({
    where: {
      id: body.budgetId,
    },
  });

  if (budget) {
    await prisma.budget.update({
      where: {
        id: body.budgetId,
      },
      data: {
        status:
          totalPaid >= Number(budget.total)
            ? "COMPLETED"
            : "IN_PROGRESS",
      },
    });
  }
}

  if (body.budgetId) {
    const paidPayments = await prisma.payment.findMany({
      where: {
        budgetId: body.budgetId,
        status: "PAID",
      },
    });

    const totalPaid = paidPayments.reduce((acc, payment) => {
      return acc + Number(payment.amount);
    }, 0);

    const budget = await prisma.budget.findUnique({
      where: {
        id: body.budgetId,
      },
    });

    if (budget) {
      await prisma.budget.update({
        where: {
          id: body.budgetId,
        },
        data: {
          status:
            totalPaid >= Number(budget.total)
              ? "COMPLETED"
              : "IN_PROGRESS",
        },
      });
    }
  }

  return NextResponse.json(payment);
}