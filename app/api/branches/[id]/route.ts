import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function updateBranch(req: Request, id: string) {
  try {
    const body = await req.json();

    console.log(body);

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        name: body.name,
        city: body.city,
        address: body.address,
        phone: body.phone || null,
        mapUrl: body.mapUrl || null,
        mondayToFridayHours: body.mondayToFridayHours || null,
        saturdayHours: body.saturdayHours || null,
        sundayHours: body.sundayHours || null,
        active: body.active ?? true,
      },
    });

    return NextResponse.json(branch);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

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

  return updateBranch(req, id);
}

export async function PATCH(
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

  return updateBranch(req, id);
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