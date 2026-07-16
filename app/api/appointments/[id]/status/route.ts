import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();

  const allowedStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELED"];

  if (!allowedStatuses.includes(body.status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      status: body.status,
    },
  });

  return NextResponse.json(appointment);
}