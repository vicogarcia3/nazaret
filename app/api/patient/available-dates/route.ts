import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  const doctorId = searchParams.get("doctorId");
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));

  if (!doctorId || !year || !month) {
    return NextResponse.json([]);
  }

  const patient = await prisma.patient.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!patient) {
    return NextResponse.json([]);
  }

  const monthStart = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00-03:00`);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  const availabilities = await prisma.doctorAvailability.findMany({
    where: {
      doctorId,
      branchId: patient.branchId,
      date: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });

  const dates = availabilities.map((availability) => {
    const date = new Date(availability.date);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  });

  return NextResponse.json(dates);
}