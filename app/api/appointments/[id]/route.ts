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

  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      ...(body.date && { date: new Date(body.date) }),
      ...(body.status && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });

  return NextResponse.json(appointment);
}