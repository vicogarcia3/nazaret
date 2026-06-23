import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: "ADMIN",
    },
  });

  if (existingAdmin) {
    return NextResponse.json(
      {
        error: "Ya existe un administrador.",
      },
      {
        status: 400,
      }
    );
  }

  const data = await req.json();

  const hashedPassword = await bcrypt.hash(
    data.password,
    10
  );

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  await prisma.doctor.create({
    data: {
      userId: user.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}