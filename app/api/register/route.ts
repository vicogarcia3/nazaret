import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.json();

  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    return NextResponse.json(
      {
        error: "El correo ya está registrado.",
      },
      {
        status: 400,
      }
    );
  }

  const hashedPassword = await bcrypt.hash(
    data.password,
    10
  );

  const user = await prisma.user.create({
    data: {
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      password: hashedPassword,
      role: "PATIENT",
    },
  });

  await prisma.patient.create({
    data: {
      userId: user.id,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email,
      dni: data.dni,
      branchId: data.branchId,
    },
  });

  return NextResponse.json({
    success: true,
  });
}