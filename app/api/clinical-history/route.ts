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
    return NextResponse.json({ error: "Falta patientId" }, { status: 400 });
  }

  const history = await prisma.clinicalHistory.findFirst({
    where: { patientId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(history);
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.patientId) {
      return NextResponse.json({ error: "Falta patientId" }, { status: 400 });
    }

    const existingHistory = await prisma.clinicalHistory.findFirst({
      where: { patientId: body.patientId },
      orderBy: { updatedAt: "desc" },
    });

    const payload = {
      diagnosis: body.diagnosis || null,
      treatment: body.treatment || null,
      data: body.data || {},
    };

    const history = existingHistory
      ? await prisma.clinicalHistory.update({
          where: { id: existingHistory.id },
          data: payload,
        })
      : await prisma.clinicalHistory.create({
          data: {
            patientId: body.patientId,
            ...payload,
          },
        });

    return NextResponse.json(history);
  } catch (error) {
    console.error("ERROR_GUARDANDO_HISTORIA_CLINICA:", error);

    return NextResponse.json(
      { error: "Error interno al guardar historia clínica" },
      { status: 500 }
    );
  }
}