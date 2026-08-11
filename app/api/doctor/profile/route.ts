import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (
      !session?.user ||
      session.user.role !== "DOCTOR"
    ) {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const doctor =
      await prisma.doctor.findFirst({
        where: {
          userId: session.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              password: true,
              lastLoginAt: true,
            },
          },
          branches: {
            include: {
              branch: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  city: true,
                },
              },
            },
          },
        },
      });

    if (!doctor) {
      return NextResponse.json(
        {
          error:
            "No se encontró el perfil profesional.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      id: doctor.id,

      name:
        doctor.name ||
        doctor.user?.name ||
        "",

      email:
        doctor.email ||
        doctor.user?.email ||
        "",

      photo:
        doctor.photo ||
        doctor.user?.image ||
        null,

      phone:
        doctor.phone || "",

      birthDate:
        doctor.birthDate
          ? doctor.birthDate
              .toISOString()
              .slice(0, 10)
          : "",

      dni:
        doctor.dni || "",

      professionalLicense:
        doctor.professionalLicense ||
        "",

      specialty:
        doctor.specialty || "",

      branches:
        doctor.branches.map(
          (item) => ({
            id: item.branch.id,
            name: item.branch.name,
            address:
              item.branch.address,
            city: item.branch.city,
          })
        ),

      account: {
        googleActive:
          Boolean(
            doctor.user?.image
          ),

        passwordActive:
          Boolean(
            doctor.user?.password
          ),

        lastLoginAt:
          doctor.user?.lastLoginAt
            ? doctor.user.lastLoginAt.toISOString()
            : null,
      },
    });
  } catch (error) {
    console.error(
      "Error obteniendo perfil del especialista:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo cargar el perfil.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      session.user.role !== "DOCTOR"
    ) {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const dni =
      typeof body.dni === "string"
        ? body.dni.trim()
        : "";

    const birthDate =
      typeof body.birthDate ===
        "string" &&
      body.birthDate.trim()
        ? body.birthDate.trim()
        : "";

    const doctor =
      await prisma.doctor.findFirst({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
        },
      });

    if (!doctor) {
      return NextResponse.json(
        {
          error:
            "No se encontró el perfil profesional.",
        },
        {
          status: 404,
        }
      );
    }

    let parsedBirthDate:
      | Date
      | null = null;

    if (birthDate) {
      parsedBirthDate =
        new Date(
          `${birthDate}T12:00:00`
        );

      if (
        Number.isNaN(
          parsedBirthDate.getTime()
        )
      ) {
        return NextResponse.json(
          {
            error:
              "La fecha de nacimiento no es válida.",
          },
          {
            status: 400,
          }
        );
      }
    }

    const updated =
      await prisma.doctor.update({
        where: {
          id: doctor.id,
        },
        data: {
          phone: phone || null,
          birthDate: parsedBirthDate,
          dni: dni || null,
        },
        select: {
          id: true,
          phone: true,
          birthDate: true,
          dni: true,
        },
      });

    return NextResponse.json({
      success: true,
      doctor: {
        id: updated.id,
        phone:
          updated.phone || "",
        birthDate:
          updated.birthDate
            ? updated.birthDate
                .toISOString()
                .slice(0, 10)
            : "",
        dni: updated.dni || "",
      },
    });
  } catch (error) {
    console.error(
      "Error actualizando perfil del especialista:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo actualizar el perfil.",
      },
      {
        status: 500,
      }
    );
  }
}