import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type TimeRange = {
  startTime: string;
  endTime: string;
};

function parseDate(date: string) {
  return new Date(`${date}T00:00:00-03:00`);
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

/**
 * Ejemplo:
 *
 * Horario cargado: 09:00 a 18:00
 *
 * Primer turno: 09:30
 * Último turno: 17:30
 */
function buildSlots(startTime: string, endTime: string) {
  const slots: string[] = [];

  const firstSlot = timeToMinutes(startTime) + 30;
  const lastSlot = timeToMinutes(endTime) - 30;

  if (firstSlot > lastSlot) {
    return slots;
  }

  for (
    let currentTime = firstSlot;
    currentTime <= lastSlot;
    currentTime += 30
  ) {
    slots.push(minutesToTime(currentTime));
  }

  return slots;
}

function formatAppointmentTime(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    /*
     * Esta API actualmente forma parte de la agenda administrativa.
     * Por eso conservamos ADMIN.
     *
     * Si la misma ruta también se usa desde la reserva del paciente,
     * después podemos permitir ADMIN y PATIENT.
     */
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "No autorizado",
        },
        {
          status: 401,
        }
      );
    }

    const { searchParams } = new URL(request.url);

    const branchId = searchParams.get("branchId");
    const doctorId = searchParams.get("doctorId");
    const dateParam = searchParams.get("date");

    if (!branchId || !doctorId || !dateParam) {
      return NextResponse.json([]);
    }

    const selectedDate = parseDate(dateParam);
    const nextDate = addDays(selectedDate, 1);

    if (Number.isNaN(selectedDate.getTime())) {
      return NextResponse.json(
        {
          error: "La fecha seleccionada no es válida.",
        },
        {
          status: 400,
        }
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
      return NextResponse.json([]);
    }

    /*
     * 1. Primero verificamos si el especialista está bloqueado
     *    completamente para esa fecha.
     */
    const exception = await prisma.doctorScheduleException.findUnique({
      where: {
        doctorId_date: {
          doctorId,
          date: selectedDate,
        },
      },
    });

    if (exception) {
      return NextResponse.json([]);
    }

    /*
     * 2. Buscamos todas las fechas específicas del especialista
     *    para ese día, sin filtrar primero por sucursal.
     *
     * Esto es importante porque una fecha específica reemplaza
     * la agenda semanal habitual de ese día.
     *
     * Ejemplo:
     * Virginia atiende normalmente el lunes en Córdoba,
     * pero el 17/08 atiende en Ballesteros.
     *
     * Ese día solo deben utilizarse los horarios específicos
     * cargados para Ballesteros.
     */
    const specificSchedules =
      await prisma.doctorSpecificSchedule.findMany({
        where: {
          doctorId,
          date: selectedDate,
        },
        orderBy: {
          startTime: "asc",
        },
      });

    let ranges: TimeRange[] = [];

    if (specificSchedules.length > 0) {
      ranges = specificSchedules
        .filter((schedule) => schedule.branchId === branchId)
        .map((schedule) => ({
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        }));
    } else {
      /*
       * 3. Si no hay una fecha específica, usamos la agenda
       *    semanal habitual.
       */
      const weekday = selectedDate.getDay();

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
      return NextResponse.json([]);
    }

    /*
     * Admite horarios partidos:
     *
     * 09:00 a 13:00
     * 15:00 a 18:00
     */
    const generatedSlots = Array.from(
      new Set(
        ranges.flatMap((range) =>
          buildSlots(range.startTime, range.endTime)
        )
      )
    ).sort();

    /*
     * 4. Buscamos turnos ocupados del especialista en esa fecha.
     */
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        branchId,
        date: {
          gte: selectedDate,
          lt: nextDate,
        },
        status: {
          not: "CANCELED",
        },
      },
      select: {
        date: true,
      },
    });

    const occupiedTimes = new Set(
      appointments.map((appointment) =>
        formatAppointmentTime(appointment.date)
      )
    );

    /*
     * 5. Devolvemos únicamente los horarios libres.
     */
    const availableTimes = generatedSlots.filter(
      (slot) => !occupiedTimes.has(slot)
    );

    return NextResponse.json(availableTimes);
  } catch (error) {
    console.error(
      "Error al obtener los horarios disponibles:",
      error
    );

    return NextResponse.json(
      {
        error: "No se pudieron obtener los horarios disponibles.",
      },
      {
        status: 500,
      }
    );
  }
}