import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const budget = await prisma.budget.findUnique({
    where: { id },
    include: {
      patient: {
        include: {
          branch: true,
          plan: true,
        },
      },
      doctor: {
        include: {
          user: true,
        },
      },
      items: true,
    },
  });

  if (!budget) {
    return NextResponse.json(
      { error: "Presupuesto no encontrado" },
      { status: 404 }
    );
  }

  const doc = new jsPDF();

  const clinicName = "Consultorios Nazaret";
  const margin = 22;
  let y = 24;

  doc.setTextColor(38, 63, 59);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(clinicName.toUpperCase(), margin, y);

  y += 8;
  doc.setFontSize(11);
  doc.setTextColor(95, 111, 107);
  doc.text("Presupuesto odontológico", margin, y);

  y += 14;
  doc.setDrawColor(222, 217, 205);
  doc.line(margin, y, 190, y);

  y += 14;

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
  doc.text(`${budget.patient.firstName} ${budget.patient.lastName}`, leftX, y);
  doc.text(new Date(budget.createdAt).toLocaleDateString("es-AR"), rightX, y);

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(162, 179, 139);
  doc.text("DNI", leftX, y);
  doc.text("ODONTÓLOGO", rightX, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(38, 63, 59);
  doc.text(budget.patient.dni || "-", leftX, y);
  doc.text(budget.doctor?.user?.name || "No asignado", rightX, y);

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(162, 179, 139);
  doc.text("SUCURSAL", leftX, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(38, 63, 59);
  doc.text(budget.patient.branch.name || "-", leftX, y);

  y += 18;

  doc.setFillColor(247, 245, 239);
  doc.rect(margin, y, 168, 11, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(38, 63, 59);
  doc.text("TRATAMIENTO", margin + 4, y + 7);
  doc.text("PRECIO", 176, y + 7, { align: "right" });

  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  budget.items.forEach((item) => {
    doc.setTextColor(38, 63, 59);
    doc.text(item.serviceName || "Sin descripción", margin + 3, y);

    doc.text(`$${Number(item.total).toLocaleString("es-AR")}`, 176, y, {
      align: "right",
    });

    y += 9;
  });

  y += 6;
  doc.setDrawColor(222, 217, 205);
  doc.line(margin, y, 190, y);

  y += 14;

  const labelX = 125;
  const valueX = 175;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(95, 111, 107);

  doc.text("Subtotal", labelX, y);
  doc.text(
    `$${Number(budget.subtotal).toLocaleString("es-AR")}`,
    valueX,
    y,
    { align: "right" }
  );

  y += 8;
  doc.text(`Descuento (${Number(budget.discount)}%)`, labelX, y);
  doc.text(
    `-$${(
      Number(budget.subtotal) *
      (Number(budget.discount) / 100)
    ).toLocaleString("es-AR")}`,
    valueX,
    y,
    { align: "right" }
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
    `$${Number(budget.total).toLocaleString("es-AR")}`,
    valueX,
    y,
    { align: "right" }
  );

  y += 28;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(95, 111, 107);
  doc.text("Validez del presupuesto: 30 días.", margin, y);

  y += 28;
  doc.setDrawColor(38, 63, 59);
  doc.line(margin, y, margin + 65, y);

  y += 7;
  doc.setFontSize(9);
  doc.text("Firma y sello", margin, y);

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    "Este presupuesto está sujeto a evaluación profesional y disponibilidad de turnos.",
    margin,
    282
  );

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="presupuesto-${budget.id}.pdf"`,
    },
  });
}