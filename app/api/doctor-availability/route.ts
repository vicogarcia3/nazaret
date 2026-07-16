import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const availabilities = await prisma.doctorAvailability.findMany({
    include: {
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

  return NextResponse.json(availabilities);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  if (!body.doctorId || !body.branchId || !body.date || !body.startTime || !body.endTime) {
    return NextResponse.json(
      { error: "Faltan datos obligatorios" },
      { status: 400 }
    );
  }

  const availability = await prisma.doctorAvailability.create({
    data: {
      doctorId: body.doctorId,
      branchId: body.branchId,
      date: new Date(`${body.date}T00:00:00-03:00`),
      startTime: body.startTime,
      endTime: body.endTime,
    },
  });

  return NextResponse.json(availability);
}