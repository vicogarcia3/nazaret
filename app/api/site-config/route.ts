import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const config = await prisma.siteConfig.findFirst();

  return NextResponse.json(config);
}

export async function PUT(req: Request) {
  const data = await req.json();

  const config = await prisma.siteConfig.upsert({
    where: {
      id: 1,
    },
    update: data,
    create: {
      id: 1,
      ...data,
    },
  });

  return NextResponse.json(config);
}