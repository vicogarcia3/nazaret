import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const patients = await prisma.patient.findMany({
    include: {
      branch: true,
      plan: true,
      user: true,
    },
    orderBy: {
      lastName: "asc",
    },
  });

  return NextResponse.json(patients);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const patient = await prisma.patient.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      dni: body.dni,
      phone: body.phone,
      branchId: body.branchId,
      PlanId: body.PlanId || null,
    },
  });

  return NextResponse.json(patient);
}