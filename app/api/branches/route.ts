import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const branches = await prisma.branch.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json(branches);
}

export async function POST(req: Request) {
  const data = await req.json();

  const branch = await prisma.branch.create({
    data,
  });

  return NextResponse.json(branch);
}