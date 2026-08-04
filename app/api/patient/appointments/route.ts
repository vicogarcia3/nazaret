import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

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

function isTransactionConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (
      !session?.user?.id ||
      session.user.role !== "PATIENT"
    ) {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const body = await req.json();

    const doctorId =
      typeof body.doctorId === "string"
        ? body.doctorId.trim()
        : "";

    const date =
      typeof body.date === "string"
        ? body.date.trim()
        : "";

    const time =
      typeof body.time === "string"
        ? body.time.trim()
        : "";

    const treatmentName =
      typeof body.treatmentName === "string"
        ? body.treatmentName.trim()
        : "";

    if (!doctorId) {
      return NextResponse.json(
        {
          error: "Tenés que seleccionar un especialista.",
        },
        {
          status: 400,
        }
      );
    }

    if (!date || !time) {
      return NextResponse.json(
        {
          error: "Tenés que seleccionar fecha y horario.",
        },
        {
          status: 400,
        }
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
        {
          error: "Paciente no encontrado.",
        },
        {
          status: 404,
        }
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
        {
          status: 400,
        }
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
        {
          status: 400,
        }
      );
    }

    if (appointmentDate.getTime() <= Date.now()) {
      return NextResponse.json(
        {
          error:
            "No se puede solicitar un turno en una fecha pasada.",
        },
        {
          status: 400,
        }
      );
    }

    const patientName =
      patient.user?.name?.trim() ||
      `${patient.firstName} ${patient.lastName}`.trim();

    const treatment =
      treatmentName || "Turno solicitado";

    const formattedDate =
      formatAppointmentDate(appointmentDate);

    const formattedTime =
      formatAppointmentTime(appointmentDate);

    let appointment:
      | Awaited<
          ReturnType<typeof prisma.appointment.create>
        >
      | null = null;

    /*
     * Una transacción serializable impide que dos pacientes
     * reserven simultáneamente el mismo horario.
     *
     * Si PostgreSQL detecta un conflicto, Prisma devuelve P2034.
     * Se reintenta hasta tres veces.
     */
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        appointment = await prisma.$transaction(
          async (transaction) => {
            const existingAppointment =
              await transaction.appointment.findFirst({
                where: {
                  doctorId: doctor.id,
                  branchId: patient.branchId,
                  date: appointmentDate,
                  status: {
                    not: "CANCELED",
                  },
                },
                select: {
                  id: true,
                },
              });

            if (existingAppointment) {
              throw new Error(
                "APPOINTMENT_TIME_NOT_AVAILABLE"
              );
            }

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
          },
          {
            isolationLevel:
              Prisma.TransactionIsolationLevel.Serializable,
          }
        );

        break;
      } catch (error) {
        if (
          error instanceof Error &&
          error.message ===
            "APPOINTMENT_TIME_NOT_AVAILABLE"
        ) {
          return NextResponse.json(
            {
              error:
                "Ese horario acaba de ser reservado. Elegí otro.",
            },
            {
              status: 409,
            }
          );
        }

        if (isTransactionConflict(error) && attempt < 3) {
          continue;
        }

        if (isTransactionConflict(error)) {
          return NextResponse.json(
            {
              error:
                "Ese horario acaba de ser reservado. Elegí otro.",
            },
            {
              status: 409,
            }
          );
        }

        throw error;
      }
    }

    if (!appointment) {
      return NextResponse.json(
        {
          error:
            "No se pudo confirmar la disponibilidad del horario.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * El correo se envía después de confirmar el turno.
     * Si Resend falla, el turno se conserva.
     */
    try {
      if (doctor.user?.email) {
        const doctorName =
          doctor.name ||
          doctor.user.name ||
          "Odontólogo";

        await resend.emails.send({
          from:
            process.env.RESEND_FROM_EMAIL ||
            "Consultorios Nazaret <notificaciones@consultoriosnazaret.com>",

          to: doctor.user.email,

          subject: "Nueva solicitud de turno",

          html: `
          <div style="margin:0;padding:32px;background:#F5F3EE;font-family:Arial,sans-serif;">
            <table align="center" cellpadding="0" cellspacing="0" width="600"
              style="background:#FFFFFF;border:1px solid #DED9CD;border-radius:10px;overflow:hidden;">

              <tr>
                <td style="background:#A7B58A;padding:28px;text-align:center;">
                  <h1 style="margin:0;color:#FFFFFF;font-size:34px;font-weight:700;">
                    Consultorios Nazaret
                  </h1>
                </td>
              </tr>

              <tr>
                <td style="padding:36px;">

                  <h2 style="margin:0 0 22px;color:#2F3F3A;font-size:30px;">
                    Nueva solicitud de turno
                  </h2>

                  <p style="margin:0 0 18px;font-size:17px;color:#4F5A55;">
                    Hola, <strong>${doctorName}</strong>.
                  </p>

                  <p style="margin:0 0 28px;font-size:16px;color:#4F5A55;line-height:1.7;">
                    El paciente <strong>${patientName}</strong> solicitó un nuevo turno.
                    Podés revisar la solicitud desde tu portal de especialista.
                  </p>

                  <table cellpadding="0" cellspacing="0" width="100%"
                    style="background:#F2F5EF;border:1px solid #D5DDCF;border-radius:8px;">

                    <tr>
                      <td style="padding:24px;">

                        <h3 style="
                          margin:0 0 18px;
                          color:#8A9A6F;
                          font-size:15px;
                          letter-spacing:3px;
                          text-transform:uppercase;
                        ">
                          Datos del turno
                        </h3>

                        <p style="margin:10px 0;font-size:16px;color:#2F3F3A;">
                          <strong>📅 Fecha:</strong> ${formattedDate}
                        </p>

                        <p style="margin:10px 0;font-size:16px;color:#2F3F3A;">
                          <strong>🕒 Horario:</strong> ${formattedTime} hs
                        </p>

                        <p style="margin:10px 0;font-size:16px;color:#2F3F3A;">
                          <strong>📍 Sucursal:</strong> ${patient.branch.name}
                        </p>

                        <p style="margin:10px 0;font-size:16px;color:#2F3F3A;">
                          <strong>🦷 Tratamiento:</strong> ${treatment}
                        </p>

                      </td>
                    </tr>

                  </table>

                  <div style="text-align:center;margin-top:34px;">
                    <a
                      href="${process.env.NEXTAUTH_URL}/dashboard/doctor/notificaciones"
                      style="
                        display:inline-block;
                        padding:14px 30px;
                        background:#A7B58A;
                        color:#FFFFFF;
                        text-decoration:none;
                        border-radius:8px;
                        font-size:16px;
                        font-weight:600;
                      "
                    >
                      Ver solicitud
                    </a>
                  </div>

                  <p style="margin-top:38px;color:#7B847D;font-size:14px;line-height:1.6;">
                    Este correo fue enviado automáticamente por
                    <strong>Consultorios Nazaret</strong>.
                  </p>

                </td>
              </tr>

            </table>
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
    console.error("Error al solicitar el turno:", error);

    return NextResponse.json(
      {
        error: "No se pudo solicitar el turno.",
      },
      {
        status: 500,
      }
    );
  }
}