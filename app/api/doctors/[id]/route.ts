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
    return NextResponse.json({ error: "Odontólogo no encontrado" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: doctor.userId },
    data: {
      name: body.name,
      email: body.email,
    },
  });

  await prisma.doctorBranch.deleteMany({
    where: { doctorId: id },
  });

  const updatedDoctor = await prisma.doctor.update({
    where: { id },
    data: {
      specialty: body.specialty,
      description: body.description,
      photo: body.photo || null,
      active: body.active,
      branches: {
        create: body.branchIds.map((branchId: string) => ({
          branchId,
        })),
      },
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
    return NextResponse.json({ error: "Odontólogo no encontrado" }, { status: 404 });
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