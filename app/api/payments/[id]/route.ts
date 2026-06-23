import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      amount: Number(body.amount),
      concept: body.concept || null,
      dueDate: new Date(body.dueDate),
      status: body.status,
      paidAt: body.status === "PAID" ? new Date() : null,
    },
  });

  return NextResponse.json(payment);
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  await prisma.payment.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Pago eliminado" });
}