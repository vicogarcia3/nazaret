import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const WEEKDAY_NAMES: Record<number, string> = {
  0: "domingo",
  1: "lunes",
  2: "martes",
  3: "miércoles",
  4: "jueves",
  5: "viernes",
  6: "sábado",
};

type CreateScheduleBody = {
  doctorId?: string;
  branchId?: string;
  weekdays?: number[];
  startTime?: string;
  endTime?: string;
};

function schedulesOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string
) {
  return firstStart < secondEnd && firstEnd > secondStart;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const schedules = await prisma.doctorSchedule.findMany({
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
        branch: true,
      },
      orderBy: [
        {
          doctor: {
            user: {
              name: "asc",
            },
          },
        },
        {
          weekday: "asc",
        },
        {
          startTime: "asc",
        },
      ],
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error al obtener la agenda semanal:", error);

    return NextResponse.json(
      { error: "No se pudo obtener la agenda semanal." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CreateScheduleBody;

    const doctorId = body.doctorId?.trim();
    const branchId = body.branchId?.trim();
    const startTime = body.startTime?.trim();
    const endTime = body.endTime?.trim();

    const weekdays = Array.from(
      new Set(
        Array.isArray(body.weekdays)
          ? body.weekdays.filter(
              (weekday) =>
                Number.isInteger(weekday) &&
                weekday >= 0 &&
                weekday <= 6
            )
          : []
      )
    );

    if (
      !doctorId ||
      !branchId ||
      weekdays.length === 0 ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        {
          error:
            "Seleccioná un especialista, al menos un día y el horario completo.",
        },
        { status: 400 }
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        {
          error:
            "La hora de inicio debe ser anterior a la hora de finalización.",
        },
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
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
        branch: true,
      },
    });

    if (!doctorBranch) {
      return NextResponse.json(
        {
          error:
            "El especialista no está asignado a la sucursal seleccionada.",
        },
        { status: 400 }
      );
    }

    const existingSchedules = await prisma.doctorSchedule.findMany({
      where: {
        doctorId,
        weekday: {
          in: weekdays,
        },
        active: true,
      },
      include: {
        branch: true,
      },
    });

    for (const weekday of weekdays) {
      const schedulesForDay = existingSchedules.filter(
        (schedule) => schedule.weekday === weekday
      );

      const scheduleInAnotherBranch = schedulesForDay.find(
        (schedule) => schedule.branchId !== branchId
      );

      if (scheduleInAnotherBranch) {
        const weekdayName = WEEKDAY_NAMES[weekday];
        const doctorName =
          doctorBranch.doctor.user.name || "El especialista";

        return NextResponse.json(
          {
            error: `${doctorName} ya tiene horarios asignados los ${weekdayName} en la sucursal ${scheduleInAnotherBranch.branch.name}. No puede atender en dos sucursales el mismo día.`,
          },
          { status: 409 }
        );
      }

      const overlappingSchedule = schedulesForDay.find((schedule) =>
        schedulesOverlap(
          startTime,
          endTime,
          schedule.startTime,
          schedule.endTime
        )
      );

      if (overlappingSchedule) {
        const weekdayName = WEEKDAY_NAMES[weekday];

        return NextResponse.json(
          {
            error: `El horario de los ${weekdayName} se superpone con el rango ${overlappingSchedule.startTime} a ${overlappingSchedule.endTime}.`,
          },
          { status: 409 }
        );
      }
    }

    const createdSchedules = await prisma.$transaction(
      weekdays.map((weekday) =>
        prisma.doctorSchedule.create({
          data: {
            doctorId,
            branchId,
            weekday,
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
        })
      )
    );

    return NextResponse.json(createdSchedules, { status: 201 });
  } catch (error) {
    console.error("Error al guardar la agenda semanal:", error);

    return NextResponse.json(
      { error: "No se pudo guardar la agenda semanal." },
      { status: 500 }
    );
  }
}