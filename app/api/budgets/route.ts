import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const budgets = await prisma.budget.findMany({
    include: {
      patient: {
        include: {
          plan: true,
          branch: true,
        },
      },
      doctor: {
        include: {
          user: true,
        },
      },
      items: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(budgets);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const patient = await prisma.patient.findUnique({
    where: { id: body.patientId },
    include: {
      plan: true,
    },
  });

  if (!patient) {
    return NextResponse.json(
      { error: "Paciente no encontrado" },
      { status: 404 }
    );
  }

  const items = body.items || [];

  const subtotal = items.reduce((acc: number, item: any) => {
    return acc + Number(item.unitPrice || 0);
  }, 0);

  const discount = patient.plan?.active
    ? Number(patient.plan.discount)
    : 0;

  const total = subtotal - subtotal * (discount / 100);

  const budget = await prisma.budget.create({
    data: {
      patientId: body.patientId,
      doctorId: body.doctorId,
      description: null,
      subtotal,
      discount,
      total,
      items: {
        create: items.map((item: any) => ({
            serviceName: item.serviceName,
            quantity: 1,
            unitPrice: Number(item.unitPrice),
            total: Number(item.unitPrice),
        })),
      },
    },
    include: {
        items: true,
        patient: true,
        doctor: {
            include: {
                user: true,
            },
        },
    },
  });

  return NextResponse.json(budget);
}