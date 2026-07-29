import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    if (session.user.role === "ADMIN") {
      const testimonials = await prisma.testimonial.findMany({
        include: {
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(testimonials);
    }

    if (session.user.role === "PATIENT") {
      const patient = await prisma.patient.findUnique({
        where: {
          userId: session.user.id,
        },
        include: {
          testimonial: true,
        },
      });

      if (!patient) {
        return NextResponse.json(
          { error: "Paciente no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json(patient.testimonial);
    }

    return NextResponse.json(
      { error: "No autorizado" },
      { status: 403 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "PATIENT") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const rating = Number(body.rating);

    const comment =
      typeof body.comment === "string"
        ? body.comment.trim()
        : "";

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return NextResponse.json(
        {
          error: "La calificación debe ser entre 1 y 5.",
        },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    const testimonial = await prisma.testimonial.upsert({
      where: {
        patientId: patient.id,
      },
      update: {
        rating,
        comment: comment || null,
        approved: false,
        visible: true,
      },
      create: {
        patientId: patient.id,
        rating,
        comment: comment || null,
        approved: false,
        visible: true,
      },
    });

    return NextResponse.json(testimonial);
    } catch (error) {
      console.error(error);

      return NextResponse.json(
        { error: "Error interno" },
        { status: 500 }
      );
    }
}