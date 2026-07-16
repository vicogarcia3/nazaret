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

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      whatsappReminderSent: true,
      whatsappReminderSentAt: new Date(),
    },
  });

  return NextResponse.json(payment);
}