import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELED",
] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

function isAllowedStatus(value: unknown): value is AllowedStatus {
  return (
    typeof value === "string" &&
    ALLOWED_STATUSES.includes(value as AllowedStatus)
  );
}

async function getDoctorProfile(userId: string) {
  return prisma.doctor.findUnique({
    where: {
      userId,
    },
    include: {
      branches: {
        select: {
          branchId: true,
        },
      },
    },
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const doctor = await getDoctorProfile(session.user.id);

    if (!doctor) {
      return NextResponse.json(
        { error: "Perfil de odontólogo no encontrado." },
        { status: 404 }
      );
    }

    const { id } = await context.params;
    const branchIds = doctor.branches.map((branch) => branch.branchId);

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        doctorId: doctor.id,
        branchId: {
          in: branchIds,
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            dni: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        branch: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Turno no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("ERROR CONSULTANDO TURNO DEL DOCTOR:", error);

    return NextResponse.json(
      { error: "No se pudo consultar el turno." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const doctor = await getDoctorProfile(session.user.id);

    if (!doctor) {
      return NextResponse.json(
        { error: "Perfil de odontólogo no encontrado." },
        { status: 404 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const branchIds = doctor.branches.map((branch) => branch.branchId);

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        doctorId: doctor.id,
        branchId: {
          in: branchIds,
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        {
          error:
            "El turno no existe o no pertenece a este profesional.",
        },
        { status: 404 }
      );
    }

    if (
      body.status !== undefined &&
      !isAllowedStatus(body.status)
    ) {
      return NextResponse.json(
        { error: "El estado seleccionado no es válido." },
        { status: 400 }
      );
    }

    if (
      appointment.status === "COMPLETED" &&
      body.status &&
      body.status !== "COMPLETED"
    ) {
      return NextResponse.json(
        {
          error:
            "Un turno completado no puede volver a otro estado.",
        },
        { status: 400 }
      );
    }

    const updatedAppointment = await prisma.appointment.update({
      where: {
        id: appointment.id,
      },
      data: {
        ...(body.status !== undefined && {
          status: body.status,
        }),
        ...(body.notes !== undefined && {
          notes:
            typeof body.notes === "string" && body.notes.trim()
              ? body.notes.trim()
              : null,
        }),
        ...(body.status === "CANCELED" && {
          reminderSent: false,
        }),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            dni: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        branch: true,
      },
    });

    return NextResponse.json({
      message: "Turno actualizado correctamente.",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("ERROR ACTUALIZANDO TURNO DEL DOCTOR:", error);

    return NextResponse.json(
      { error: "No se pudo actualizar el turno." },
      { status: 500 }
    );
  }
}