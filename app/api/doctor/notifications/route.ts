import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    if (
      !session?.user ||
      session.user.role !== "DOCTOR"
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

    const notifications = await prisma.notification.findMany({
      where: {
        doctorId: doctor.id,
        patientId: null, // 👈 AGREGAR ESTA LÍNEA
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error(
      "Error al obtener notificaciones:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron obtener las notificaciones.",
      },
      { status: 500 }
    );
  }
}