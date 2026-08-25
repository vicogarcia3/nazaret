import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

import { prisma } from "@/lib/prisma";

function getAppointmentInclude() {
  return {
    patient: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        dni: true,
      },
    },

    doctor: {
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    },

    branch: {
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
      },
    },
  };
}

async function getDoctorProfile(userId: string) {
  return prisma.doctor.findUnique({
    where: {
      userId,
    },
    include: {
      branches: {
        include: {
          branch: true,
        },
      },
    },
  });
}

async function doctorCanAccessPatient(
  doctorId: string,
  doctorName: string,
  patientId: string
) {
  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      histories: {
        some: {
          data: {
            path: ["odontologo"],
            equals: doctorName,
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(patient);
}

export async function GET() {
  try {
    const session = await auth();

    if (
      !session?.user?.id ||
      session.user.role !== "DOCTOR"
    ) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const doctor = await getDoctorProfile(
      session.user.id
    );

    if (!doctor) {
      return NextResponse.json(
        {
          error:
            "Perfil de odontólogo no encontrado.",
        },
        { status: 404 }
      );
    }

    const branchIds = doctor.branches.map(
      (doctorBranch) =>
        doctorBranch.branchId
    );

    /*
     * Los turnos que administra el profesional
     * son los que están asignados a él.
     */
    const appointments =
      await prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
          branchId: {
            in: branchIds,
          },
        },
        include: getAppointmentInclude(),
        orderBy: {
          date: "asc",
        },
      });

    /*
     * Los pacientes disponibles para crear turnos
     * son solamente los vinculados por Historia Clínica.
     */
    const patients =
      await prisma.patient.findMany({
        where: {
          histories: {
            some: {
              data: {
                path: ["odontologo"],
                equals: doctor.name,
              },
            },
          },
        },

        select: {
          id: true,
          firstName: true,
          lastName: true,
          dni: true,
          phone: true,
          branchId: true,
        },

        orderBy: [
          {
            lastName: "asc",
          },
          {
            firstName: "asc",
          },
        ],
      });

    const branches = doctor.branches.map(
      (doctorBranch) =>
        doctorBranch.branch
    );

    return NextResponse.json({
      appointments,
      branches,
      patients,
    });
  } catch (error) {
    console.error(
      "ERROR OBTENIENDO AGENDA DEL DOCTOR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo cargar la agenda.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const session = await auth();

    if (
      !session?.user?.id ||
      session.user.role !== "DOCTOR"
    ) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const doctor = await prisma.doctor.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        branches: {
          select: {
            branchId: true,
          },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json(
        {
          error:
            "Perfil de odontólogo no encontrado.",
        },
        { status: 404 }
      );
    }

    const body = await request.json();

    const patientId =
      typeof body.patientId === "string"
        ? body.patientId.trim()
        : "";

    const branchId =
      typeof body.branchId === "string"
        ? body.branchId.trim()
        : "";

    const date =
      typeof body.date === "string"
        ? body.date.trim()
        : "";

    const time =
      typeof body.time === "string"
        ? body.time.trim()
        : "";

    const notes =
      typeof body.notes === "string"
        ? body.notes.trim()
        : "";

    if (
      !patientId ||
      !branchId ||
      !date ||
      !time ||
      !notes
    ) {
      return NextResponse.json(
        {
          error:
            "Paciente, sucursal, fecha, hora y concepto son obligatorios.",
        },
        { status: 400 }
      );
    }

    const doctorBranchIds =
      doctor.branches.map(
        (doctorBranch) =>
          doctorBranch.branchId
      );

    if (!doctorBranchIds.includes(branchId)) {
      return NextResponse.json(
        {
          error:
            "La sucursal seleccionada no está asociada al profesional.",
        },
        { status: 403 }
      );
    }

    /*
     * El paciente debe estar vinculado al profesional
     * mediante su Historia Clínica.
     */
    const hasPatientAccess =
      await doctorCanAccessPatient(
        doctor.id,
        doctor.name,
        patientId
      );

    if (!hasPatientAccess) {
      return NextResponse.json(
        {
          error:
            "El paciente seleccionado no está asociado al profesional mediante la historia clínica.",
        },
        { status: 403 }
      );
    }

    const appointmentDate = new Date(
      `${date}T${time}:00-03:00`
    );

    if (
      Number.isNaN(
        appointmentDate.getTime()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "La fecha o el horario son inválidos.",
        },
        { status: 400 }
      );
    }

    if (
      appointmentDate.getTime() <
      Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            "No se puede registrar un turno en una fecha pasada.",
        },
        { status: 400 }
      );
    }

    const overlappingAppointment =
      await prisma.appointment.findFirst({
        where: {
          doctorId: doctor.id,
          date: appointmentDate,
          status: {
            not: "CANCELED",
          },
        },

        select: {
          id: true,
        },
      });

    if (overlappingAppointment) {
      return NextResponse.json(
        {
          error:
            "Ya tenés otro turno registrado en esa fecha y horario.",
        },
        { status: 409 }
      );
    }

    const appointment =
      await prisma.appointment.create({
        data: {
          patientId,
          doctorId: doctor.id,
          branchId,
          date: appointmentDate,
          notes,
          status: "PENDING",
        },

        include: getAppointmentInclude(),
      });

    return NextResponse.json(
      {
        appointment,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "ERROR CREANDO TURNO DEL DOCTOR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo crear el turno.",
      },
      { status: 500 }
    );
  }
}