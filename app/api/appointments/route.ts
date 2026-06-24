import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

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

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const appointment = await prisma.appointment.create({
    data: {
      patientId: body.patientId,
      doctorId: body.doctorId,
      branchId: body.branchId,
      date: new Date(body.date),
      notes: body.notes || null,
      status: body.status || "CONFIRMED",
    },
  });

  return NextResponse.json(appointment);
}