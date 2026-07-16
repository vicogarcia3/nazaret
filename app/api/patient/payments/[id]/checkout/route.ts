import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  const patient = await prisma.patient.findUnique({
    where: { userId: session.user.id },
  });

  if (!patient) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
  }

  const payment = await prisma.payment.findFirst({
    where: {
      id,
      patientId: patient.id,
      status: "PENDING",
    },
  });

  if (!payment) {
    return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  }

  const preference = new Preference(client);

  const result = await preference.create({
    body: {
      items: [
        {
          id: payment.id,
          title: payment.concept || "Pago del consultorio",
          quantity: 1,
          unit_price: Number(payment.amount),
          currency_id: "ARS",
        },
      ],
      external_reference: payment.id,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/patient/pagos`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/patient/pagos`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/patient/pagos`,
      },
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
    },
  });

  return NextResponse.json({
    initPoint: result.init_point,
  });
}