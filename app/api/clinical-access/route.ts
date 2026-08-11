import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

type UpdateClinicalAccessBody = {
  doctorIds?: string[];
};

function normalizeDoctorIds(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter(
          (
            doctorId
          ): doctorId is string =>
            typeof doctorId ===
            "string"
        )
        .map((doctorId) =>
          doctorId.trim()
        )
        .filter(Boolean)
    )
  );
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
      await prisma.clinicalAccess.findMany(
        {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                email: true,
                specialty: true,
                professionalLicense:
                  true,
                active: true,
              },
            },
          },

          orderBy: {
            grantedAt: "desc",
          },
        }
      );

    return NextResponse.json(
      accesses
    );
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

export async function PUT(
  request: Request
) {
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

    const doctorIds =
      normalizeDoctorIds(
        body.doctorIds
      );

    /*
     * Buscamos primero cuáles accesos
     * estaban activos antes del cambio.
     */
    const previouslyActiveAccesses =
      await prisma.clinicalAccess.findMany(
        {
          where: {
            active: true,
          },
          select: {
            doctorId: true,
          },
        }
      );

    const previouslyActiveDoctorIds =
      new Set(
        previouslyActiveAccesses.map(
          (access) =>
            access.doctorId
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
        }[]
      = [];

    if (doctorIds.length > 0) {
      validDoctors =
        await prisma.doctor.findMany(
          {
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
          }
        );

      if (
        validDoctors.length !==
        doctorIds.length
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
     * Actualizamos accesos.
     */
    await prisma.$transaction(
      async (transaction) => {
        await transaction.clinicalAccess.updateMany(
          {
            where: {
              active: true,
            },

            data: {
              active: false,
            },
          }
        );

        for (const doctorId of doctorIds) {
          await transaction.clinicalAccess.upsert(
            {
              where: {
                doctorId,
              },

              create: {
                doctorId,
                active: true,
              },

              update: {
                active: true,
              },
            }
          );
        }
      }
    );

    /*
     * Detectamos quiénes recibieron acceso
     * por primera vez o estaban desactivados
     * y ahora quedaron activos.
     */
    const newlyGrantedDoctors =
      validDoctors.filter(
        (doctor) =>
          !previouslyActiveDoctorIds.has(
            doctor.id
          )
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
        newlyGrantedDoctors.filter(
          (doctor) => Boolean(doctor.userId)
        );

      if (doctorsWithPortal.length > 0) {
        await prisma.notification.createMany({
          data: doctorsWithPortal.map(
            (doctor) => ({
              doctorId: doctor.id,
              title:
                "Historias clínicas compartidas",
              message: `${adminName} compartió historias clínicas. Más detalles en "Historias clínicas".`,
              type: "CLINICAL_HISTORY",
              actor: "ADMIN",
              read: false,
              actionUrl: "/acceso-clinico",
            })
          ),
        });
      }

    const clinicalAccessUrl =
      getClinicalAccessUrl();

    /*
     * Enviamos aviso solamente a los
     * especialistas recién habilitados.
     */
    for (const doctor of newlyGrantedDoctors) {
      if (!doctor.email) {
        continue;
      }

      try {
        await resend.emails.send({
          from:
            process.env
              .RESEND_FROM_EMAIL ||
            "Consultorios Nazaret <onboarding@resend.dev>",

          to: doctor.email,

          subject:
            "Acceso habilitado a Historias Clínicas",

          html: `
            <div style="
              font-family: Arial, sans-serif;
              max-width: 560px;
              margin: 0 auto;
              padding: 32px;
              color: #263F3B;
            ">
              <p style="
                font-size: 12px;
                letter-spacing: 2px;
                text-transform: uppercase;
                color: #A2B38B;
                margin-bottom: 12px;
              ">
                Consultorios Nazaret
              </p>

              <h1 style="
                font-size: 26px;
                margin: 0 0 16px;
              ">
                Acceso a Historias Clínicas
              </h1>

              <p style="
                font-size: 15px;
                line-height: 1.6;
                color: #5F6F6B;
              ">
                Hola ${doctor.name}.
              </p>

              <p style="
                font-size: 15px;
                line-height: 1.6;
                color: #5F6F6B;
              ">
                Se habilitó tu acceso a las historias clínicas del consultorio.
              </p>

              <p style="
                font-size: 15px;
                line-height: 1.6;
                color: #5F6F6B;
              ">
                Para ingresar, accedé al siguiente enlace e ingresá tu correo electrónico. Vas a recibir un código de 6 dígitos para validar tu identidad.
              </p>

              <div style="
                margin: 28px 0;
                text-align: center;
              ">
                <a
                  href="${clinicalAccessUrl}"
                  style="
                    display: inline-block;
                    background: #263F3B;
                    color: white;
                    text-decoration: none;
                    padding: 14px 24px;
                    font-size: 14px;
                    font-weight: 600;
                  "
                >
                  Acceder a Historias Clínicas
                </a>
              </div>

              <p style="
                font-size: 13px;
                line-height: 1.6;
                color: #8A918F;
              ">
                Si no reconocés esta habilitación, comunicate con el consultorio.
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error(
          `Error enviando email de acceso clínico a ${doctor.email}:`,
          emailError
        );
      }
    }

    const updatedAccesses =
      await prisma.clinicalAccess.findMany(
        {
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
                professionalLicense:
                  true,
              },
            },
          },

          orderBy: {
            doctor: {
              name: "asc",
            },
          },
        }
      );

    return NextResponse.json({
      success: true,
      accesses: updatedAccesses,
      newlyGrantedCount:
        newlyGrantedDoctors.length,
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