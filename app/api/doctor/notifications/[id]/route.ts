import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      (session.user.role !== "DOCTOR" &&
        session.user.role !== "ADMIN")
    ) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const doctor = await prisma.doctor.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Especialista no encontrado." },
        { status: 404 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const notification =
      await prisma.notification.findFirst({
        where: {
          id,
          doctorId: doctor.id,
        },
      });

    if (!notification) {
      return NextResponse.json(
        { error: "Notificación no encontrada." },
        { status: 404 }
      );
    }

    const updatedNotification =
      await prisma.notification.update({
        where: {
          id,
        },
        data: {
          read:
            typeof body.read === "boolean"
              ? body.read
              : true,
        },
      });

    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error(
      "Error al actualizar notificación:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo actualizar la notificación.",
      },
      { status: 500 }
    );
  }
}