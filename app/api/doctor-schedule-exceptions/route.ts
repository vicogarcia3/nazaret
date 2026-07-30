import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Body = {
  doctorId?: string;
  branchId?: string;
  date?: string;
  reason?: string;
};

function parseDate(date: string) {
  return new Date(`${date}T00:00:00-03:00`);
}

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const exceptions = await prisma.doctorScheduleException.findMany({
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
        branch: true,
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json(exceptions);
  } catch (error) {
    console.error("Error al obtener excepciones:", error);

    return NextResponse.json(
      { error: "No se pudieron obtener las excepciones." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = (await request.json()) as Body;

    const doctorId = body.doctorId?.trim();
    const branchId = body.branchId?.trim();
    const date = body.date?.trim();
    const reason = body.reason?.trim() || null;

    if (!doctorId || !branchId || !date) {
      return NextResponse.json(
        { error: "Seleccioná especialista y fecha." },
        { status: 400 }
      );
    }

    const parsedDate = parseDate(date);

    const existing = await prisma.doctorScheduleException.findUnique({
      where: {
        doctorId_date: {
          doctorId,
          date: parsedDate,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ese especialista ya está bloqueado en esa fecha." },
        { status: 409 }
      );
    }

    const specificSchedules =
      await prisma.doctorSpecificSchedule.findMany({
        where: {
          doctorId,
          date: parsedDate,
        },
      });

    if (specificSchedules.length > 0) {
      return NextResponse.json(
        {
          error:
            "El especialista tiene horarios específicos cargados para esa fecha. Eliminálos antes de bloquear el día.",
        },
        { status: 409 }
      );
    }

    const exception = await prisma.doctorScheduleException.create({
      data: {
        doctorId,
        branchId,
        date: parsedDate,
        reason,
      },
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
        branch: true,
      },
    });

    return NextResponse.json(exception, { status: 201 });
  } catch (error) {
    console.error("Error al crear excepción:", error);

    return NextResponse.json(
      { error: "No se pudo bloquear la fecha." },
      { status: 500 }
    );
  }
}