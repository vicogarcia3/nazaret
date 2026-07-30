import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AppointmentStatus } from "@prisma/client";

function parseDate(date: string) {
  return new Date(`${date}T00:00:00-03:00`);
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(
    remainingMinutes
  ).padStart(2, "0")}`;
}

function generateSlots(startTime: string, endTime: string) {
  const slots: string[] = [];

  const firstSlot = timeToMinutes(startTime) + 30;
  const lastSlot = timeToMinutes(endTime) - 30;

  for (
    let current = firstSlot;
    current <= lastSlot;
    current += 30
  ) {
    slots.push(minutesToTime(current));
  }

  return slots;
}

function getAppointmentTime(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "PATIENT") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const doctorId = request.nextUrl.searchParams.get("doctorId");
    const branchId = request.nextUrl.searchParams.get("branchId");
    const dateParam = request.nextUrl.searchParams.get("date");

    if (!doctorId || !branchId || !dateParam) {
      return NextResponse.json(
        { error: "Faltan doctorId, branchId o date." },
        { status: 400 }
      );
    }

    const date = parseDate(dateParam);
    const nextDate = addDays(date, 1);

    const exception = await prisma.doctorScheduleException.findUnique({
      where: {
        doctorId_date: {
          doctorId,
          date,
        },
      },
    });

    if (exception) {
      return NextResponse.json({
        available: false,
        source: "EXCEPTION",
        times: [],
      });
    }

    const allSpecificSchedules =
      await prisma.doctorSpecificSchedule.findMany({
        where: {
          doctorId,
          date,
        },
        orderBy: {
          startTime: "asc",
        },
      });

    let ranges: {
      startTime: string;
      endTime: string;
    }[] = [];

    let source: "SPECIFIC" | "WEEKLY" = "WEEKLY";

    if (allSpecificSchedules.length > 0) {
      source = "SPECIFIC";

      ranges = allSpecificSchedules
        .filter((schedule) => schedule.branchId === branchId)
        .map((schedule) => ({
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        }));
    } else {
      const weekday = date.getDay();

      const weeklySchedules = await prisma.doctorSchedule.findMany({
        where: {
          doctorId,
          branchId,
          weekday,
          active: true,
        },
        orderBy: {
          startTime: "asc",
        },
      });

      ranges = weeklySchedules.map((schedule) => ({
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      }));
    }

    if (ranges.length === 0) {
      return NextResponse.json({
        available: false,
        source,
        times: [],
      });
    }

    const generatedTimes = Array.from(
      new Set(
        ranges.flatMap((range) =>
          generateSlots(range.startTime, range.endTime)
        )
      )
    ).sort();

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        branchId,
        date: {
          gte: date,
          lt: nextDate,
        },
        status: {
          not: AppointmentStatus.CANCELED,
        },
      },
      select: {
        date: true,
      },
    });

    const occupiedTimes = new Set(
      appointments.map((appointment) =>
        getAppointmentTime(appointment.date)
      )
    );

    const availableTimes = generatedTimes.filter(
      (time) => !occupiedTimes.has(time)
    );

    return NextResponse.json({
      available: availableTimes.length > 0,
      source,
      times: availableTimes,
    });
  } catch (error) {
    console.error("Error al calcular horarios:", error);

    return NextResponse.json(
      { error: "No se pudieron calcular los horarios disponibles." },
      { status: 500 }
    );
  }
}