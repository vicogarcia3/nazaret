import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Stethoscope,
  UserRound,
} from "lucide-react";

import DeleteClinicalReferralButton from "@/components/clinical-history/DeleteClinicalReferralButton";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function getReferralStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "OPENED":
      return "Abierta";
    case "COMPLETED":
      return "Completada";
    case "EXPIRED":
      return "Vencida";
    case "REVOKED":
      return "Revocada";
    default:
      return status;
  }
}

function getReferralStatusClasses(status: string) {
  switch (status) {
    case "COMPLETED":
      return "bg-green-100 text-green-700";
    case "PENDING":
      return "bg-yellow-100 text-yellow-700";
    case "OPENED":
      return "bg-blue-100 text-blue-700";
    case "EXPIRED":
      return "bg-red-100 text-red-700";
    case "REVOKED":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function formatDate(date: Date | null) {
  if (!date) return null;

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(date: Date | null) {
  if (!date) return null;

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Cordoba",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export default async function HistorialDerivacionesPage({
  params,
}: Props) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      clinicalReferrals: {
        include: {
          specialist: {
            include: {
              user: true,
            },
          },
          referredBy: {
            include: {
              user: true,
            },
          },
          entry: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!patient) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <Link
        href={`/dashboard/admin/mi-panel/pacientes/${patient.id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#A2B38B] transition hover:text-[#8FA178]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al paciente
      </Link>

      <header className="border border-[#DED9CD] bg-white p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A2B38B]">
          Historia clínica
        </p>

        <h1 className="mt-2 font-serif text-3xl text-[#263F3B]">
          Historial de derivaciones
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#6B7774]">
          Derivaciones realizadas para{" "}
          <span className="font-medium text-[#263F3B]">
            {patient.firstName} {patient.lastName}
          </span>
          .
        </p>
      </header>

      {patient.clinicalReferrals.length === 0 ? (
        <div className="border border-[#DED9CD] bg-white p-10 text-center">
          <Stethoscope className="mx-auto h-8 w-8 text-[#A2B38B]" />

          <h2 className="mt-4 font-semibold text-[#263F3B]">
            No hay derivaciones registradas
          </h2>

          <p className="mt-2 text-sm text-[#6B7774]">
            Las futuras derivaciones aparecerán en este historial.
          </p>
        </div>
      ) : (
        <section className="relative space-y-8 pl-7 md:pl-10">
          <div className="absolute bottom-0 left-[11px] top-0 w-px bg-[#D8D2C4] md:left-[15px]" />

          {patient.clinicalReferrals.map((referral) => {
            const specialistName =
              referral.specialist.user?.name ??
              referral.specialist.name;

            const referredByName =
              referral.referredBy.user?.name ??
              referral.referredBy.name;

            return (
              <article
                key={referral.id}
                className="relative border border-[#DED9CD] bg-white p-6 md:p-7"
              >
                <span className="absolute -left-[23px] top-7 flex h-5 w-5 items-center justify-center rounded-full border-4 border-[#F7F5EF] bg-[#6F855F] md:-left-[33px] md:h-7 md:w-7">
                  <span className="h-2 w-2 rounded-full bg-white" />
                </span>

                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F0F2EA] text-[#6F855F]">
                        <UserRound className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-[#263F3B]">
                          {specialistName}
                        </h2>

                        <p className="mt-1 text-sm text-[#6B7774]">
                          {referral.specialist.specialty ||
                            "Especialidad no informada"}
                        </p>
                      </div>
                    </div>

                    <details className="group mt-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 border-t border-[#E5E1D8] pt-4">
                        <p className="text-sm text-[#6B7774]">
                          Derivado por{" "}
                          <span className="font-medium text-[#263F3B]">
                            {referredByName}
                          </span>
                        </p>

                        <span className="inline-flex shrink-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6F855F]">
                          Ver detalles
                          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
                        </span>
                      </summary>

                      <div className="mt-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <InfoBlock
                            label="Motivo"
                            value={
                              referral.reason ||
                              "Sin motivo indicado"
                            }
                          />

                          <InfoBlock
                            label="Indicaciones iniciales"
                            value={
                              referral.instructions ||
                              "Sin indicaciones adicionales"
                            }
                          />
                        </div>

                        {referral.entry && (
                          <div className="mt-7 border border-[#E1DED5] bg-[#FAF9F5] p-5">
                            <div className="mb-5 flex items-center gap-3">
                              <FileText className="h-5 w-5 text-[#6F855F]" />

                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
                                  Intervención
                                </p>

                                <h3 className="mt-1 font-semibold text-[#263F3B]">
                                  Registro agregado por el especialista
                                </h3>
                              </div>
                            </div>

                            <div className="grid gap-5">
                              {referral.entry.diagnosis && (
                                <EntryField
                                  label="Diagnóstico"
                                  value={referral.entry.diagnosis}
                                />
                              )}

                              {referral.entry.treatment && (
                                <EntryField
                                  label="Tratamiento realizado"
                                  value={referral.entry.treatment}
                                />
                              )}

                              {referral.entry.evolution && (
                                <EntryField
                                  label="Evolución"
                                  value={referral.entry.evolution}
                                />
                              )}

                              {referral.entry.indications && (
                                <EntryField
                                  label="Indicaciones"
                                  value={referral.entry.indications}
                                />
                              )}

                              {referral.entry.notes && (
                                <EntryField
                                  label="Observaciones"
                                  value={referral.entry.notes}
                                />
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-7 grid gap-3 border-t border-[#E5E1D8] pt-5 text-xs text-[#6B7774] sm:grid-cols-2 xl:grid-cols-4">
                          <DateItem
                            icon={<CalendarDays className="h-4 w-4" />}
                            label="Creada"
                            value={
                              formatDateTime(referral.createdAt) ?? "-"
                            }
                          />

                          <DateItem
                            icon={<Clock3 className="h-4 w-4" />}
                            label="Abierta"
                            value={
                              formatDateTime(referral.openedAt) ??
                              "Todavía no fue abierta"
                            }
                          />

                          <DateItem
                            icon={<CheckCircle2 className="h-4 w-4" />}
                            label="Completada"
                            value={
                              formatDateTime(referral.completedAt) ??
                              "Todavía no finalizada"
                            }
                          />

                          <DateItem
                            icon={<CalendarDays className="h-4 w-4" />}
                            label="Vencimiento"
                            value={
                              formatDate(referral.expiresAt) ?? "-"
                            }
                          />
                        </div>
                      </div>
                    </details>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${getReferralStatusClasses(
                        referral.status
                      )}`}
                    >
                      {getReferralStatusLabel(referral.status)}
                    </span>

                    <DeleteClinicalReferralButton
                      referralId={referral.id}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-[#E1DED5] bg-[#FAF9F5] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A2B38B]">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#263F3B]">
        {value}
      </p>
    </div>
  );
}

function EntryField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A2B38B]">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#263F3B]">
        {value}
      </p>
    </div>
  );
}

function DateItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-[#7B916A]">
        {icon}
      </span>

      <div>
        <p className="font-semibold text-[#263F3B]">
          {label}
        </p>

        <p className="mt-1">{value}</p>
      </div>
    </div>
  );
}