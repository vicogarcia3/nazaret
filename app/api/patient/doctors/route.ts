import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    console.log("SESSION PATIENT DOCTORS:", session);

    if (!session || session.user.role !== "PATIENT") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
    });

    console.log("PATIENT FOUND:", patient);

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    const doctors = await prisma.doctor.findMany({
      where: {
        active: true,
        branches: {
          some: {
            branchId: patient.branchId,
          },
        },
      },
      include: {
        user: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log("DOCTORS FOUND:", doctors);

    const formattedDoctors = doctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.name || doctor.user?.name || "Especialista",
      specialty: doctor.specialty || "Odontología general",
      imageUrl: doctor.photo || null,
    }));

    return NextResponse.json(formattedDoctors);
  } catch (error) {
    console.error("ERROR /api/patient/doctors:", error);

    return NextResponse.json(
      { error: "Error interno al cargar especialistas" },
      { status: 500 }
    );
  }
}