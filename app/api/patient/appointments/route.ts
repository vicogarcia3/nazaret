import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const patient = await prisma.patient.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!patient) {
    return NextResponse.json(
      { error: "Paciente no encontrado" },
      { status: 404 }
    );
  }

  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      doctorId: body.doctorId,
      branchId: body.branchId,
      date: new Date(body.date),
      status: {
        not: "CANCELED",
      },
    },
  });

  if (existingAppointment) {
    return NextResponse.json(
      { error: "Ese horario ya no está disponible" },
      { status: 400 }
    );
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: body.doctorId,
      branchId: body.branchId,
      date: new Date(body.date),
      notes: body.notes || null,
      status: "PENDING",
    },
  });

  return NextResponse.json(appointment);
}