import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

import { auth } from "@/lib/auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const EXTENSIONS_BY_MIME_TYPE: Record<
  (typeof ALLOWED_IMAGE_TYPES)[number],
  string
> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const formData = await request.formData();
    const uploadedFile = formData.get("file");

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json(
        {
          error: "No se envió ningún archivo.",
        },
        {
          status: 400,
        }
      );
    }

    if (uploadedFile.size === 0) {
      return NextResponse.json(
        {
          error: "El archivo está vacío.",
        },
        {
          status: 400,
        }
      );
    }

    if (uploadedFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "La imagen no puede superar los 10 MB.",
        },
        {
          status: 400,
        }
      );
    }

    const fileType = uploadedFile.type;

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        fileType as (typeof ALLOWED_IMAGE_TYPES)[number]
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Formato no permitido. Solo se aceptan imágenes JPG, PNG o WebP.",
        },
        {
          status: 400,
        }
      );
    }

    const extension =
      EXTENSIONS_BY_MIME_TYPE[
        fileType as (typeof ALLOWED_IMAGE_TYPES)[number]
      ];

    const fileName = [
      "nazaret",
      Date.now(),
      crypto.randomUUID(),
    ].join("-");

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
      console.error(
        "No se encontró la variable BLOB_READ_WRITE_TOKEN."
      );

      return NextResponse.json(
        {
          error:
            "El almacenamiento de imágenes no está configurado.",
        },
        {
          status: 500,
        }
      );
    }

    const blob = await put(
      `uploads/${fileName}.${extension}`,
      uploadedFile,
      {
        access: "public",
        addRandomSuffix: false,
        token,
        contentType: fileType,
      }
    );

    return NextResponse.json(
      {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
        size: uploadedFile.size,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Error subiendo imagen:", error);

    return NextResponse.json(
      {
        error: "No se pudo subir la imagen.",
      },
      {
        status: 500,
      }
    );
  }
}