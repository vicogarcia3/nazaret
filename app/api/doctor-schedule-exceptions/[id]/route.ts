import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Context = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  _request: Request,
  context: Context
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;

    const exception = await prisma.doctorScheduleException.findUnique({
      where: { id },
    });

    if (!exception) {
      return NextResponse.json(
        { error: "La excepción no existe." },
        { status: 404 }
      );
    }

    await prisma.doctorScheduleException.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar excepción:", error);

    return NextResponse.json(
      { error: "No se pudo eliminar la excepción." },
      { status: 500 }
    );
  }
}