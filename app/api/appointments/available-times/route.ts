import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

function buildSlots(startTime: string, endTime: string) {
  const slots: string[] = [];

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  let hour = startHour;
  let minute = startMinute;

  while (hour < endHour || (hour === endHour && minute < endMinute)) {
    slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);

    minute += 30;

    if (minute >= 60) {
      minute = 0;
      hour += 1;
    }
  }

  return slots;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Argentina/Cordoba",
  });
}

function parseBranchHours(hours?: string | null) {
  if (!hours || hours.toLowerCase().includes("cerrado")) return null;

  const normalized = hours.replace("—", "-").replace("–", "-");
  const [startTime, endTime] = normalized.split("-").map((value) => value.trim());

  if (!startTime || !endTime) return null;

  return { startTime, endTime };
}

function getBranchHoursForDate(branch: any, date: string) {
  const selectedDate = new Date(`${date}T00:00:00-03:00`);
  const day = selectedDate.getDay();

  if (day >= 1 && day <= 5) {
    return parseBranchHours(branch.mondayToFridayHours);
  }

  if (day === 6) {
    return parseBranchHours(branch.saturdayHours);
  }

  return parseBranchHours(branch.sundayHours);
}

export async function GET(req: Request) {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  const branchId = searchParams.get("branchId");
  const doctorId = searchParams.get("doctorId");
  const date = searchParams.get("date");

  if (!branchId || !doctorId || !date) {
    return NextResponse.json([]);
  }

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
  });

  if (!branch) {
    return NextResponse.json([]);
  }

  const dayStart = new Date(`${date}T00:00:00-03:00`);
  const dayEnd = new Date(`${date}T23:59:59-03:00`);

  const availability = await prisma.doctorAvailability.findFirst({
    where: {
      doctorId,
      branchId,
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
  });

  let startTime = "";
  let endTime = "";

  if (availability) {
    startTime = availability.startTime;
    endTime = availability.endTime;
  } else {
    const branchHours = getBranchHoursForDate(branch, date);

    if (!branchHours) {
      return NextResponse.json([]);
    }

    startTime = branchHours.startTime;
    endTime = branchHours.endTime;
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      branchId,
      doctorId,
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
      status: {
        not: "CANCELED",
      },
    },
  });

  const occupiedTimes = appointments.map((appointment) =>
    formatTime(new Date(appointment.date))
  );

  const allSlots = buildSlots(startTime, endTime);

  const availableTimes = allSlots.filter(
    (slot) => !occupiedTimes.includes(slot)
  );

  return NextResponse.json(availableTimes);
}