import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function formatMoney(value: unknown) {
  return `$ ${Number(value).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function sanitizeReceiptPart(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").slice(-8);
}

async function ensureReceiptNumber(paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
    },
    select: {
      id: true,
      receiptNumber: true,
      receiptIssuedAt: true,
      paidAt: true,
      createdAt: true,
    },
  });

  if (!payment) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  if (payment.receiptNumber) {
    return {
      receiptNumber: payment.receiptNumber,
      receiptIssuedAt:
        payment.receiptIssuedAt ||
        payment.paidAt ||
        payment.createdAt,
    };
  }

  const issueDate =
    payment.paidAt ||
    payment.createdAt;

  const year =
    issueDate.getFullYear();

  const receiptNumber =
    `PAGO-${year}-${sanitizeReceiptPart(
      payment.id
    ).toUpperCase()}`;

  const updatedPayment =
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        receiptNumber,
        receiptIssuedAt: new Date(),
      },
      select: {
        receiptNumber: true,
        receiptIssuedAt: true,
      },
    });

  return {
    receiptNumber:
      updatedPayment.receiptNumber!,
    receiptIssuedAt:
      updatedPayment.receiptIssuedAt!,
  };
}

export async function GET(
  _request: Request,
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

    const payment =
      await prisma.payment.findUnique({
        where: {
          id,
        },

        include: {
          patient: {
            include: {
              branch: true,
              user: true,
            },
          },

          budget: {
            include: {
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
          },
        },
      });

    if (!payment) {
      return NextResponse.json(
        {
          error:
            "Pago no encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      payment.status !== "PAID"
    ) {
      return NextResponse.json(
        {
          error:
            "El comprobante solo puede generarse para pagos registrados como abonados.",
        },
        {
          status: 400,
        }
      );
    }

    if (!payment.budget) {
      return NextResponse.json(
        {
          error:
            "Este pago no está asociado a un presupuesto.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       PERMISOS
    ===================================================== */

    const isAdmin =
      session.user.role === "ADMIN";

    const isPatient =
      session.user.role === "PATIENT" &&
      payment.patient.userId ===
        session.user.id;

    const isDoctor =
      session.user.role === "DOCTOR" &&
      payment.budget.doctors.some(
        ({ doctor }) =>
          doctor.userId ===
          session.user.id
      );

    if (
      !isAdmin &&
      !isPatient &&
      !isDoctor
    ) {
      return NextResponse.json(
        {
          error:
            "No tenés permiso para ver este comprobante.",
        },
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       FECHA DE REFERENCIA DEL PAGO
    ===================================================== */

    const paymentDate =
      payment.paidAt ||
      payment.createdAt;

    /*
     * Tomamos todos los pagos PAID del mismo
     * presupuesto ocurridos hasta este pago.
     *
     * Si dos pagos tienen la misma fecha, usamos
     * createdAt para mantener consistencia.
     */
    const paidPayments =
      await prisma.payment.findMany({
        where: {
          budgetId:
            payment.budgetId!,

          status: "PAID",

          OR: [
            {
              paidAt: {
                lt: paymentDate,
              },
            },
            {
              paidAt:
                paymentDate,

              createdAt: {
                lte:
                  payment.createdAt,
              },
            },
            {
              paidAt: null,

              createdAt: {
                lte:
                  payment.createdAt,
              },
            },
          ],
        },

        orderBy: [
          {
            paidAt: "asc",
          },
          {
            createdAt: "asc",
          },
        ],

        select: {
          id: true,
          amount: true,
          paidAt: true,
          createdAt: true,
        },
      });

    const paidAccumulated =
      paidPayments.reduce(
        (
          accumulator,
          currentPayment
        ) =>
          accumulator +
          Number(
            currentPayment.amount
          ),
        0
      );

    const currentAmount =
      Number(payment.amount);

    const paidBefore =
      Math.max(
        paidAccumulated -
          currentAmount,
        0
      );

    const budgetTotal =
      Number(
        payment.budget.total
      );

    const remainingAfterPayment =
      Math.max(
        budgetTotal -
          paidAccumulated,
        0
      );

    const progressPercentage =
      budgetTotal > 0
        ? Math.min(
            Math.round(
              (paidAccumulated /
                budgetTotal) *
                100
            ),
            100
          )
        : 0;

    const {
      receiptNumber,
    } =
      await ensureReceiptNumber(
        payment.id
      );

    const doctorNames =
      payment.budget.doctors.length >
      0
        ? payment.budget.doctors
            .map(
              ({ doctor }) =>
                doctor.name ||
                doctor.user?.name ||
                "Especialista"
            )
            .join(", ")
        : "Sin especialista asignado";

    const patientName =
      `${payment.patient.lastName}, ${payment.patient.firstName}`;

    /* =====================================================
       PDF
    ===================================================== */

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const pageHeight = 297;

    const marginX = 16;
    const contentWidth =
      pageWidth - marginX * 2;

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

    const soft = {
      r: 250,
      g: 249,
      b: 245,
    };

    let y = 17;

    /* =====================================================
       ENCABEZADO
    ===================================================== */

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(9);

    doc.setTextColor(
      green.r,
      green.g,
      green.b
    );

    doc.text(
      "C O N S U L T O R I O S   N A Z A R E T",
      marginX,
      y
    );

    doc.setTextColor(
      dark.r,
      dark.g,
      dark.b
    );

    doc.setFontSize(8);

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
      formatDate(paymentDate),
      pageWidth - marginX,
      y + 6,
      {
        align: "right",
      }
    );

    y += 16;

    doc.setFont(
      "times",
      "bold"
    );

    doc.setFontSize(25);

    doc.setTextColor(
      dark.r,
      dark.g,
      dark.b
    );

    doc.text(
      "Comprobante de pago",
      marginX,
      y
    );

    y += 8;

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
      `Comprobante N° ${receiptNumber}`,
      marginX,
      y
    );

    y += 8;

    doc.setDrawColor(
      border.r,
      border.g,
      border.b
    );

    doc.line(
      marginX,
      y,
      pageWidth - marginX,
      y
    );

    /* =====================================================
       PACIENTE / PRESUPUESTO
    ===================================================== */

    y += 12;

    const leftX = marginX;
    const rightX = 112;

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
      "P R E S U P U E S T O",
      rightX,
      y
    );

    y += 7;

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(11);

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

    doc.setFontSize(8.5);

    doc.text(
      `#${payment.budget.id}`,
      rightX,
      y
    );

    let leftY = y + 7;
    let rightY = y + 7;

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
      payment.patient.dni
    ) {
      doc.text(
        `DNI: ${payment.patient.dni}`,
        leftX,
        leftY
      );

      leftY += 5;
    }

    if (
      payment.patient.phone
    ) {
      doc.text(
        `Teléfono: ${payment.patient.phone}`,
        leftX,
        leftY
      );

      leftY += 5;
    }

    if (
      payment.patient.branch
    ) {
      doc.text(
        `Sucursal: ${payment.patient.branch.name}`,
        leftX,
        leftY
      );

      leftY += 5;
    }

    doc.text(
      `Especialista/s: ${doctorNames}`,
      rightX,
      rightY,
      {
        maxWidth: 78,
      }
    );

    rightY += 10;

    doc.text(
      `Total presupuesto: ${formatMoney(
        budgetTotal
      )}`,
      rightX,
      rightY
    );

    y =
      Math.max(
        leftY,
        rightY
      ) + 10;

    /* =====================================================
       DETALLE DEL PAGO
    ===================================================== */

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
      "D E T A L L E   D E L   P A G O",
      marginX,
      y
    );

    y += 7;

    doc.setFillColor(
      soft.r,
      soft.g,
      soft.b
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
      37,
      "FD"
    );

    const detailLabelX =
      marginX + 5;

    const detailValueX =
      74;

    let detailY =
      y + 8;

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(8);

    doc.setTextColor(
      muted.r,
      muted.g,
      muted.b
    );

    doc.text(
      "Concepto",
      detailLabelX,
      detailY
    );

    doc.text(
      "Medio de pago",
      detailLabelX,
      detailY + 8
    );

    doc.text(
      "Fecha de pago",
      detailLabelX,
      detailY + 16
    );

    doc.text(
      "Importe abonado",
      detailLabelX,
      detailY + 24
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setTextColor(
      dark.r,
      dark.g,
      dark.b
    );

    doc.text(
      payment.concept ||
        "Pago de presupuesto",
      detailValueX,
      detailY,
      {
        maxWidth: 110,
      }
    );

    doc.text(
      payment.paymentMethod ||
        "Sin especificar",
      detailValueX,
      detailY + 8
    );

    doc.text(
      formatDate(paymentDate),
      detailValueX,
      detailY + 16
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(11);

    doc.setTextColor(
      82,
      105,
      67
    );

    doc.text(
      formatMoney(
        currentAmount
      ),
      detailValueX,
      detailY + 24
    );

    y += 49;

    /* =====================================================
       RESUMEN FINANCIERO HISTÓRICO
    ===================================================== */

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
      "R E S U M E N   D E L   P R E S U P U E S T O",
      marginX,
      y
    );

    y += 7;

    const labelX = marginX + 5;
    const valueX =
      pageWidth - marginX - 5;

    const summaryRows = [
      {
        label:
          "Total del presupuesto",
        value:
          formatMoney(
            budgetTotal
          ),
      },
      {
        label:
          "Abonado antes de este pago",
        value:
          formatMoney(
            paidBefore
          ),
      },
      {
        label:
          "Pago de este comprobante",
        value:
          formatMoney(
            currentAmount
          ),
      },
      {
        label:
          "Abonado acumulado",
        value:
          formatMoney(
            paidAccumulated
          ),
      },
      {
        label:
          "Saldo pendiente",
        value:
          formatMoney(
            remainingAfterPayment
          ),
      },
    ];

    summaryRows.forEach(
      (
        row,
        index
      ) => {
        const rowY =
          y + index * 10;

        doc.setFillColor(
          index ===
            summaryRows.length -
              1
            ? 247
            : 255,
          index ===
            summaryRows.length -
              1
            ? 245
            : 255,
          index ===
            summaryRows.length -
              1
            ? 239
            : 255
        );

        doc.setDrawColor(
          border.r,
          border.g,
          border.b
        );

        doc.rect(
          marginX,
          rowY,
          contentWidth,
          10,
          index ===
          summaryRows.length -
            1
            ? "FD"
            : "D"
        );

        doc.setFont(
          "helvetica",
          index >= 3
            ? "bold"
            : "normal"
        );

        doc.setFontSize(
          index >= 3
            ? 8.5
            : 8
        );

        doc.setTextColor(
          index ===
            summaryRows.length -
              1
            ? 130
            : dark.r,
          index ===
            summaryRows.length -
              1
            ? 95
            : dark.g,
          index ===
            summaryRows.length -
              1
            ? 25
            : dark.b
        );

        doc.text(
          row.label,
          labelX,
          rowY + 6.3
        );

        doc.text(
          row.value,
          valueX,
          rowY + 6.3,
          {
            align:
              "right",
          }
        );
      }
    );

    y +=
      summaryRows.length *
        10 +
      10;

    /* =====================================================
       FIRMAS ABAJO
    ===================================================== */

    const signatureLineY =
      pageHeight - 30;

    const signatureWidth =
      67;

    const patientX =
      marginX + 3;

    const professionalX =
      pageWidth -
      marginX -
      signatureWidth -
      3;

    doc.setDrawColor(
      126,
      136,
      133
    );

    doc.line(
      patientX,
      signatureLineY,
      patientX +
        signatureWidth,
      signatureLineY
    );

    doc.line(
      professionalX,
      signatureLineY,
      professionalX +
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
      professionalX +
        signatureWidth / 2,
      signatureLineY + 5,
      {
        align: "center",
      }
    );

    /* =====================================================
       SALIDA
    ===================================================== */

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

          "Content-Disposition":
            `inline; filename="comprobante-${receiptNumber}.pdf"`,

          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "ERROR GENERANDO COMPROBANTE DE PAGO:",
      error
    );

    if (
      error instanceof Error &&
      error.message ===
        "PAYMENT_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error:
            "Pago no encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "No se pudo generar el comprobante de pago.",
      },
      {
        status: 500,
      }
    );
  }
}