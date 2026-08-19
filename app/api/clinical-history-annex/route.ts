import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClinicalExternalSession } from "@/lib/clinical-external-auth";

function optionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();

  return text || null;
}

function optionalDecimal(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const normalized = String(value)
    .trim()
    .replace(",", ".");

  if (!normalized) {
    return null;
  }

  const number = Number(normalized);

  if (!Number.isFinite(number)) {
    return undefined;
  }

  return normalized;
}

function optionalDate(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

export async function POST(request: Request) {
  try {
    /*
     * Puede ingresar:
     * - ADMIN desde el panel
     * - Especialista mediante acceso clínico externo
     */
    const session = await auth();

    const clinicalSession =
      await getClinicalExternalSession();

    const isAdmin =
      session?.user?.role === "ADMIN";

    if (!isAdmin && !clinicalSession) {
      return NextResponse.json(
        {
          error: "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const clinicalHistoryId =
      typeof body.clinicalHistoryId === "string"
        ? body.clinicalHistoryId.trim()
        : "";

    if (!clinicalHistoryId) {
      return NextResponse.json(
        {
          error:
            "No se indicó la historia clínica.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ID del especialista que crea el registro.
     *
     * Si lo crea ADMIN queda null.
     * Si lo crea un especialista externo,
     * guardamos su doctorId.
     */
    let createdByDoctorId: string | null =
      null;

    /*
     * =====================================================
     * ADMIN
     * =====================================================
     */

    if (isAdmin) {
      const clinicalHistory =
        await prisma.clinicalHistory.findUnique({
          where: {
            id: clinicalHistoryId,
          },

          select: {
            id: true,
          },
        });

      if (!clinicalHistory) {
        return NextResponse.json(
          {
            error:
              "La historia clínica no existe.",
          },
          {
            status: 404,
          }
        );
      }
    }

    /*
     * =====================================================
     * ESPECIALISTA EXTERNO
     * =====================================================
     */

    else {
      /*
       * Acá sabemos que clinicalSession existe,
       * porque arriba ya validamos:
       *
       * if (!isAdmin && !clinicalSession)
       */
      const doctorId =
        clinicalSession!.doctor.id;

      const doctor =
        await prisma.doctor.findUnique({
          where: {
            id: doctorId,
          },

          select: {
            branches: {
              select: {
                branchId: true,
              },
            },
          },
        });

      if (!doctor) {
        return NextResponse.json(
          {
            error:
              "No se encontró el especialista.",
          },
          {
            status: 404,
          }
        );
      }

      const branchIds =
        doctor.branches.map(
          (branch) => branch.branchId
        );

      /*
       * La historia clínica debe pertenecer
       * a un paciente de una sucursal a la
       * que tenga acceso el especialista.
       */
      const clinicalHistory =
        await prisma.clinicalHistory.findFirst({
          where: {
            id: clinicalHistoryId,

            patient: {
              branchId: {
                in: branchIds,
              },
            },
          },

          select: {
            id: true,
          },
        });

      if (!clinicalHistory) {
        return NextResponse.json(
          {
            error:
              "No tenés acceso a esta historia clínica.",
          },
          {
            status: 403,
          }
        );
      }

      createdByDoctorId = doctorId;
    }

    /*
     * =====================================================
     * DATOS DE LA PRESTACIÓN
     * =====================================================
     */

    const professionalName =
      typeof body.professionalName === "string"
        ? body.professionalName.trim()
        : "";

    const treatment =
      typeof body.treatment === "string"
        ? body.treatment.trim()
        : "";

    if (!professionalName) {
      return NextResponse.json(
        {
          error:
            "Ingresá el profesional actuante.",
        },
        {
          status: 400,
        }
      );
    }

    if (!treatment) {
      return NextResponse.json(
        {
          error:
            "Ingresá el tratamiento realizado.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * DEBE / HABER / SALDO
     * =====================================================
     */

    const debit =
      optionalDecimal(body.debit);

    const credit =
      optionalDecimal(body.credit);

    const balance =
      optionalDecimal(body.balance);

    if (
      debit === undefined ||
      credit === undefined ||
      balance === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Debe, Haber y Saldo deben contener valores numéricos.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * PRÓXIMO TURNO
     * =====================================================
     */

    const nextAppointment =
      optionalDate(body.nextAppointment);

    if (nextAppointment === undefined) {
      return NextResponse.json(
        {
          error:
            "La fecha del próximo turno no es válida.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * FECHA Y HORA REAL DE LA PRESTACIÓN
     * =====================================================
     */

    const performedAt =
      optionalDate(body.performedAt);

    if (performedAt === undefined) {
      return NextResponse.json(
        {
          error:
            "La fecha y hora de la prestación no es válida.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * =====================================================
     * CREAR REGISTRO
     * =====================================================
     */

    const entry =
      await prisma.clinicalHistoryAnnexEntry.create({
        data: {
          clinicalHistoryId,

          createdByDoctorId,

          professionalName,

          treatment,

          indications:
            optionalText(body.indications),

          debit,
          credit,
          balance,

          /*
           * Si no se envía una fecha manual,
           * usamos el momento actual.
           */
          performedAt:
            performedAt ?? new Date(),

          nextAppointment,

          patientSignature:
            optionalText(
              body.patientSignature
            ),
        },
      });

    return NextResponse.json(
      {
        success: true,
        entry,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Error creando entrada del anexo:",
      error
    );

    return NextResponse.json(
      {
        error:
          "No se pudo guardar la entrada del anexo.",
      },
      {
        status: 500,
      }
    );
  }
}