import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type Body = {
  doctorId?: string;
  branchId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
};

function overlaps(
  startA: string,
  endA: string,
  startB: string,
  endB: string
) {
  return startA < endB && endA > startB;
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00-03:00`);
}

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const schedules = await prisma.doctorSpecificSchedule.findMany({
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
        branch: true,
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error al obtener fechas específicas:", error);

    return NextResponse.json(
      { error: "No se pudieron obtener las fechas específicas." },
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
    const startTime = body.startTime?.trim();
    const endTime = body.endTime?.trim();

    if (!doctorId || !branchId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Completá todos los datos obligatorios." },
        { status: 400 }
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        { error: "La hora de inicio debe ser anterior a la hora final." },
        { status: 400 }
      );
    }

    const doctorBranch = await prisma.doctorBranch.findUnique({
      where: {
        doctorId_branchId: {
          doctorId,
          branchId,
        },
      },
    });

    if (!doctorBranch) {
      return NextResponse.json(
        { error: "El especialista no pertenece a esta sucursal." },
        { status: 400 }
      );
    }

    const parsedDate = parseDate(date);

    const exception = await prisma.doctorScheduleException.findUnique({
      where: {
        doctorId_date: {
          doctorId,
          date: parsedDate,
        },
      },
    });

    if (exception) {
      return NextResponse.json(
        {
          error:
            "El especialista está marcado como no disponible en esa fecha. Eliminá primero la excepción.",
        },
        { status: 409 }
      );
    }

    const existing = await prisma.doctorSpecificSchedule.findMany({
      where: {
        doctorId,
        date: parsedDate,
      },
      include: {
        branch: true,
      },
    });

    const anotherBranch = existing.find(
      (schedule) => schedule.branchId !== branchId
    );

    if (anotherBranch) {
      return NextResponse.json(
        {
          error: `El especialista ya tiene una fecha específica asignada ese día en ${anotherBranch.branch.name}.`,
        },
        { status: 409 }
      );
    }

    const overlapping = existing.find((schedule) =>
      overlaps(
        startTime,
        endTime,
        schedule.startTime,
        schedule.endTime
      )
    );

    if (overlapping) {
      return NextResponse.json(
        {
          error: `El horario se superpone con ${overlapping.startTime} a ${overlapping.endTime}.`,
        },
        { status: 409 }
      );
    }

    const schedule = await prisma.doctorSpecificSchedule.create({
      data: {
        doctorId,
        branchId,
        date: parsedDate,
        startTime,
        endTime,
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

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Error al crear fecha específica:", error);

    return NextResponse.json(
      { error: "No se pudo guardar la fecha específica." },
      { status: 500 }
    );
  }
}