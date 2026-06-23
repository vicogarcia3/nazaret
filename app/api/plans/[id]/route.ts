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

  const plan = await prisma.plan.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      price: body.price ? Number(body.price) : null,
      discount: Number(body.discount),
      active: body.active,
    },
  });

  return NextResponse.json(plan);
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

  await prisma.plan.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Plan eliminado" });
}