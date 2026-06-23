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

  const hashedPassword = await bcrypt.hash(body.password, 10);

  const doctor = await prisma.doctor.create({
    data: {
      specialty: body.specialty,
      description: body.description,
      photo: body.photo || null,
      active: body.active,
      user: {
        create: {
          name: body.name,
          email: body.email,
          password: hashedPassword,
          role: "DOCTOR",
        },
      },
      branches: {
        create: body.branchIds.map((branchId: string) => ({
          branchId,
        })),
      },
    },
  });

  return NextResponse.json(doctor);
}