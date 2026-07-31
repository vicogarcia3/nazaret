import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { resend } from "@/lib/resend";

function formatAppointmentDate(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatAppointmentTime(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "PATIENT") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const { doctorId, date, time, treatmentName } = body;

    if (!doctorId) {
      return NextResponse.json(
        {
          error: "Tenés que seleccionar un especialista.",
        },
        { status: 400 }
      );
    }

    if (!date || !time) {
      return NextResponse.json(
        {
          error: "Tenés que seleccionar fecha y horario.",
        },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        user: true,
        branch: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    const doctor = await prisma.doctor.findFirst({
      where: {
        id: doctorId,
        active: true,
        branches: {
          some: {
            branchId: patient.branchId,
          },
        },
      },
      include: {
        user: true,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        {
          error:
            "El especialista no pertenece a tu sucursal.",
        },
        { status: 400 }
      );
    }

    const appointmentDate = new Date(
      `${date}T${time}:00-03:00`
    );

    if (Number.isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        {
          error: "La fecha o el horario no son válidos.",
        },
        { status: 400 }
      );
    }

    const existingAppointment =
      await prisma.appointment.findFirst({
        where: {
          doctorId,
          branchId: patient.branchId,
          date: appointmentDate,
          status: {
            not: "CANCELED",
          },
        },
      });

    if (existingAppointment) {
      return NextResponse.json(
        {
          error: "Ese horario ya no está disponible.",
        },
        { status: 409 }
      );
    }

    const patientName =
      patient.user?.name?.trim() ||
      `${patient.firstName} ${patient.lastName}`.trim();

    const treatment =
      typeof treatmentName === "string" &&
      treatmentName.trim()
        ? treatmentName.trim()
        : "Turno solicitado";

    const formattedDate =
      formatAppointmentDate(appointmentDate);

    const formattedTime =
      formatAppointmentTime(appointmentDate);

    /*
     * El turno y la notificación interna se crean juntos.
     * Si alguno falla, no se guarda ninguno.
     */
    const appointment = await prisma.$transaction(
      async (transaction) => {
        const createdAppointment =
          await transaction.appointment.create({
            data: {
              patientId: patient.id,
              doctorId: doctor.id,
              branchId: patient.branchId,
              date: appointmentDate,
              notes: treatment,
              status: "PENDING",
            },
          });

        await transaction.notification.create({
          data: {
            doctorId: doctor.id,

            title: "Nueva solicitud de turno",

            message: [
              `Paciente: ${patientName}`,
              `Tratamiento: ${treatment}`,
              `Fecha: ${formattedDate}`,
              `Horario: ${formattedTime} hs`,
              `Sucursal: ${patient.branch.name}`,
              `Dirección: ${patient.branch.address}, ${patient.branch.city}`,
              "Estado: Pendiente",
            ].join("\n"),

            type: "APPOINTMENT",
            actor: "PATIENT",

            appointmentId: createdAppointment.id,

            actionUrl:
              "/dashboard/doctor/notificaciones",
          },
        });

        return createdAppointment;
      }
    );

    /*
     * El correo se envía después.
     * Si Resend falla, el turno y la notificación interna se conservan.
     */
    try {
      if (doctor.user?.email) {
        await resend.emails.send({
          from:
            process.env.RESEND_FROM_EMAIL ||
            "Consultorios Nazaret <notificaciones@consultoriosnazaret.com>",

          to: doctor.user.email,

          subject: "Nueva solicitud de turno",

          html: `
            <div style="font-family: Arial, sans-serif; color: #263F3B; line-height: 1.6;">
              <h2 style="color: #263F3B;">
                Nueva solicitud de turno
              </h2>

              <p>
                alt={doctor.name || doctor.user?.name || "Odontólogo"}:
              </p>

              <p>
                <strong>${patientName}</strong> solicitó un turno contigo.
              </p>

              <p>
                Más detalles en tu portal especialista.
              </p>

              <div style="margin-top: 24px; padding: 16px; background: #F2F5EF; border: 1px solid #D5DDCF;">
                <p style="margin: 0 0 8px;">
                  <strong>Fecha:</strong> ${formattedDate}
                </p>

                <p style="margin: 0 0 8px;">
                  <strong>Horario:</strong> ${formattedTime} hs
                </p>

                <p style="margin: 0 0 8px;">
                  <strong>Sucursal:</strong> ${patient.branch.name}
                </p>

                <p style="margin: 0;">
                  <strong>Tratamiento:</strong> ${treatment}
                </p>
              </div>

              <p style="margin-top: 24px; color: #6B7774;">
                Consultorios Nazaret
              </p>
            </div>
          `,
        });
      }
    } catch (emailError) {
      console.error(
        "El turno fue creado, pero no se pudo enviar el email:",
        emailError
      );
    }

    return NextResponse.json(appointment, {
      status: 201,
    });
  } catch (error) {
    console.error(
      "Error al solicitar el turno:",
      error
    );

    return NextResponse.json(
      {
        error: "No se pudo solicitar el turno.",
      },
      { status: 500 }
    );
  }
}