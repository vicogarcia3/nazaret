import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function parseDate(year: number, month: number, day: number) {
  return new Date(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}T00:00:00-03:00`
  );
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "PATIENT") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const doctorId = searchParams.get("doctorId");
    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));

    if (
      !doctorId ||
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return NextResponse.json([]);
    }

    const patient = await prisma.patient.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        branchId: true,
      },
    });

    if (!patient) {
      return NextResponse.json([]);
    }

    const branchId = patient.branchId;

    const doctorBranch = await prisma.doctorBranch.findUnique({
      where: {
        doctorId_branchId: {
          doctorId,
          branchId,
        },
      },
    });

    if (!doctorBranch) {
      return NextResponse.json([]);
    }

    const monthStart = parseDate(year, month, 1);
    const monthEnd = new Date(
      `${year}-${String(month).padStart(2, "0")}-${String(
        getDaysInMonth(year, month)
      ).padStart(2, "0")}T23:59:59-03:00`
    );

    /*
     * Agenda semanal habitual del especialista en la sucursal del paciente.
     */
    const weeklySchedules = await prisma.doctorSchedule.findMany({
      where: {
        doctorId,
        branchId,
        active: true,
      },
      select: {
        weekday: true,
      },
    });

    const weeklyDays = new Set(
      weeklySchedules.map((schedule) => schedule.weekday)
    );

    /*
     * Fechas específicas del especialista durante el mes.
     *
     * Se buscan en todas las sucursales porque una fecha específica
     * reemplaza la agenda semanal habitual de ese día.
     */
    const specificSchedules =
      await prisma.doctorSpecificSchedule.findMany({
        where: {
          doctorId,
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        select: {
          branchId: true,
          date: true,
        },
      });

    const specificDates = new Map<string, Set<string>>();

    for (const schedule of specificSchedules) {
      const dateKey = formatDate(schedule.date);

      const branchIds = specificDates.get(dateKey) || new Set<string>();

      branchIds.add(schedule.branchId);

      specificDates.set(dateKey, branchIds);
    }

    /*
     * Excepciones: fechas en las que el especialista no atiende.
     */
    const exceptions = await prisma.doctorScheduleException.findMany({
      where: {
        doctorId,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        date: true,
      },
    });

    const exceptionDates = new Set(
      exceptions.map((exception) => formatDate(exception.date))
    );

    const availableDates: string[] = [];
    const daysInMonth = getDaysInMonth(year, month);

    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    for (let day = 1; day <= daysInMonth; day += 1) {
      const currentDate = parseDate(year, month, day);
      const dateKey = formatDate(currentDate);

      /*
       * No mostrar fechas pasadas.
       */
      if (currentDate < todayStart) {
        continue;
      }

      /*
       * Una excepción bloquea completamente el día.
       */
      if (exceptionDates.has(dateKey)) {
        continue;
      }

      const branchesForSpecificDate = specificDates.get(dateKey);

      /*
       * Si existe una fecha específica para el especialista,
       * ese día reemplaza la agenda semanal.
       *
       * Solo se habilita en la sucursal donde fue cargada.
       */
      if (branchesForSpecificDate) {
        if (branchesForSpecificDate.has(branchId)) {
          availableDates.push(dateKey);
        }

        continue;
      }

      /*
       * Si no hay fecha específica, se usa la agenda semanal.
       */
      const weekday = currentDate.getDay();

      if (weeklyDays.has(weekday)) {
        availableDates.push(dateKey);
      }
    }

    return NextResponse.json(availableDates);
  } catch (error) {
    console.error(
      "Error al obtener las fechas disponibles:",
      error
    );

    return NextResponse.json(
      {
        error: "No se pudieron obtener las fechas disponibles.",
      },
      {
        status: 500,
      }
    );
  }
}