import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const body = await req.json();

  const branch = await prisma.branch.update({
    where: { id },
    data: {
      name: body.name,
      city: body.city,
      address: body.address,
      phone: body.phone || null,
    },
  });

  return NextResponse.json(branch);
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  await prisma.branch.delete({
    where: { id },
  });

  return NextResponse.json({
    message: "Sucursal eliminada correctamente",
  });
}