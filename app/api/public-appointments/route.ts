import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const appointments = await prisma.appointment.findMany({
    select: {
      id: true,
      date: true,
      doctorId: true,
      branchId: true,
      status: true,
    },
  });

  return NextResponse.json(appointments);
}