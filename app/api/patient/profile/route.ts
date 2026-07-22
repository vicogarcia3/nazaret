import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dni: true,
        phone: true,
        email: true,
        birthDate: true,
        createdAt: true,

        user: {
          select: {
            name: true,
            email: true,
            image: true,
            password: true,
            lastLoginAt: true,
          },
        },

        branch: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
          },
        },

        doctor: {
          select: {
            specialty: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente no encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dni: patient.dni,
      phone: patient.phone,
      email: patient.user?.email || patient.email || "",
      birthDate: patient.birthDate
        ? patient.birthDate.toISOString().split("T")[0]
        : "",
      image: patient.user?.image || "",
      branch: patient.branch,
      doctor: patient.doctor
        ? {
            name: patient.doctor.user.name,
            specialty: patient.doctor.specialty,
          }
        : null,
      createdAt: patient.createdAt,
      lastLoginAt: patient.user?.lastLoginAt,
      hasPassword: Boolean(patient.user?.password),
    });
  } catch (error) {
    console.error("Error al obtener perfil:", error);

    return NextResponse.json(
      { error: "No se pudo obtener el perfil." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      );
    }

    const data = await req.json();

    const firstName = String(data.firstName || "").trim();
    const lastName = String(data.lastName || "").trim();
    const phone = String(data.phone || "").trim();
    const email = String(data.email || "").trim().toLowerCase();
    const birthDate = data.birthDate
      ? new Date(`${data.birthDate}T12:00:00`)
      : null;
    const image = String(data.image || "").trim() || null;

    if (!firstName || !lastName || !phone || !email) {
      return NextResponse.json(
        { error: "Completá todos los campos obligatorios." },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!patient?.userId) {
      return NextResponse.json(
        { error: "Paciente no encontrado." },
        { status: 404 }
      );
    }

    const emailInUse = await prisma.user.findFirst({
      where: {
        email,
        id: {
          not: patient.userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (emailInUse) {
      return NextResponse.json(
        { error: "El correo ya pertenece a otra cuenta." },
        { status: 409 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: patient.userId,
        },
        data: {
          name: `${firstName} ${lastName}`,
          email,
          image,
        },
      }),

      prisma.patient.update({
        where: {
          id: patient.id,
        },
        data: {
          firstName,
          lastName,
          phone,
          email,
          birthDate,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);

    return NextResponse.json(
      { error: "No se pudo actualizar el perfil." },
      { status: 500 }
    );
  }
}