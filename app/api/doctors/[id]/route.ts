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

  const doctor = await prisma.doctor.findUnique({
    where: { id },
  });

  if (!doctor) {
    return NextResponse.json(
      { error: "Odontólogo no encontrado" },
      { status: 404 }
    );
  }

  if (body.name !== undefined || body.email !== undefined) {
    await prisma.user.update({
      where: { id: doctor.userId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email }),
      },
    });
  }

  if (Array.isArray(body.branchIds)) {
    await prisma.doctorBranch.deleteMany({
      where: { doctorId: id },
    });
  }

  const updatedDoctor = await prisma.doctor.update({
    where: { id },
    data: {
      ...(body.specialty !== undefined && { specialty: body.specialty }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.photo !== undefined && { photo: body.photo || null }),
      ...(body.active !== undefined && { active: body.active }),

      ...(Array.isArray(body.branchIds) && {
        branches: {
          create: body.branchIds.map((branchId: string) => ({
            branchId,
          })),
        },
      }),
    },
  });

  return NextResponse.json(updatedDoctor);
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

  const doctor = await prisma.doctor.findUnique({
    where: { id },
  });

  if (!doctor) {
    return NextResponse.json(
      { error: "Odontólogo no encontrado" },
      { status: 404 }
    );
  }

  const appointmentsCount = await prisma.appointment.count({
    where: { doctorId: id },
  });

  if (appointmentsCount > 0) {
    return NextResponse.json(
      {
        error:
          "No se puede eliminar este odontólogo porque tiene turnos asociados. Podés marcarlo como no visible.",
      },
      { status: 400 }
    );
  }

  await prisma.doctorBranch.deleteMany({
    where: { doctorId: id },
  });

  await prisma.doctor.delete({
    where: { id },
  });

  await prisma.user.delete({
    where: { id: doctor.userId },
  });

  return NextResponse.json({ message: "Odontólogo eliminado" });
}