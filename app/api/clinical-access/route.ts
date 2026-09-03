import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

type DoctorAccessConfigInput = {
  doctorId?: string;
  shareAll?: boolean;
  patientIds?: string[];
};

type UpdateClinicalAccessBody = {
  doctors?: DoctorAccessConfigInput[];
};

type NormalizedDoctorConfig = {
  doctorId: string;
  shareAll: boolean;
  patientIds: string[];
};

function normalizeDoctorConfigs(
  value: unknown
): NormalizedDoctorConfig[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const result: NormalizedDoctorConfig[] = [];

  for (const item of value) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as DoctorAccessConfigInput)
        .doctorId !== "string"
    ) {
      continue;
    }

    const doctorId = (
      item as DoctorAccessConfigInput
    ).doctorId!.trim();

    if (!doctorId || seen.has(doctorId)) {
      continue;
    }

    seen.add(doctorId);

    const shareAll =
      (item as DoctorAccessConfigInput).shareAll !==
      false;

    const rawPatientIds = (
      item as DoctorAccessConfigInput
    ).patientIds;

    const patientIds = Array.isArray(rawPatientIds)
      ? Array.from(
          new Set(
            rawPatientIds
              .filter(
                (
                  patientId
                ): patientId is string =>
                  typeof patientId === "string"
              )
              .map((patientId) => patientId.trim())
              .filter(Boolean)
          )
        )
      : [];

    result.push({
      doctorId,
      shareAll,
      patientIds,
    });
  }

  return result;
}

function getClinicalAccessUrl() {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";

  if (!baseUrl) {
    return "/acceso-clinico";
  }

  return `${baseUrl.replace(
    /\/$/,
    ""
  )}/acceso-clinico`;
}

export async function GET() {
  try {
    const session = await auth();

    if (
      !session?.user?.id ||
      session.user.role !== "ADMIN"
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

    const accesses =
      await prisma.clinicalAccess.findMany({
        where: {
          active: true,
        },

        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              email: true,
              specialty: true,
              professionalLicense: true,
              active: true,
            },
          },

          sharedPatients: {
            select: {
              patientId: true,
            },
          },
        },

        orderBy: {
          grantedAt: "desc",
        },
      });

    return NextResponse.json(accesses);
  } catch (error) {
    console.error(
      "Error obteniendo accesos clínicos:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron obtener los accesos clínicos.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (
      !session?.user?.id ||
      session.user.role !== "ADMIN"
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

    const body =
      (await request.json()) as UpdateClinicalAccessBody;

    const doctorConfigs = normalizeDoctorConfigs(
      body.doctors
    );

    const doctorIds = doctorConfigs.map(
      (config) => config.doctorId
    );

    /*
     * Buscamos primero cuáles accesos
     * estaban activos antes del cambio.
     */
    const previouslyActiveAccesses =
      await prisma.clinicalAccess.findMany({
        where: {
          active: true,
        },
        select: {
          doctorId: true,
        },
      });

    const previouslyActiveDoctorIds = new Set(
      previouslyActiveAccesses.map(
        (access) => access.doctorId
      )
    );

    /*
     * Validamos especialistas seleccionados.
     */
    let validDoctors:
      | {
          id: string;
          name: string;
          email: string | null;
          userId: string | null;
        }[] = [];

    if (doctorIds.length > 0) {
      validDoctors = await prisma.doctor.findMany({
        where: {
          id: {
            in: doctorIds,
          },
          active: true,
          email: {
            not: null,
          },
        },

        select: {
          id: true,
          name: true,
          email: true,
          userId: true,
        },
      });

      if (
        validDoctors.length !== doctorIds.length
      ) {
        return NextResponse.json(
          {
            error:
              "Uno o más especialistas seleccionados no existen, están inactivos o no tienen email cargado.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * Validamos que los pacientes puntuales
     * seleccionados (para doctores sin
     * "compartir todas") realmente existan.
     */
    const allSelectedPatientIds = Array.from(
      new Set(
        doctorConfigs
          .filter((config) => !config.shareAll)
          .flatMap((config) => config.patientIds)
      )
    );

    if (allSelectedPatientIds.length > 0) {
      const existingPatients =
        await prisma.patient.findMany({
          where: {
            id: {
              in: allSelectedPatientIds,
            },
          },
          select: {
            id: true,
          },
        });

      if (
        existingPatients.length !==
        allSelectedPatientIds.length
      ) {
        return NextResponse.json(
          {
            error:
              "Uno o más pacientes seleccionados no existen.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * Actualizamos accesos.
     */
    await prisma.$transaction(async (transaction) => {
      await transaction.clinicalAccess.updateMany({
        where: {
          active: true,
        },

        data: {
          active: false,
        },
      });

      for (const config of doctorConfigs) {
        await transaction.clinicalAccess.upsert({
          where: {
            doctorId: config.doctorId,
          },

          create: {
            doctorId: config.doctorId,
            active: true,
            shareAll: config.shareAll,
          },

          update: {
            active: true,
            shareAll: config.shareAll,
          },
        });

        /*
         * Solo tocamos la lista de pacientes
         * puntuales cuando el doctor NO tiene
         * "compartir todas". Si vuelve a
         * "compartir todas", dejamos la lista
         * guardada por si la restringen de nuevo
         * más adelante.
         */
        if (!config.shareAll) {
          await transaction.clinicalAccessPatient.deleteMany(
            {
              where: {
                doctorId: config.doctorId,
              },
            }
          );

          if (config.patientIds.length > 0) {
            await transaction.clinicalAccessPatient.createMany(
              {
                data: config.patientIds.map(
                  (patientId) => ({
                    doctorId: config.doctorId,
                    patientId,
                  })
                ),
              }
            );
          }
        }
      }
    });

    /*
     * Detectamos quiénes recibieron acceso
     * por primera vez o estaban desactivados
     * y ahora quedaron activos.
     */
    const newlyGrantedDoctors = validDoctors.filter(
      (doctor) =>
        !previouslyActiveDoctorIds.has(doctor.id)
    );

    /*
     * Notificamos dentro del portal a los
     * especialistas que tienen una cuenta web
     * y acaban de recibir acceso.
     */
    const adminName =
      session.user.name?.trim() ||
      "La administradora";

    const doctorsWithPortal =
      newlyGrantedDoctors.filter((doctor) =>
        Boolean(doctor.userId)
      );

    if (doctorsWithPortal.length > 0) {
      await prisma.notification.createMany({
        data: doctorsWithPortal.map((doctor) => ({
          doctorId: doctor.id,
          title:
            "Historias clínicas compartidas",
          message: `${adminName} compartió historias clínicas. Más detalles en "Historias clínicas".`,
          type: "CLINICAL_HISTORY",
          actor: "ADMIN",
          read: false,
          actionUrl: "/acceso-clinico",
        })),
      });
    }

    const clinicalAccessUrl =
      getClinicalAccessUrl();

    const consultorioName = "Consultorios Nazaret";
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}`;

    /*
     * Enviamos aviso solamente a los
     * especialistas recién habilitados.
     */
    for (const doctor of newlyGrantedDoctors) {
      if (!doctor.email) {
        continue;
      }

      const hasPortalUser = Boolean(doctor.userId);

      const html = hasPortalUser
        ? `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #263F3B;">
            <p style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #A2B38B; margin-bottom: 12px;">
              ${consultorioName}
            </p>
            <h1 style="font-size: 26px; margin: 0 0 16px;">
              Historias clínicas compartidas
            </h1>
            <p style="font-size: 15px; line-height: 1.6; color: #5F6F6B;">
              ${consultorioName} compartió historias clínicas contigo. Consultá más detalles en tu portal.
            </p>
            <p style="font-size: 15px; line-height: 1.6; color: #5F6F6B;">
              <a href="${portalUrl}" style="color: #263F3B; font-weight: 600;">
                ${portalUrl}
              </a>
            </p>
          </div>
        `
        : `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #263F3B;">
            <p style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #A2B38B; margin-bottom: 12px;">
              ${consultorioName}
            </p>
            <h1 style="font-size: 26px; margin: 0 0 16px;">
              Historias clínicas compartidas
            </h1>
            <p style="font-size: 15px; line-height: 1.6; color: #5F6F6B;">
              ${consultorioName} compartió historias clínicas contigo. Podés consultarlas en el siguiente enlace:
            </p>
            <div style="margin: 28px 0; text-align: center;">
              <a
                href="${clinicalAccessUrl}"
                style="display: inline-block; background: #263F3B; color: white; text-decoration: none; padding: 14px 24px; font-size: 14px; font-weight: 600;"
              >
                Acceder a Historias Clínicas
              </a>
            </div>
          </div>
        `;

      try {
        const sendResult = await resend.emails.send({
          from:
            process.env.EMAIL_FROM ||
            "Consultorios Nazaret <onboarding@resend.dev>",

          to: doctor.email,

          subject: "Historias clínicas compartidas",

          html,
        });

        if (sendResult?.error) {
          console.error(
            `Resend devolvió error para ${doctor.email}:`,
            sendResult.error
          );
        }
      } catch (emailError) {
        console.error(
          `Error enviando email de acceso clínico a ${doctor.email}:`,
          emailError
        );
      }
    }

    const updatedAccesses =
      await prisma.clinicalAccess.findMany({
        where: {
          active: true,
        },

        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              email: true,
              specialty: true,
              professionalLicense: true,
            },
          },

          sharedPatients: {
            select: {
              patientId: true,
            },
          },
        },

        orderBy: {
          doctor: {
            name: "asc",
          },
        },
      });

    return NextResponse.json({
      success: true,
      accesses: updatedAccesses,
      newlyGrantedCount: newlyGrantedDoctors.length,
      message:
        "Accesos a historias clínicas actualizados correctamente.",
    });
  } catch (error) {
    console.error(
      "Error actualizando accesos clínicos:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudieron actualizar los accesos clínicos.",
      },
      {
        status: 500,
      }
    );
  }
}