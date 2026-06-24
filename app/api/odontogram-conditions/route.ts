import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const conditions = await prisma.odontogramCondition.findMany({
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json(conditions);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const condition = await prisma.odontogramCondition.create({
    data: {
      name: body.name,
      color: body.color,
    },
  });

  return NextResponse.json(condition);
}