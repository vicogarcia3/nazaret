import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: "ADMIN",
    },
  });

  if (existingAdmin) {
    return NextResponse.json(
      { error: "Ya existe un administrador" },
      { status: 400 }
    );
  }

  const data = await req.json();

  const password = await bcrypt.hash(
    data.password,
    10
  );

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password,
      role: "ADMIN",
    },
  });

  await prisma.doctor.create({
    data: {
      userId: user.id,
    },
  });

  await prisma.siteConfig.create({
    data: {
      clinicName: data.clinicName,
      heroTitle: "Tu sonrisa, nuestra prioridad",
      heroSubtitle:
        "Atención odontológica integral.",
    },
  });

  return NextResponse.json({
    success: true,
  });
}