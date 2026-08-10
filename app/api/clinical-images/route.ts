import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ClinicalImageType =
  | "RADIOGRAPH"
  | "PHOTO"
  | "OTHER";

const VALID_TYPES: ClinicalImageType[] = [
  "RADIOGRAPH",
  "PHOTO",
  "OTHER",
];

export async function GET(
  request: Request
) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      session.user.role !== "ADMIN"
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

    const { searchParams } =
      new URL(request.url);

    const clinicalHistoryId =
      searchParams.get(
        "clinicalHistoryId"
      );

    if (!clinicalHistoryId) {
      return NextResponse.json(
        {
          error:
            "Falta clinicalHistoryId.",
        },
        {
          status: 400,
        }
      );
    }

    const images =
      await prisma.clinicalImage.findMany(
        {
          where: {
            clinicalHistoryId,
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            uploadedByDoctor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }
      );

    return NextResponse.json(
      images.map((image) => ({
        id: image.id,
        clinicalHistoryId:
          image.clinicalHistoryId,
        uploadedByDoctorId:
          image.uploadedByDoctorId,
        uploadedByDoctor:
          image.uploadedByDoctor,
        type: image.type,
        title: image.title,
        description:
          image.description,
        imageUrl: image.imageUrl,
        takenAt:
          image.takenAt?.toISOString() ??
          null,
        createdAt:
          image.createdAt.toISOString(),
        updatedAt:
          image.updatedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error(
      "Error obteniendo imágenes clínicas:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron cargar las imágenes clínicas.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      session.user.role !== "ADMIN"
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

    const clinicalHistoryId =
      typeof body.clinicalHistoryId ===
      "string"
        ? body.clinicalHistoryId.trim()
        : "";

    const imageUrl =
      typeof body.imageUrl === "string"
        ? body.imageUrl.trim()
        : "";

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const type =
      typeof body.type === "string"
        ? body.type.trim()
        : "";

    const takenAt =
      typeof body.takenAt === "string" &&
      body.takenAt.trim()
        ? body.takenAt.trim()
        : null;

    if (!clinicalHistoryId) {
      return NextResponse.json(
        {
          error:
            "La historia clínica es obligatoria.",
        },
        {
          status: 400,
        }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        {
          error:
            "La URL de la imagen es obligatoria.",
        },
        {
          status: 400,
        }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          error:
            "El título es obligatorio.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !VALID_TYPES.includes(
        type as ClinicalImageType
      )
    ) {
      return NextResponse.json(
        {
          error:
            "El tipo de imagen no es válido.",
        },
        {
          status: 400,
        }
      );
    }

    const history =
      await prisma.clinicalHistory.findUnique(
        {
          where: {
            id: clinicalHistoryId,
          },
          select: {
            id: true,
            patientId: true,
          },
        }
      );

    if (!history) {
      return NextResponse.json(
        {
          error:
            "La historia clínica no existe.",
        },
        {
          status: 404,
        }
      );
    }

    let parsedTakenAt:
      | Date
      | null = null;

    if (takenAt) {
      parsedTakenAt =
        new Date(takenAt);

      if (
        Number.isNaN(
          parsedTakenAt.getTime()
        )
      ) {
        return NextResponse.json(
          {
            error:
              "La fecha del estudio no es válida.",
          },
          {
            status: 400,
          }
        );
      }
    }

    const image =
      await prisma.clinicalImage.create(
        {
          data: {
            clinicalHistoryId,
            imageUrl,
            title,
            description:
              description || null,
            type:
              type as ClinicalImageType,
            takenAt:
              parsedTakenAt,
          },
        }
      );

    return NextResponse.json(
      {
        id: image.id,
        clinicalHistoryId:
          image.clinicalHistoryId,
        uploadedByDoctorId:
          image.uploadedByDoctorId,
        type: image.type,
        title: image.title,
        description:
          image.description,
        imageUrl:
          image.imageUrl,
        takenAt:
          image.takenAt?.toISOString() ??
          null,
        createdAt:
          image.createdAt.toISOString(),
        updatedAt:
          image.updatedAt.toISOString(),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error creando imagen clínica:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo guardar la imagen clínica.",
      },
      {
        status: 500,
      }
    );
  }
}