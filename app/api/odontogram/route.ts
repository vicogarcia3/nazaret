import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");

  if (!patientId) {
    return NextResponse.json(
      { error: "Falta patientId" },
      { status: 400 }
    );
  }

  const odontogram = await prisma.odontogram.findUnique({
    where: { patientId },
  });

  return NextResponse.json(odontogram);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const odontogram = await prisma.odontogram.upsert({
    where: {
      patientId: body.patientId,
    },
    update: {
      data: body.data,
    },
    create: {
      patientId: body.patientId,
      data: body.data,
    },
  });

  return NextResponse.json(odontogram);
}