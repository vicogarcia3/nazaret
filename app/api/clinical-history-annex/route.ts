import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getClinicalExternalSession,
  canExternalDoctorAccessPatient,
} from "@/lib/clinical-external-auth";

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
    const session = await auth();

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

    const clinicalHistory =
      await prisma.clinicalHistory.findUnique({
        where: {
          id: clinicalHistoryId,
        },
        select: {
          id: true,
          patientId: true,
          data: true,
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

    /*
     * ID del especialista que crea el registro.
     * Si lo crea ADMIN queda null.
     */
    let createdByDoctorId: string | null = null;
    let authorized = false;

    /*
     * =====================================================
     * ADMIN
     * =====================================================
     */
    if (
      session?.user?.id &&
      session.user.role === "ADMIN"
    ) {
      authorized = true;
    }

    /*
     * =====================================================
     * DOCTOR INTERNO (panel propio, NextAuth)
     * =====================================================
     */
    if (
      !authorized &&
      session?.user?.id &&
      session.user.role === "DOCTOR"
    ) {
      const doctor = await prisma.doctor.findUnique({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
          name: true,
        },
      });

      if (doctor) {
        const historyData =
          clinicalHistory.data &&
          typeof clinicalHistory.data === "object" &&
          !Array.isArray(clinicalHistory.data)
            ? (clinicalHistory.data as Record<
                string,
                unknown
              >)
            : {};

        if (historyData.odontologo === doctor.name) {
          authorized = true;
          createdByDoctorId = doctor.id;
        }
      }
    }

    /*
     * =====================================================
     * ESPECIALISTA EXTERNO (cookie /acceso-clinico)
     * Solo se prueba si ninguno de los caminos
     * anteriores dio acceso (puede haber, en el
     * mismo navegador, sesión de NextAuth Y sesión
     * externa al mismo tiempo).
     * =====================================================
     */
    if (!authorized) {
      const clinicalSession =
        await getClinicalExternalSession();

      if (clinicalSession) {
        const hasAccess =
          await canExternalDoctorAccessPatient(
            clinicalSession.doctor.id,
            clinicalSession.clinicalAccess,
            clinicalHistory.patientId
          );

        if (hasAccess) {
          authorized = true;
          createdByDoctorId =
            clinicalSession.doctor.id;
        }
      }
    }

    if (!authorized) {
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