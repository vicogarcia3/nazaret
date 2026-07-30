import { NextRequest, NextResponse } from "next/server";
import { AppointmentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type TimeRange = {
  startTime: string;
  endTime: string;
};

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

/*
 * Ejemplo:
 *
 * Agenda: 09:30 a 18:30
 *
 * Primer turno: 10:00
 * Último turno: 18:00
 */
function generateSlots(startTime: string, endTime: string) {
  const slots: string[] = [];

  const firstSlot = timeToMinutes(startTime) + 30;
  const lastSlot = timeToMinutes(endTime) - 30;

  if (firstSlot > lastSlot) {
    return slots;
  }

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

    if (!session?.user || session.user.role !== "PATIENT") {
      return NextResponse.json(
        {
          error: "No autorizado",
        },
        {
          status: 401,
        }
      );
    }

    const doctorId =
      request.nextUrl.searchParams.get("doctorId");

    const dateParam =
      request.nextUrl.searchParams.get("date");

    if (!doctorId || !dateParam) {
      return NextResponse.json(
        {
          error: "Faltan doctorId o date.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * La sucursal se obtiene desde el paciente autenticado.
     * No dependemos de un branchId enviado desde el navegador.
     */
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

    const doctorBranch =
      await prisma.doctorBranch.findUnique({
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

    const selectedDate = parseDate(dateParam);

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

    const nextDate = addDays(selectedDate, 1);

    /*
     * 1. Una excepción bloquea completamente la fecha.
     */
    const exception =
      await prisma.doctorScheduleException.findUnique({
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
     * 2. Las fechas específicas reemplazan la agenda semanal.
     *
     * Se buscan en todas las sucursales porque una fecha específica
     * puede indicar que ese día el especialista atiende en otra sede.
     */
    const allSpecificSchedules =
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

    if (allSpecificSchedules.length > 0) {
      ranges = allSpecificSchedules
        .filter(
          (schedule) =>
            schedule.branchId === branchId
        )
        .map((schedule) => ({
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        }));
    } else {
      /*
       * 3. Si no existe una fecha específica,
       * usamos la agenda semanal habitual.
       */
      const weekday = selectedDate.getDay();

      const weeklySchedules =
        await prisma.doctorSchedule.findMany({
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
     * Generamos los turnos de todos los rangos.
     * También admite horarios partidos.
     */
    const generatedTimes = Array.from(
      new Set(
        ranges.flatMap((range) =>
          generateSlots(
            range.startTime,
            range.endTime
          )
        )
      )
    ).sort();

    /*
     * 4. Obtenemos los turnos ocupados.
     */
    const appointments =
      await prisma.appointment.findMany({
        where: {
          doctorId,
          branchId,
          date: {
            gte: selectedDate,
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

    /*
     * 5. Devolvemos solamente los horarios libres,
     * en el formato que espera ReservarTurnoClient.
     */
    const availableTimes = generatedTimes.filter(
      (time) => !occupiedTimes.has(time)
    );

    return NextResponse.json(availableTimes);
  } catch (error) {
    console.error(
      "Error al calcular horarios disponibles:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron calcular los horarios disponibles.",
      },
      {
        status: 500,
      }
    );
  }
}