import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: Props) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const data: {
      approved?: boolean;
      visible?: boolean;
    } = {};

    if (typeof body.approved === "boolean") {
      data.approved = body.approved;
    }

    if (typeof body.visible === "boolean") {
      data.visible = body.visible;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No hay cambios válidos" },
        { status: 400 }
      );
    }

    const testimonial = await prisma.testimonial.update({
      where: {
        id,
      },
      data,
    });

    return NextResponse.json(testimonial);
  } catch (error) {
    console.error("PATCH /api/testimonials/[id]:", error);

    return NextResponse.json(
      { error: "No se pudo actualizar la reseña" },
      { status: 500 }
    );
  }
}