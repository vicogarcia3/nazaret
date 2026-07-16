import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcrypt";

export async function GET() {
  const doctors = await prisma.doctor.findMany({
    include: {
      user: true,
      branches: {
        include: {
          branch: true,
        },
      },
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });

  return NextResponse.json(doctors);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  console.log("BODY DOCTOR:", body);

  const password = body.password || "nazaret123";
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "Ya existe un usuario con ese email." },
      { status: 400 }
    );
  }


  const branchIds =
  Array.isArray(body.branchIds)
    ? body.branchIds
    : Array.isArray(body.branches)
    ? body.branches
    : [];

  const doctor = await prisma.doctor.create({
    data: {
      specialty: body.specialty,
      description: body.description,
      photo: body.photo || null,
      active: body.active ?? true,
      user: {
        create: {
          name: body.name,
          email: body.email,
          password: hashedPassword,
          role: "DOCTOR",
        },
      },
      branches:
        branchIds.length > 0
          ? {
              create: branchIds.map((branchId: string) => ({
                branchId,
              })),
            }
          : undefined,
    },
  });

  return NextResponse.json(doctor);
}