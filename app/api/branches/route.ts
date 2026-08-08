import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const branches = await prisma.branch.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json(branches);
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const branch = await prisma.branch.create({
      data: {
        name: String(data.name || "").trim(),
        city: String(data.city || "").trim(),
        address: String(data.address || "").trim(),
        phone:
          typeof data.phone === "string" &&
          data.phone.trim()
            ? data.phone.trim()
            : null,
        mapUrl:
          typeof data.mapUrl === "string" &&
          data.mapUrl.trim()
            ? data.mapUrl.trim()
            : null,
      },
    });

    return NextResponse.json(
      branch,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error creando sucursal:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo crear la sucursal.",
      },
      {
        status: 500,
      }
    );
  }
}