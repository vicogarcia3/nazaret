import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const services = await prisma.service.findMany({
    orderBy: { title: "asc" },
  });

  return NextResponse.json(services);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const service = await prisma.service.create({
    data: {
      title: body.title,
      description: body.description,
      image: body.image || null,
    },
  });

  return NextResponse.json(service);
}