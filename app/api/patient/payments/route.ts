import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
  });

  if (!patient) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
  }

  const payments = await prisma.payment.findMany({
    where: { patientId: patient.id },
    include: {
      budget: true,
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  return NextResponse.json(payments);
}