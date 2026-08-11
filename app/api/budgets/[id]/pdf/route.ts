import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { readFile } from "fs/promises";
import path from "path";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ImageFormat =
  | "PNG"
  | "JPEG"
  | "WEBP";

function getImageFormat(
  source: string
): ImageFormat {
  const normalized =
    source.toLowerCase();

  if (
    normalized.includes(
      "image/jpeg"
    ) ||
    normalized.includes(
      "image/jpg"
    ) ||
    normalized.endsWith(
      ".jpg"
    ) ||
    normalized.endsWith(
      ".jpeg"
    )
  ) {
    return "JPEG";
  }

  if (
    normalized.includes(
      "image/webp"
    ) ||
    normalized.endsWith(
      ".webp"
    )
  ) {
    return "WEBP";
  }

  return "PNG";
}

async function remoteImageToDataUrl(
  url: string
): Promise<string> {
  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `No se pudo cargar la imagen: ${url}`
    );
  }

  const contentType =
    response.headers.get(
      "content-type"
    ) || "image/png";

  const imageBuffer =
    Buffer.from(
      await response.arrayBuffer()
    );

  return `data:${contentType};base64,${imageBuffer.toString(
    "base64"
  )}`;
}

async function localPublicImageToDataUrl(
  source: string
): Promise<string> {
  const cleanPath =
    source.replace(
      /^\/+/,
      ""
    );

  const absolutePath =
    path.join(
      process.cwd(),
      "public",
      cleanPath
    );

  const imageBuffer =
    await readFile(
      absolutePath
    );

  const extension =
    path
      .extname(cleanPath)
      .toLowerCase();

  const contentType =
    extension === ".jpg" ||
    extension === ".jpeg"
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

  const normalized =
    source.trim();

  if (
    normalized.startsWith(
      "data:image/"
    )
  ) {
    return normalized;
  }

  if (
    normalized.startsWith(
      "https://"
    ) ||
    normalized.startsWith(
      "http://"
    )
  ) {
    return remoteImageToDataUrl(
      normalized
    );
  }

  if (
    normalized.startsWith(
      "/"
    )
  ) {
    return localPublicImageToDataUrl(
      normalized
    );
  }

  return null;
}

function formatMoney(
  value: unknown
) {
  return `$ ${Number(
    value
  ).toLocaleString(
    "es-AR",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  )}`;
}

function formatDate(
  value: Date
) {
  return new Intl.DateTimeFormat(
    "es-AR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(value);
}

function getStatusLabel(
  status: string
) {
  if (
    status ===
    "COMPLETED"
  ) {
    return "COMPLETADO";
  }

  if (
    status ===
    "IN_PROGRESS"
  ) {
    return "EN CURSO";
  }

  return "PENDIENTE";
}

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const session =
      await auth();

    if (
      !session?.user?.id
    ) {
      return NextResponse.json(
        {
          error:
            "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await context.params;

    const budget =
      await prisma.budget.findUnique(
        {
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

            items: {
              orderBy: {
                id: "asc",
              },
            },
          },
        }
      );

    if (!budget) {
      return NextResponse.json(
        {
          error:
            "Presupuesto no encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    /* =========================================
       PERMISOS
    ========================================= */

    const isAdmin =
      session.user.role ===
      "ADMIN";

    const isAssignedDoctor =
      session.user.role ===
        "DOCTOR" &&
      budget.doctors.some(
        ({ doctor }) =>
          doctor.userId ===
          session.user.id
      );

    const isPatient =
      session.user.role ===
        "PATIENT" &&
      budget.patient.userId ===
        session.user.id;

    if (
      !isAdmin &&
      !isAssignedDoctor &&
      !isPatient
    ) {
      return NextResponse.json(
        {
          error:
            "No tenés permiso para ver este presupuesto.",
        },
        {
          status: 403,
        }
      );
    }

    /* =========================================
       DATOS
    ========================================= */

    const patientName =
      `${budget.patient.lastName}, ${budget.patient.firstName}`;

    const subtotal =
      Number(
        budget.subtotal
      );

    const discount =
      Number(
        budget.discount
      );

    const total =
      Number(
        budget.total
      );

    const statusLabel =
      getStatusLabel(
        budget.status
      );

    /* =========================================
       DOCUMENTO
    ========================================= */

    const doc =
      new jsPDF({
        orientation:
          "portrait",
        unit: "mm",
        format: "a4",
      });

    const pageWidth = 210;
    const pageHeight = 297;

    const marginX = 16;
    const contentWidth =
      pageWidth -
      marginX * 2;

    const dark = {
      r: 38,
      g: 63,
      b: 59,
    };

    const green = {
      r: 130,
      g: 149,
      b: 111,
    };

    const muted = {
      r: 95,
      g: 111,
      b: 107,
    };

    const border = {
      r: 222,
      g: 217,
      b: 205,
    };

    const background = {
      r: 250,
      g: 249,
      b: 245,
    };

    let y = 17;

    /* =========================================
       ENCABEZADO
    ========================================= */

    doc.setTextColor(
      green.r,
      green.g,
      green.b
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(9);

    doc.text(
      "C O N S U L T O R I O S   N A Z A R E T",
      marginX,
      y
    );

    /* FECHA */

    doc.setTextColor(
      dark.r,
      dark.g,
      dark.b
    );

    doc.setFontSize(9);

    doc.text(
      "Fecha",
      pageWidth - marginX,
      y,
      {
        align: "right",
      }
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setTextColor(
      muted.r,
      muted.g,
      muted.b
    );

    doc.text(
      formatDate(
        budget.createdAt
      ),
      pageWidth -
        marginX,
      y + 6,
      {
        align: "right",
      }
    );

    /* ESTADO */

    const statusWidth = 27;

    doc.setFillColor(
      238,
      242,
      233
    );

    doc.rect(
      pageWidth -
        marginX -
        statusWidth,
      y + 9,
      statusWidth,
      7,
      "F"
    );

    doc.setTextColor(
      95,
      118,
      83
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(7);

    doc.text(
      statusLabel,
      pageWidth -
        marginX -
        statusWidth / 2,
      y + 13.6,
      {
        align: "center",
      }
    );

    /* TÍTULO */

    y += 16;

    doc.setFont(
      "times",
      "bold"
    );

    doc.setFontSize(27);

    doc.setTextColor(
      dark.r,
      dark.g,
      dark.b
    );

    doc.text(
      "Presupuesto",
      marginX,
      y
    );

    y += 7;

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(8);

    doc.setTextColor(
      muted.r,
      muted.g,
      muted.b
    );

    doc.text(
      `Presupuesto #${budget.id}`,
      marginX,
      y
    );

    y += 8;

    doc.setDrawColor(
      border.r,
      border.g,
      border.b
    );

    doc.setLineWidth(
      0.3
    );

    doc.line(
      marginX,
      y,
      pageWidth -
        marginX,
      y
    );

    /* =========================================
       PACIENTE + PROFESIONALES
    ========================================= */

    y += 12;

    const leftX =
      marginX;

    const rightX =
      112;

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(7);

    doc.setTextColor(
      green.r,
      green.g,
      green.b
    );

    doc.text(
      "P A C I E N T E",
      leftX,
      y
    );

    doc.text(
      "E S P E C I A L I S T A / S",
      rightX,
      y
    );

    y += 7;

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(12);

    doc.setTextColor(
      dark.r,
      dark.g,
      dark.b
    );

    doc.text(
      patientName,
      leftX,
      y
    );

    let patientY =
      y + 7;

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(8);

    doc.setTextColor(
      muted.r,
      muted.g,
      muted.b
    );

    if (
      budget.patient.dni
    ) {
      doc.text(
        `DNI: ${budget.patient.dni}`,
        leftX,
        patientY
      );

      patientY += 5;
    }

    if (
      budget.patient.phone
    ) {
      doc.text(
        `Teléfono: ${budget.patient.phone}`,
        leftX,
        patientY
      );

      patientY += 5;
    }

    if (
      budget.patient.branch
    ) {
      const branchText = [
        budget.patient.branch
          .name,
        budget.patient.branch
          .city,
      ]
        .filter(Boolean)
        .join(" — ");

      doc.text(
        `Sucursal: ${branchText}`,
        leftX,
        patientY
      );

      patientY += 5;
    }

    doc.text(
      `Plan: ${
        budget.patient.plan
          ?.name ||
        "Sin plan"
      }`,
      leftX,
      patientY
    );

    /* PROFESIONALES */

    let doctorY = y;

    if (
      budget.doctors.length >
      0
    ) {
      for (const {
        doctor,
      } of budget.doctors) {
        const doctorName =
          doctor.name ||
          doctor.user?.name ||
          "Especialista";

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(9);

        doc.setTextColor(
          dark.r,
          dark.g,
          dark.b
        );

        doc.text(
          doctorName,
          rightX,
          doctorY
        );

        doctorY += 4.5;

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(7);

        doc.setTextColor(
          muted.r,
          muted.g,
          muted.b
        );

        if (
          doctor.specialty
        ) {
          doc.text(
            doctor.specialty,
            rightX,
            doctorY
          );

          doctorY += 4;
        }

        if (
          doctor.professionalLicense
        ) {
          doc.text(
            `MP ${doctor.professionalLicense}`,
            rightX,
            doctorY
          );

          doctorY += 6;
        }
      }
    } else {
      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(8);

      doc.setTextColor(
        dark.r,
        dark.g,
        dark.b
      );

      doc.text(
        "Sin especialista asignado",
        rightX,
        doctorY
      );
    }

    y = Math.max(
      patientY,
      doctorY
    );

    /* =========================================
       DETALLE
    ========================================= */

    y += 12;

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(7);

    doc.setTextColor(
      green.r,
      green.g,
      green.b
    );

    doc.text(
      "D E T A L L E   D E L   P R E S U P U E S T O",
      marginX,
      y
    );

    y += 6;

    const colTreatment =
      marginX + 4;

    const colQuantity =
      111;

    const colUnitPrice =
      157;

    const colTotal =
      pageWidth -
      marginX -
      4;

    /* CABECERA TABLA */

    doc.setFillColor(
      background.r,
      background.g,
      background.b
    );

    doc.setDrawColor(
      border.r,
      border.g,
      border.b
    );

    doc.rect(
      marginX,
      y,
      contentWidth,
      10,
      "FD"
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(7);

    doc.setTextColor(
      muted.r,
      muted.g,
      muted.b
    );

    doc.text(
      "TRATAMIENTO",
      colTreatment,
      y + 6
    );

    doc.text(
      "CANTIDAD",
      colQuantity,
      y + 6,
      {
        align: "center",
      }
    );

    doc.text(
      "PRECIO UNITARIO",
      colUnitPrice,
      y + 6,
      {
        align: "right",
      }
    );

    doc.text(
      "TOTAL",
      colTotal,
      y + 6,
      {
        align: "right",
      }
    );

    y += 10;

    /* FILAS */

    for (const item of budget.items) {
      const serviceLines =
        doc.splitTextToSize(
          item.serviceName ||
            "Sin descripción",
          75
        );

      const lineCount =
        Math.max(
          1,
          serviceLines.length
        );

      const rowHeight =
        Math.max(
          11,
          lineCount * 4.2 +
            5
        );

      doc.setDrawColor(
        border.r,
        border.g,
        border.b
      );

      doc.rect(
        marginX,
        y,
        contentWidth,
        rowHeight
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(8);

      doc.setTextColor(
        dark.r,
        dark.g,
        dark.b
      );

      doc.text(
        serviceLines,
        colTreatment,
        y + 6
      );

      doc.text(
        String(
          item.quantity
        ),
        colQuantity,
        y + 6,
        {
          align: "center",
        }
      );

      doc.text(
        formatMoney(
          item.unitPrice
        ),
        colUnitPrice,
        y + 6,
        {
          align: "right",
        }
      );

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        formatMoney(
          item.total
        ),
        colTotal,
        y + 6,
        {
          align: "right",
        }
      );

      y += rowHeight;
    }

    /* =========================================
       TOTALES
    ========================================= */

    y += 8;

    const totalLabelX =
      119;

    const totalValueX =
      pageWidth -
      marginX;

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(8);

    doc.setTextColor(
      muted.r,
      muted.g,
      muted.b
    );

    doc.text(
      "Subtotal",
      totalLabelX,
      y
    );

    doc.setTextColor(
      dark.r,
      dark.g,
      dark.b
    );

    doc.text(
      formatMoney(
        subtotal
      ),
      totalValueX,
      y,
      {
        align: "right",
      }
    );

    y += 7;

    doc.setTextColor(
      muted.r,
      muted.g,
      muted.b
    );

    doc.text(
      "Descuento",
      totalLabelX,
      y
    );

    doc.setTextColor(
      dark.r,
      dark.g,
      dark.b
    );

    doc.text(
      `${discount}%`,
      totalValueX,
      y,
      {
        align: "right",
      }
    );

    y += 5;

    doc.setDrawColor(
      border.r,
      border.g,
      border.b
    );

    doc.line(
      totalLabelX,
      y,
      totalValueX,
      y
    );

    y += 8;

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(12);

    doc.setTextColor(
      dark.r,
      dark.g,
      dark.b
    );

    doc.text(
      "Total",
      totalLabelX,
      y
    );

    doc.setTextColor(
      82,
      105,
      67
    );

    doc.text(
      formatMoney(total),
      totalValueX,
      y,
      {
        align: "right",
      }
    );

    /* =========================================
       VALIDEZ
    ========================================= */

    y += 13;

    doc.setFillColor(
      251,
      250,
      246
    );

    doc.setDrawColor(
      border.r,
      border.g,
      border.b
    );

    doc.rect(
      marginX,
      y,
      contentWidth,
      12,
      "FD"
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(7.5);

    doc.setTextColor(
      muted.r,
      muted.g,
      muted.b
    );

    doc.text(
      "Este presupuesto tiene una validez de 30 días a partir de la fecha de emisión.",
      marginX + 5,
      y + 7
    );

    /* =========================================
       FIRMAS ABAJO DE TODO
    ========================================= */

    const patientSignature =
      await normalizeImageSource(
        budget.patientSignature
      );

    const doctorSignature =
      await normalizeImageSource(
        budget.doctorSignature
      );

    const signatureImageY =
      242;

    const signatureLineY =
      266;

    const signatureWidth =
      68;

    const patientX =
      marginX + 3;

    const doctorX =
      pageWidth -
      marginX -
      signatureWidth -
      3;

    if (
      patientSignature
    ) {
      try {
        doc.addImage(
          patientSignature,
          getImageFormat(
            patientSignature
          ),
          patientX,
          signatureImageY,
          signatureWidth,
          20,
          undefined,
          "FAST"
        );
      } catch (error) {
        console.error(
          "No se pudo agregar la firma del paciente:",
          error
        );
      }
    }

    if (
      doctorSignature
    ) {
      try {
        doc.addImage(
          doctorSignature,
          getImageFormat(
            doctorSignature
          ),
          doctorX,
          signatureImageY,
          signatureWidth,
          20,
          undefined,
          "FAST"
        );
      } catch (error) {
        console.error(
          "No se pudo agregar la firma del profesional:",
          error
        );
      }
    }

    /* LÍNEAS DE FIRMA */

    doc.setDrawColor(
      126,
      136,
      133
    );

    doc.setLineWidth(
      0.3
    );

    doc.line(
      patientX,
      signatureLineY,
      patientX +
        signatureWidth,
      signatureLineY
    );

    doc.line(
      doctorX,
      signatureLineY,
      doctorX +
        signatureWidth,
      signatureLineY
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(8);

    doc.setTextColor(
      dark.r,
      dark.g,
      dark.b
    );

    doc.text(
      "Firma del paciente",
      patientX +
        signatureWidth / 2,
      signatureLineY + 5,
      {
        align: "center",
      }
    );

    doc.text(
      "Firma y sello del profesional",
      doctorX +
        signatureWidth / 2,
      signatureLineY + 5,
      {
        align: "center",
      }
    );

    /* ACLARACIÓN PACIENTE */

    doc.setFontSize(7);

    doc.setTextColor(
      muted.r,
      muted.g,
      muted.b
    );

    doc.text(
      "Aclaración:",
      patientX,
      signatureLineY + 13
    );

    doc.line(
      patientX + 17,
      signatureLineY + 13,
      patientX +
        signatureWidth,
      signatureLineY + 13
    );

    /* ACLARACIÓN PROFESIONAL */

    doc.text(
      "Aclaración:",
      doctorX,
      signatureLineY + 13
    );

    doc.line(
      doctorX + 17,
      signatureLineY + 13,
      doctorX +
        signatureWidth,
      signatureLineY + 13
    );

    doc.text(
      "Matrícula:",
      doctorX,
      signatureLineY + 20
    );

    doc.line(
      doctorX + 16,
      signatureLineY + 20,
      doctorX +
        signatureWidth,
      signatureLineY + 20
    );

    /* =========================================
       DEVOLVER PDF
    ========================================= */

    const pdfBuffer =
      Buffer.from(
        doc.output(
          "arraybuffer"
        )
      );

    return new NextResponse(
      pdfBuffer,
      {
        headers: {
          "Content-Type":
            "application/pdf",

          /*
           * inline hace que el navegador
           * abra directamente el PDF.
           */
          "Content-Disposition":
            `inline; filename="presupuesto-${budget.id}.pdf"`,

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "ERROR GENERANDO PDF DEL PRESUPUESTO:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo generar el presupuesto.",
      },
      {
        status: 500,
      }
    );
  }
}