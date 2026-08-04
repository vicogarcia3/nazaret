import { del } from "@vercel/blob";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export async function DELETE(request: Request) {
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

    const body = await request.json();

    const url =
      typeof body.url === "string"
        ? body.url.trim()
        : "";

    if (!url) {
      return NextResponse.json(
        {
          error: "No se recibió la URL de la imagen.",
        },
        {
          status: 400,
        }
      );
    }

    const isVercelBlobUrl =
      url.startsWith("https://") &&
      url.includes(".public.blob.vercel-storage.com/");

    if (!isVercelBlobUrl) {
      return NextResponse.json(
        {
          error:
            "La imagen no pertenece al almacenamiento de Vercel Blob.",
        },
        {
          status: 400,
        }
      );
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;

    if (!token) {
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

    await del(url, {
      token,
    });

    return NextResponse.json({
      message: "Imagen eliminada correctamente.",
    });
  } catch (error) {
    console.error("Error eliminando imagen de Blob:", error);

    return NextResponse.json(
      {
        error: "No se pudo eliminar la imagen.",
      },
      {
        status: 500,
      }
    );
  }
}