import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json();

  const patient = await prisma.patient.update({
    where: { id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      dni: body.dni,
      phone: body.phone,
      branchId: body.branchId,
      planId: body.planId || null,
    },
    include: {
      branch: true,
      plan: true,
    },
  });

  return NextResponse.json(patient);
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  const appointmentsCount = await prisma.appointment.count({
    where: { patientId: id },
  });

  if (appointmentsCount > 0) {
    return NextResponse.json(
      {
        error:
          "No se puede eliminar este paciente porque tiene turnos asociados. Podés editar sus datos, pero no borrarlo.",
      },
      { status: 400 }
    );
  }

  await prisma.patient.delete({
    where: { id },
  });

  return NextResponse.json({
    message: "Paciente eliminado",
  });
}