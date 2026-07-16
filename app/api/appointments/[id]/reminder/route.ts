import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.appointment.update({
    where: { id },
    data: {
      reminderSent: true,
    },
  });

  return NextResponse.json({ ok: true });
}