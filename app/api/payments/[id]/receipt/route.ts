import { NextResponse } from "next/server";
import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ReceiptData = {
  receiptNumber?: string;
  issuedAt?: string;
  paidAt?: string | null;

  patient?: {
    id?: string;
    name?: string;
    dni?: string | null;
    email?: string | null;
    phone?: string | null;
  };

  branch?: {
    id?: string;
    name?: string;
    address?: string;
    city?: string;
    phone?: string | null;
  };

  professional?: {
    name?: string;
    license?: string | null;
  };

  budget?: {
    id?: string;
    description?: string | null;
    total?: number | null;
  } | null;

  payment?: {
    id?: string;
    concept?: string | null;
    amount?: number;
    paymentMethod?: string | null;
  };

  amounts?: {
    previousPaidAmount?: number;
    paymentAmount?: number;
    paidAmountAfterPayment?: number;
    remainingBalance?: number | null;
  };

  disclaimer?: string;
};

function formatMoney(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-");
}

function splitTextIntoLines(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
) {
  const paragraphs = text.split(/\r?\n/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const candidate = currentLine
        ? `${currentLine} ${word}`
        : word;

      const candidateWidth = font.widthOfTextAtSize(
        candidate,
        fontSize
      );

      if (
        candidateWidth <= maxWidth ||
        !currentLine
      ) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

function drawWrappedText({
  page,
  text,
  x,
  y,
  maxWidth,
  font,
  fontSize,
  lineHeight,
  color = rgb(0.16, 0.25, 0.23),
}: {
  page: PDFPage;
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  font: PDFFont;
  fontSize: number;
  lineHeight: number;
  color?: ReturnType<typeof rgb>;
}) {
  const lines = splitTextIntoLines(
    text,
    font,
    fontSize,
    maxWidth
  );

  let currentY = y;

  for (const line of lines) {
    page.drawText(line, {
      x,
      y: currentY,
      size: fontSize,
      font,
      color,
    });

    currentY -= lineHeight;
  }

  return currentY;
}

function drawField({
  page,
  label,
  value,
  x,
  y,
  width,
  regularFont,
  boldFont,
}: {
  page: PDFPage;
  label: string;
  value: string;
  x: number;
  y: number;
  width: number;
  regularFont: PDFFont;
  boldFont: PDFFont;
}) {
  page.drawText(label.toUpperCase(), {
    x,
    y,
    size: 8,
    font: boldFont,
    color: rgb(0.48, 0.57, 0.42),
  });

  return drawWrappedText({
    page,
    text: value || "-",
    x,
    y: y - 16,
    maxWidth: width,
    font: regularFont,
    fontSize: 10,
    lineHeight: 13,
  });
}

export async function GET(
  request: Request,
  context: RouteContext
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

    const payment = await prisma.payment.findUnique({
      where: {
        id,
      },
      include: {
        patient: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        {
          error: "El pago no existe.",
        },
        {
          status: 404,
        }
      );
    }

    const isAdmin = session.user.role === "ADMIN";

    const isPaymentOwner =
      session.user.role === "PATIENT" &&
      payment.patient.userId === session.user.id;

    if (!isAdmin && !isPaymentOwner) {
      return NextResponse.json(
        {
          error:
            "No tenés permiso para acceder a este comprobante.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      !payment.receiptNumber ||
      !payment.receiptIssuedAt ||
      !payment.receiptData
    ) {
      return NextResponse.json(
        {
          error:
            "Este pago todavía no tiene un comprobante emitido.",
        },
        {
          status: 409,
        }
      );
    }

    const receipt =
      payment.receiptData as unknown as ReceiptData;

    const pdfDocument = await PDFDocument.create();

    const page = pdfDocument.addPage([
      595.28,
      841.89,
    ]);

    const regularFont =
      await pdfDocument.embedFont(
        StandardFonts.Helvetica
      );

    const boldFont =
      await pdfDocument.embedFont(
        StandardFonts.HelveticaBold
      );

    const pageWidth = page.getWidth();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;

    const dark = rgb(0.1, 0.23, 0.2);
    const green = rgb(0.44, 0.52, 0.37);
    const lightGreen = rgb(0.94, 0.96, 0.91);
    const border = rgb(0.84, 0.82, 0.77);
    const muted = rgb(0.42, 0.47, 0.45);

    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: page.getHeight(),
      color: rgb(0.98, 0.97, 0.94),
    });

    page.drawRectangle({
      x: margin,
      y: 70,
      width: contentWidth,
      height: 700,
      color: rgb(1, 1, 1),
      borderColor: border,
      borderWidth: 1,
    });

    page.drawText(
      receipt.branch?.name ||
        "Consultorios Nazaret",
      {
        x: margin + 28,
        y: 730,
        size: 18,
        font: boldFont,
        color: dark,
      }
    );

    page.drawText("COMPROBANTE DE PAGO", {
      x: margin + 28,
      y: 696,
      size: 22,
      font: boldFont,
      color: dark,
    });

    page.drawText(
      receipt.receiptNumber ||
        payment.receiptNumber,
      {
        x: margin + 28,
        y: 675,
        size: 10,
        font: boldFont,
        color: green,
      }
    );

    page.drawRectangle({
      x: margin + 28,
      y: 617,
      width: contentWidth - 56,
      height: 40,
      color: lightGreen,
    });

    page.drawText("IMPORTE RECIBIDO", {
      x: margin + 44,
      y: 640,
      size: 8,
      font: boldFont,
      color: green,
    });

    page.drawText(
      formatMoney(
        receipt.payment?.amount ??
          Number(payment.amount)
      ),
      {
        x: margin + 44,
        y: 621,
        size: 16,
        font: boldFont,
        color: dark,
      }
    );

    let y = 582;

    y = drawField({
      page,
      label: "Fecha del pago",
      value: formatDateTime(
        receipt.paidAt ??
          payment.paidAt?.toISOString()
      ),
      x: margin + 28,
      y,
      width: 210,
      regularFont,
      boldFont,
    });

    drawField({
      page,
      label: "Medio de pago",
      value:
        receipt.payment?.paymentMethod ||
        payment.paymentMethod ||
        "No informado",
      x: margin + 280,
      y: 582,
      width: 220,
      regularFont,
      boldFont,
    });

    page.drawLine({
      start: {
        x: margin + 28,
        y: y - 10,
      },
      end: {
        x: pageWidth - margin - 28,
        y: y - 10,
      },
      thickness: 1,
      color: border,
    });

    y -= 42;

    page.drawText("DATOS DEL PACIENTE", {
      x: margin + 28,
      y,
      size: 10,
      font: boldFont,
      color: dark,
    });

    y -= 28;

    drawField({
      page,
      label: "Paciente",
      value:
        receipt.patient?.name ||
        "No informado",
      x: margin + 28,
      y,
      width: 210,
      regularFont,
      boldFont,
    });

    drawField({
      page,
      label: "DNI",
      value:
        receipt.patient?.dni ||
        "No informado",
      x: margin + 280,
      y,
      width: 220,
      regularFont,
      boldFont,
    });

    y -= 58;

    page.drawLine({
      start: {
        x: margin + 28,
        y,
      },
      end: {
        x: pageWidth - margin - 28,
        y,
      },
      thickness: 1,
      color: border,
    });

    y -= 32;

    page.drawText("DETALLE DEL PAGO", {
      x: margin + 28,
      y,
      size: 10,
      font: boldFont,
      color: dark,
    });

    y -= 28;

    y = drawField({
      page,
      label: "Concepto",
      value:
        receipt.payment?.concept ||
        payment.concept ||
        "Entrega de pago",
      x: margin + 28,
      y,
      width: contentWidth - 56,
      regularFont,
      boldFont,
    });

    y -= 22;

    drawField({
      page,
      label: "Profesional",
      value:
        receipt.professional?.name ||
        "No informado",
      x: margin + 28,
      y,
      width: 210,
      regularFont,
      boldFont,
    });

    drawField({
      page,
      label: "Matrícula",
      value:
        receipt.professional?.license ||
        "No informada",
      x: margin + 280,
      y,
      width: 220,
      regularFont,
      boldFont,
    });

    y -= 68;

    page.drawRectangle({
      x: margin + 28,
      y: y - 82,
      width: contentWidth - 56,
      height: 92,
      color: rgb(0.98, 0.98, 0.96),
      borderColor: border,
      borderWidth: 1,
    });

    const summaryY = y - 14;
    const columnWidth =
      (contentWidth - 88) / 3;

    drawField({
      page,
      label: "Total presupuesto",
      value: formatMoney(
        receipt.budget?.total
      ),
      x: margin + 42,
      y: summaryY,
      width: columnWidth,
      regularFont,
      boldFont,
    });

    drawField({
      page,
      label: "Total abonado",
      value: formatMoney(
        receipt.amounts
          ?.paidAmountAfterPayment
      ),
      x: margin + 42 + columnWidth,
      y: summaryY,
      width: columnWidth,
      regularFont,
      boldFont,
    });

    drawField({
      page,
      label: "Saldo pendiente",
      value: formatMoney(
        receipt.amounts?.remainingBalance
      ),
      x:
        margin +
        42 +
        columnWidth * 2,
      y: summaryY,
      width: columnWidth,
      regularFont,
      boldFont,
    });

    const branchText = [
      receipt.branch?.address,
      receipt.branch?.city,
      receipt.branch?.phone
        ? `Tel.: ${receipt.branch.phone}`
        : null,
    ]
      .filter(Boolean)
      .join(" - ");

    drawWrappedText({
      page,
      text:
        branchText ||
        "Datos de la sucursal no informados.",
      x: margin + 28,
      y: 128,
      maxWidth: contentWidth - 56,
      font: regularFont,
      fontSize: 8,
      lineHeight: 11,
      color: muted,
    });

    page.drawText(
      receipt.disclaimer ||
        "Comprobante interno de pago. No válido como factura fiscal.",
      {
        x: margin + 28,
        y: 96,
        size: 8,
        font: boldFont,
        color: rgb(0.65, 0.2, 0.18),
      }
    );

    const pdfBytes = await pdfDocument.save();

    const download =
      new URL(request.url).searchParams.get(
        "download"
      ) !== "0";

    const filename = sanitizeFilename(
      `${payment.receiptNumber}-${receipt.patient?.name || "paciente"}.pdf`
    );

    return new NextResponse(
      Buffer.from(pdfBytes),
      {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `${
            download ? "attachment" : "inline"
          }; filename="${filename}"`,
          "Cache-Control":
            "private, no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "Error generando comprobante PDF:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo generar el comprobante.",
      },
      {
        status: 500,
      }
    );
  }
}