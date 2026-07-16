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

  try {
    const treatment = await prisma.treatment.update({
      where: {
        id,
      },
      data: {
        name: body.name,
        description: body.description || null,
        price: body.price ? Number(body.price) : null,
        active: body.active ?? true,
      },
    });

    return NextResponse.json(treatment);
  } catch (error) {
    console.error("PATCH Treatment:", error);

    return NextResponse.json(
      { error: "No se pudo actualizar el tratamiento." },
      { status: 500 }
    );
  }
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

  try {
    await prisma.treatment.update({
      where: {
        id,
      },
      data: {
        active: false,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE Treatment:", error);

    return NextResponse.json(
      { error: "No se pudo eliminar el tratamiento." },
      { status: 500 }
    );
  }
}