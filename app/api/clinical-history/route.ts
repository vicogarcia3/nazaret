import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type UserRole = "ADMIN" | "DOCTOR" | "PATIENT";

async function canAccessPatient({
  userId,
  role,
  patientId,
}: {
  userId: string;
  role: UserRole;
  patientId: string;
}) {
  if (role === "ADMIN") {
    const patient = await prisma.patient.findUnique({
      where: {
        id: patientId,
      },
      select: {
        id: true,
      },
    });

    return Boolean(patient);
  }

  if (role !== "DOCTOR") {
    return false;
  }

  const doctor = await prisma.doctor.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      branches: {
        select: {
          branchId: true,
        },
      },
    },
  });

  if (!doctor) {
    return false;
  }

  const doctorBranchIds = doctor.branches.map(
    (doctorBranch) => doctorBranch.branchId
  );

  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      OR: [
        {
          branchId: {
            in: doctorBranchIds,
          },
        },
        {
          appointments: {
            some: {
              doctorId: doctor.id,
            },
          },
        },
        {
          budgets: {
            some: {
              doctorId: doctor.id,
            },
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  return Boolean(patient);
}

export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "DOCTOR"
    ) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "Falta patientId" },
        { status: 400 }
      );
    }

    const hasAccess = await canAccessPatient({
      userId: session.user.id,
      role: session.user.role as UserRole,
      patientId,
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: "No tenés acceso a este paciente" },
        { status: 403 }
      );
    }

    const history = await prisma.clinicalHistory.findFirst({
      where: {
        patientId,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error(
      "ERROR_OBTENIENDO_HISTORIA_CLINICA:",
      error
    );

    return NextResponse.json(
      {
        error: "Error interno al obtener la historia clínica",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "DOCTOR"
    ) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const patientId =
      typeof body.patientId === "string"
        ? body.patientId.trim()
        : "";

    if (!patientId) {
      return NextResponse.json(
        { error: "Falta patientId" },
        { status: 400 }
      );
    }

    const hasAccess = await canAccessPatient({
      userId: session.user.id,
      role: session.user.role as UserRole,
      patientId,
    });

    if (!hasAccess) {
      return NextResponse.json(
        { error: "No tenés acceso a este paciente" },
        { status: 403 }
      );
    }

    const existingHistory =
      await prisma.clinicalHistory.findFirst({
        where: {
          patientId,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

    const payload = {
      diagnosis:
        typeof body.diagnosis === "string" &&
        body.diagnosis.trim()
          ? body.diagnosis.trim()
          : null,

      treatment:
        typeof body.treatment === "string" &&
        body.treatment.trim()
          ? body.treatment.trim()
          : null,

      data:
        body.data &&
        typeof body.data === "object" &&
        !Array.isArray(body.data)
          ? body.data
          : {},
    };

    const history = existingHistory
      ? await prisma.clinicalHistory.update({
          where: {
            id: existingHistory.id,
          },
          data: payload,
        })
      : await prisma.clinicalHistory.create({
          data: {
            patientId,
            ...payload,
          },
        });

    return NextResponse.json(history);
  } catch (error) {
    console.error(
      "ERROR_GUARDANDO_HISTORIA_CLINICA:",
      error
    );

    return NextResponse.json(
      {
        error: "Error interno al guardar la historia clínica",
      },
      { status: 500 }
    );
  }
}