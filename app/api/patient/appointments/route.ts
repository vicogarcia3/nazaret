import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const { doctorId, date, time, treatmentName } = body;

  if (!doctorId) {
    return NextResponse.json(
      { error: "Tenés que seleccionar un especialista." },
      { status: 400 }
    );
  }

  if (!date || !time) {
    return NextResponse.json(
      { error: "Tenés que seleccionar fecha y horario." },
      { status: 400 }
    );
  }

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

  const doctorInBranch = await prisma.doctor.findFirst({
    where: {
      id: doctorId,
      active: true,
      branches: {
        some: {
          branchId: patient.branchId,
        },
      },
    },
  });

  if (!doctorInBranch) {
    return NextResponse.json(
      { error: "El especialista no pertenece a tu sucursal." },
      { status: 400 }
    );
  }

  const appointmentDate = new Date(`${date}T${time}:00-03:00`);

  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      doctorId,
      branchId: patient.branchId,
      date: appointmentDate,
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
      doctorId,
      branchId: patient.branchId,
      date: appointmentDate,
      notes: treatmentName || "Turno solicitado",
      status: "PENDING",
    },
  });

  return NextResponse.json(appointment);
}