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

  const service = await prisma.service.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      image: body.image || null,
      active: body.active,
    },
  });

  return NextResponse.json(service);
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

  await prisma.service.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Especialidad eliminada" });
}