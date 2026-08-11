import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BudgetActions from "./BudgetActions";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function formatWhatsAppPhone(value: string) {
  let phone = value.replace(/\D/g, "");

  if (!phone) {
    return "";
  }

  if (phone.startsWith("0")) {
    phone = phone.slice(1);
  }

  if (phone.startsWith("549")) {
    return phone;
  }

  if (phone.startsWith("54")) {
    return `549${phone.slice(2)}`;
  }

  return `549${phone}`;
}

export default async function PresupuestoDetallePage({
  params,
}: Props) {
  const { id } = await params;

  const budget = await prisma.budget.findUnique({
    where: {
      id,
    },

    include: {
      patient: {
        include: {
          user: true,
          plan: true,
          branch: true,
        },
      },

      doctors: {
        include: {
          doctor: {
            include: {
              user: true,
            },
          },
        },
      },

      items: {
        orderBy: {
          id: "asc",
        },
      },
    },
  });

  if (!budget) {
    notFound();
  }

  const subtotal = Number(budget.subtotal);
  const discount = Number(budget.discount);
  const total = Number(budget.total);

  const patientName =
    `${budget.patient.lastName}, ${budget.patient.firstName}`;

  const whatsappMessage = `Hola ${
    budget.patient.firstName
  }, te enviamos tu presupuesto odontológico por un total de ${formatCurrency(
    total
  )}.`;

  const phone = formatWhatsAppPhone(
    budget.patient.phone || ""
  );

  const whatsappUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(
        whatsappMessage
      )}`
    : "";

  const statusLabel =
    budget.status === "COMPLETED"
      ? "Completado"
      : budget.status === "IN_PROGRESS"
      ? "En curso"
      : "Pendiente";

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          #budget-print,
          #budget-print * {
            visibility: visible !important;
          }

          #budget-print {
            position: absolute !important;
            inset: 0 auto auto 0 !important;

            width: 194mm !important;
            height: 281mm !important;

            margin: 0 !important;
            padding: 8mm !important;

            border: none !important;
            background: white !important;

            box-sizing: border-box !important;

            display: flex !important;
            flex-direction: column !important;

            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #budget-signatures {
            margin-top: auto !important;
            padding-bottom: 2mm !important;
          }

          .print-hidden {
            display: none !important;
          }

          #budget-print table {
            width: 100% !important;
          }

          #budget-print table,
          #budget-print tr,
          #budget-print .avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-[#F7F5EF] px-6 py-8 text-[#263F3B]">
        <div className="mx-auto max-w-5xl">
          {/* BOTONES */}

          <div className="print-hidden mb-6">
            <BudgetActions
              whatsappUrl={whatsappUrl}
            />
          </div>

          {/* PRESUPUESTO */}

          <section
            id="budget-print"
            className="border border-[#DED9CD] bg-white px-9 py-8"
          >
            {/* HEADER */}

            <header className="flex items-start justify-between gap-8 border-b border-[#DED9CD] pb-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#82956F]">
                  Consultorios Nazaret
                </p>

                <h1 className="mt-3 font-serif text-4xl font-medium leading-none text-[#263F3B]">
                  Presupuesto
                </h1>

                <p className="mt-3 text-xs text-[#6B7774]">
                  Presupuesto #{budget.id}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs font-semibold text-[#263F3B]">
                  Fecha
                </p>

                <p className="mt-1 text-sm text-[#6B7774]">
                  {formatDate(budget.createdAt)}
                </p>

                <span className="mt-3 inline-flex bg-[#EEF2E9] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#5F7653]">
                  {statusLabel}
                </span>
              </div>
            </header>

            {/* PACIENTE + PROFESIONALES */}

            <section className="mt-7 grid grid-cols-2 gap-10">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#82956F]">
                  Paciente
                </p>

                <h2 className="mt-2 text-lg font-semibold text-[#263F3B]">
                  {patientName}
                </h2>

                <div className="mt-3 space-y-1 text-[12px] leading-5 text-[#5F6F6B]">
                  {budget.patient.dni && (
                    <p>
                      DNI: {budget.patient.dni}
                    </p>
                  )}

                  {budget.patient.phone && (
                    <p>
                      Teléfono: {budget.patient.phone}
                    </p>
                  )}

                  {budget.patient.branch && (
                    <p>
                      Sucursal:{" "}
                      {budget.patient.branch.name}
                      {budget.patient.branch.city
                        ? ` — ${budget.patient.branch.city}`
                        : ""}
                    </p>
                  )}

                  <p>
                    Plan:{" "}
                    {budget.patient.plan?.name ||
                      "Sin plan"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#82956F]">
                  Especialista/s
                </p>

                {budget.doctors.length > 0 ? (
                  <div className="mt-2 space-y-3">
                    {budget.doctors.map(
                      ({ doctor }) => {
                        const doctorName =
                          doctor.name ||
                          doctor.user?.name ||
                          "Especialista";

                        return (
                          <div key={doctor.id}>
                            <p className="text-[13px] font-medium text-[#263F3B]">
                              {doctorName}
                            </p>

                            {doctor.specialty && (
                              <p className="mt-0.5 text-[11px] text-[#6B7774]">
                                {doctor.specialty}
                              </p>
                            )}

                            {doctor.professionalLicense && (
                              <p className="mt-0.5 text-[11px] text-[#6B7774]">
                                MP{" "}
                                {
                                  doctor.professionalLicense
                                }
                              </p>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-[12px] text-[#263F3B]">
                    Sin especialista asignado
                  </p>
                )}

                {budget.description && (
                  <div className="mt-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#82956F]">
                      Observaciones
                    </p>

                    <p className="mt-2 whitespace-pre-line text-[11px] leading-5 text-[#6B7774]">
                      {budget.description}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* DETALLE */}

            <section className="avoid-break mt-8">
              <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-[#82956F]">
                Detalle del presupuesto
              </p>

              <div className="mt-3 overflow-hidden border border-[#DED9CD]">
                <table className="w-full border-collapse">
                  <thead className="bg-[#FAF9F5]">
                    <tr className="text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-[#66736F]">
                      <th className="px-4 py-2.5">
                        Tratamiento
                      </th>

                      <th className="px-3 py-2.5 text-center">
                        Cantidad
                      </th>

                      <th className="px-3 py-2.5 text-right">
                        Precio unitario
                      </th>

                      <th className="px-4 py-2.5 text-right">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {budget.items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-[#E8E3D9]"
                      >
                        <td className="px-4 py-3 text-[12px]">
                          {item.serviceName}
                        </td>

                        <td className="px-3 py-3 text-center text-[12px]">
                          {item.quantity}
                        </td>

                        <td className="px-3 py-3 text-right text-[12px]">
                          {formatCurrency(
                            Number(item.unitPrice)
                          )}
                        </td>

                        <td className="px-4 py-3 text-right text-[12px] font-semibold">
                          {formatCurrency(
                            Number(item.total)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* TOTALES */}

            <section className="avoid-break mt-5 ml-auto w-full max-w-[330px] space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-[#6B7774]">
                  Subtotal
                </span>

                <span>
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-[12px]">
                <span className="text-[#6B7774]">
                  Descuento
                </span>

                <span>{discount}%</span>
              </div>

              <div className="flex justify-between border-t border-[#DED9CD] pt-2.5 text-base font-semibold">
                <span>Total</span>

                <span className="text-[#526943]">
                  {formatCurrency(total)}
                </span>
              </div>
            </section>

            {/* VALIDEZ */}

            <section className="avoid-break mt-6 border border-[#DED9CD] bg-[#FBFAF6] px-4 py-3">
              <p className="text-[10px] leading-5 text-[#6B7774]">
                Este presupuesto tiene una validez de
                30 días a partir de la fecha de
                emisión.
              </p>
            </section>

            {/* FIRMAS */}

            <section
              id="budget-signatures"
              className="avoid-break mt-12 grid grid-cols-2 gap-16 px-5"
            >
              <div className="pt-8 text-center">
                <div className="border-t border-[#7E8885]" />

                <p className="mt-2 text-[11px] font-medium text-[#263F3B]">
                  Firma del paciente
                </p>

                <div className="mt-4 flex items-center gap-2 text-[10px] text-[#6B7774]">
                  <span>Aclaración:</span>

                  <span className="h-4 flex-1 border-b border-[#9CA4A1]" />
                </div>
              </div>

              <div className="pt-8 text-center">
                <div className="border-t border-[#7E8885]" />

                <p className="mt-2 text-[11px] font-medium text-[#263F3B]">
                  Firma y sello del profesional
                </p>

                <div className="mt-4 flex items-center gap-2 text-[10px] text-[#6B7774]">
                  <span>Aclaración:</span>

                  <span className="h-4 flex-1 border-b border-[#9CA4A1]" />
                </div>

                <div className="mt-2 flex items-center gap-2 text-[10px] text-[#6B7774]">
                  <span>Matrícula:</span>

                  <span className="h-4 flex-1 border-b border-[#9CA4A1]" />
                </div>
              </div>
            </section>
          </section>
        </div>
      </div>
    </>
  );
}