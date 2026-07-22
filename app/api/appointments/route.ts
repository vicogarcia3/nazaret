import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  if (session.user.role === "ADMIN") {
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
        branch: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json(appointments);
  }

  if (session.user.role === "DOCTOR") {
    const doctor = await prisma.doctor.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        branches: {
          select: {
            branchId: true,
          },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Perfil de odontólogo no encontrado" },
        { status: 404 }
      );
    }

    const branchIds = doctor.branches.map(
      (doctorBranch) => doctorBranch.branchId
    );

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        branchId: {
          in: branchIds,
        },
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
        branch: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json(appointments);
  }

  return NextResponse.json(
    { error: "No autorizado" },
    { status: 403 }
  );
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    if (
      !body.patientId ||
      !body.doctorId ||
      !body.branchId ||
      !body.date ||
      !body.time
    ) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    const appointmentDate = new Date(
      `${body.date}T${body.time}:00`
    );

    if (Number.isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        { error: "Fecha u horario inválido" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: body.patientId,
        doctorId: body.doctorId,
        branchId: body.branchId,
        date: appointmentDate,
        notes: body.notes?.trim() || null,
        status: "PENDING",
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: true,
          },
        },
        branch: true,
      },
    });

    return NextResponse.json(appointment, {
      status: 201,
    });
  } catch (error) {
    console.error("ERROR CREANDO TURNO:", error);

    return NextResponse.json(
      { error: "No se pudo crear el turno" },
      { status: 500 }
    );
  }
}