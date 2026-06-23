import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const plans = await prisma.plan.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const plan = await prisma.plan.create({
    data: {
      name: body.name,
      description: body.description,
      price: body.price ? Number(body.price) : null,
      discount: Number(body.discount),
      active: body.active,
    },
  });

  return NextResponse.json(plan);
}