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
      amount: Number(body.amount),
      concept: body.concept || null,
      patientId: body.patientId,
      dueDate: new Date(body.dueDate),
      status: body.status || "PENDING",
      paidAt: body.status === "PAID" ? new Date() : null,
    },
  });

  return NextResponse.json(payment);
}