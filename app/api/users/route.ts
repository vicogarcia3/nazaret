import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  const currentUser = users.find((user) => user.id === session.user.id);

  return NextResponse.json({
    currentUser,
    admins: users.filter((user) => user.role === "ADMIN"),
    doctors: users.filter((user) => user.role === "DOCTOR"),
    patients: users.filter((user) => user.role === "PATIENT"),
  });
}