import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";
import { readFile } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";

type ImageFormat = "PNG" | "JPEG" | "WEBP";

function getImageFormat(source: string): ImageFormat {
  const normalizedSource = source.toLowerCase();

  if (
    normalizedSource.includes("image/jpeg") ||
    normalizedSource.includes("image/jpg") ||
    normalizedSource.endsWith(".jpg") ||
    normalizedSource.endsWith(".jpeg")
  ) {
    return "JPEG";
  }

  if (
    normalizedSource.includes("image/webp") ||
    normalizedSource.endsWith(".webp")
  ) {
    return "WEBP";
  }

  return "PNG";
}

async function remoteImageToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`No se pudo cargar la imagen: ${url}`);
  }

  const contentType =
    response.headers.get("content-type") || "image/png";

  const imageBuffer = Buffer.from(
    await response.arrayBuffer()
  );

  return `data:${contentType};base64,${imageBuffer.toString(
    "base64"
  )}`;
}

async function localPublicImageToDataUrl(
  source: string
): Promise<string> {
  const cleanPath = source.replace(/^\/+/, "");

  const absolutePath = path.join(
    process.cwd(),
    "public",
    cleanPath
  );

  const imageBuffer = await readFile(absolutePath);

  const extension = path.extname(cleanPath).toLowerCase();

  const contentType =
    extension === ".jpg" || extension === ".jpeg"
      ? "image/jpeg"
      : extension === ".webp"
        ? "image/webp"
        : "image/png";

  return `data:${contentType};base64,${imageBuffer.toString(
    "base64"
  )}`;
}

async function normalizeImageSource(
  source?: string | null
): Promise<string | null> {
  if (!source?.trim()) {
    return null;
  }

  const normalizedSource = source.trim();

  if (normalizedSource.startsWith("data:image/")) {
    return normalizedSource;
  }

  if (
    normalizedSource.startsWith("https://") ||
    normalizedSource.startsWith("http://")
  ) {
    return remoteImageToDataUrl(normalizedSource);
  }

  if (normalizedSource.startsWith("/")) {
    return localPublicImageToDataUrl(normalizedSource);
  }

  return null;
}

function formatMoney(value: unknown): string {
  return `$${Number(value).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export async function GET(
  _req: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } = await context.params;

    const budget = await prisma.budget.findUnique({
      where: {
        id,
      },
      include: {
        patient: {
          include: {
            branch: true,
            plan: true,
          },
        },
        doctors: {
          include: {
            doctor: {
              include: {
                user: true,
              },
            },
          },
        },
        items: true,
      },
    });

    if (!budget) {
      return NextResponse.json(
        {
          error: "Presupuesto no encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const isAdmin = session.user.role === "ADMIN";

    const isAssignedDoctor =
      session.user.role === "DOCTOR" &&
      budget.doctors.some(
        ({ doctor }) =>
          doctor.userId === session.user.id
      );

    const isBudgetPatient =
      session.user.role === "PATIENT" &&
      budget.patient.userId === session.user.id;

    if (!isAdmin && !isAssignedDoctor && !isBudgetPatient) {
      return NextResponse.json(
        {
          error: "No tenés permiso para ver este presupuesto.",
        },
        {
          status: 403,
        }
      );
    }

    const doctorNames = budget.doctors
      .map(
        ({ doctor }) =>
          doctor.name ||
          doctor.user?.name ||
          "Especialista"
      )
      .join(", ");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const clinicName = "Consultorios Nazaret";

    const margin = 22;
    const pageWidth = 210;
    const rightMargin = pageWidth - margin;

    let y = 24;

    /*
     * LOGO
     * Se toma directamente desde:
     * public/icon.png
     */
    try {
      const logoBuffer = await readFile(
        path.join(process.cwd(), "app", "icon.png")
      );

      const logoDataUrl = `data:image/png;base64,${logoBuffer.toString(
        "base64"
      )}`;

      doc.addImage(
        logoDataUrl,
        "PNG",
        158,
        12,
        28,
        28,
        undefined,
        "FAST"
      );
    } catch (logoError) {
      console.error(
        "No se pudo agregar public/icon.png al presupuesto:",
        logoError
      );
    }

    /*
     * ENCABEZADO
     */
    doc.setTextColor(38, 63, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);

    doc.text(clinicName.toUpperCase(), margin, y);

    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(95, 111, 107);

    const branchAddress = [
      budget.patient.branch?.address,
      budget.patient.branch?.city,
    ]
      .filter(Boolean)
      .join(" - ");

    doc.text(
      branchAddress || "Dirección no informada",
      margin,
      y
    );

    y += 6;

    doc.setFontSize(11);
    doc.text("Presupuesto odontológico", margin, y);

    y += 12;

    doc.setDrawColor(222, 217, 205);
    doc.setLineWidth(0.35);
    doc.line(margin, y, rightMargin, y);

    y += 14;

    /*
     * DATOS GENERALES
     */
    const leftX = margin;
    const rightX = 112;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(162, 179, 139);

    doc.text("PACIENTE", leftX, y);
    doc.text("FECHA", rightX, y);

    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(38, 63, 59);

    doc.text(
      `${budget.patient.firstName} ${budget.patient.lastName}`,
      leftX,
      y
    );

    doc.text(
      new Date(budget.createdAt).toLocaleDateString("es-AR"),
      rightX,
      y
    );

    y += 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(162, 179, 139);

    doc.text("DNI", leftX, y);
    doc.text("ESPECIALISTA", rightX, y);

    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(38, 63, 59);

    doc.text(budget.patient.dni || "-", leftX, y);

    const doctorLines = doc.splitTextToSize(
      doctorNames || "No asignado",
      75
    );

    doc.text(
      doctorLines,
      rightX,
      y
    );

    y += 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(162, 179, 139);

    doc.text("SUCURSAL", leftX, y);

    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(38, 63, 59);

    doc.text(
      budget.patient.branch?.name || "-",
      leftX,
      y
    );

    y += 18;

    /*
     * TABLA DE TRATAMIENTOS
     */
    doc.setFillColor(247, 245, 239);
    doc.rect(margin, y, 168, 11, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(38, 63, 59);

    doc.text("TRATAMIENTO", margin + 4, y + 7);

    doc.text("PRECIO", 176, y + 7, {
      align: "right",
    });

    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    budget.items.forEach((item) => {
      const serviceName =
        item.serviceName || "Sin descripción";

      const descriptionLines = doc.splitTextToSize(
        serviceName,
        125
      );

      doc.setTextColor(38, 63, 59);

      doc.text(
        descriptionLines,
        margin + 3,
        y
      );

      doc.text(
        formatMoney(item.total),
        176,
        y,
        {
          align: "right",
        }
      );

      const lineCount = Math.max(
        1,
        descriptionLines.length
      );

      y += Math.max(9, lineCount * 5);
    });

    y += 6;

    doc.setDrawColor(222, 217, 205);
    doc.line(margin, y, rightMargin, y);

    y += 14;

    /*
     * TOTALES
     */
    const labelX = 125;
    const valueX = 175;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(95, 111, 107);

    doc.text("Subtotal", labelX, y);

    doc.text(
      formatMoney(budget.subtotal),
      valueX,
      y,
      {
        align: "right",
      }
    );

    y += 8;

    doc.text(
      `Descuento (${Number(budget.discount)}%)`,
      labelX,
      y
    );

    const discountAmount =
      Number(budget.subtotal) *
      (Number(budget.discount) / 100);

    doc.text(
      `-${formatMoney(discountAmount)}`,
      valueX,
      y,
      {
        align: "right",
      }
    );

    y += 10;

    doc.setDrawColor(222, 217, 205);
    doc.line(labelX, y, valueX, y);

    y += 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(38, 63, 59);

    doc.text("TOTAL", labelX, y);

    doc.text(
      formatMoney(budget.total),
      valueX,
      y,
      {
        align: "right",
      }
    );

    /*
     * VALIDEZ
     */
    y += 28;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(95, 111, 107);

    doc.text(
      "Validez del presupuesto: 30 días.",
      margin,
      y
    );

    /*
     * FIRMAS
     */
    const patientSignature =
      await normalizeImageSource(
        budget.patientSignature
      );

    const doctorSignature =
      await normalizeImageSource(
        budget.doctorSignature
      );

    const signatureY = Math.max(y + 12, 220);

    const patientSignatureX = margin;
    const doctorSignatureX = 112;

    const signatureWidth = 65;
    const signatureImageHeight = 24;

    if (patientSignature) {
      try {
        doc.addImage(
          patientSignature,
          getImageFormat(patientSignature),
          patientSignatureX,
          signatureY,
          signatureWidth,
          signatureImageHeight,
          undefined,
          "FAST"
        );
      } catch (signatureError) {
        console.error(
          "No se pudo agregar la firma del paciente:",
          signatureError
        );
      }
    }

    if (doctorSignature) {
      try {
        doc.addImage(
          doctorSignature,
          getImageFormat(doctorSignature),
          doctorSignatureX,
          signatureY,
          signatureWidth,
          signatureImageHeight,
          undefined,
          "FAST"
        );
      } catch (signatureError) {
        console.error(
          "No se pudo agregar la firma del profesional:",
          signatureError
        );
      }
    }

    const signatureLineY =
      signatureY + signatureImageHeight + 2;

    doc.setDrawColor(38, 63, 59);
    doc.setLineWidth(0.35);

    doc.line(
      patientSignatureX,
      signatureLineY,
      patientSignatureX + signatureWidth,
      signatureLineY
    );

    doc.line(
      doctorSignatureX,
      signatureLineY,
      doctorSignatureX + signatureWidth,
      signatureLineY
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(95, 111, 107);

    doc.text(
      "Firma del paciente",
      patientSignatureX,
      signatureLineY + 7
    );

    doc.text(
      "Firma y sello del profesional",
      doctorSignatureX,
      signatureLineY + 7
    );

    /*
     * PIE DE PÁGINA
     */
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);

    doc.text(
      "Este presupuesto está sujeto a evaluación profesional y disponibilidad de turnos.",
      margin,
      282
    );

    const pdfBuffer = Buffer.from(
      doc.output("arraybuffer")
    );

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="presupuesto-${budget.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error(
      "ERROR GENERANDO PDF DEL PRESUPUESTO:",
      error
    );

    return NextResponse.json(
      {
        error: "No se pudo generar el presupuesto.",
      },
      {
        status: 500,
      }
    );
  }
}