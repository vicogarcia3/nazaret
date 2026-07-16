import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const expenses = await prisma.expense.findMany({
    include: {
      branch: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const expense = await prisma.expense.create({
    data: {
      concept: body.concept,
      category: body.category,
      amount: Number(body.amount),
      date: new Date(`${body.date}T12:00:00-03:00`),
      branchId: body.branchId || null,
    },
  });

  return NextResponse.json(expense);
}