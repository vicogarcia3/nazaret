import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const config = await prisma.siteConfig.findFirst();
  return NextResponse.json(config);
}

export async function PUT(req: Request) {
  const body = await req.json();

  const current = await prisma.siteConfig.findUnique({
    where: { id: 1 },
  });

  const config = await prisma.siteConfig.upsert({
    where: { id: 1 },
    update: {
      clinicName: body.clinicName ?? current?.clinicName,
      heroTitle: body.heroTitle ?? current?.heroTitle,
      heroSubtitle: body.heroSubtitle ?? current?.heroSubtitle,
      heroImage: body.heroImage ?? current?.heroImage,

      whatsapp: body.whatsapp ?? current?.whatsapp,
      instagram: body.instagram ?? current?.instagram,
      facebook: body.facebook ?? current?.facebook,

      businessHoursWeek:
        body.businessHoursWeek ?? current?.businessHoursWeek,
      businessHoursSaturday:
        body.businessHoursSaturday ?? current?.businessHoursSaturday,
      businessHoursSunday:
        body.businessHoursSunday ?? current?.businessHoursSunday,
    },
    create: {
      id: 1,
      clinicName: body.clinicName ?? "Consultorios Nazaret",
      heroTitle: body.heroTitle ?? "Tu sonrisa, nuestra prioridad",
      heroSubtitle:
        body.heroSubtitle ??
        "Atención odontológica integral en un ambiente cálido, profesional y de confianza.",
      heroImage: body.heroImage ?? "",

      whatsapp: body.whatsapp ?? "",
      instagram: body.instagram ?? "",
      facebook: body.facebook ?? "",

      businessHoursWeek:
        body.businessHoursWeek ?? "Lunes a Viernes: 09:00 — 19:00",
      businessHoursSaturday:
        body.businessHoursSaturday ?? "Sábados: 09:00 — 13:00",
      businessHoursSunday: body.businessHoursSunday ?? "Domingos: Cerrado",
    },
  });

  return NextResponse.json(config);
}