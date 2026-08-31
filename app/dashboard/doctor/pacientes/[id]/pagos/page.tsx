import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

import NewPaymentForm from "@/app/dashboard/admin/mi-panel/pacientes/[id]/pagos/NewPaymentForm";
import WhatsAppReminderButton from "@/app/dashboard/admin/mi-panel/pacientes/[id]/pagos/WhatsAppReminderButton";
import DeletePaymentButton from "@/app/dashboard/admin/mi-panel/pacientes/[id]/pagos/DeletePaymentButton";
import MarkAsPaidButton from "@/app/dashboard/admin/mi-panel/pacientes/[id]/pagos/MarkAsPaidButton";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Wallet,
} from "lucide-react";

type Props = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    estado?: string;
  }>;
};

type PaymentForOverdueCheck = {
  status: string;
  dueDate: Date;
};

function isPaymentOverdue(
  payment: PaymentForOverdueCheck
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(payment.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  return (
    payment.status === "PENDING" &&
    dueDate < today
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPhoneForWhatsApp(phone: string) {
  const cleanPhone = phone.replace(/\D/g, "");

  if (cleanPhone.startsWith("54")) {
    return cleanPhone;
  }

  return `54${cleanPhone}`;
}

export default async function DoctorPatientPaymentsPage({
  params,
  searchParams,
}: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "DOCTOR") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const { estado } = await searchParams;

  /*
   * Especialista autenticado.
   *
   * La pertenencia de los pacientes al especialista
   * se determina mediante las historias clínicas:
   *
   * data.odontologo === doctor.name
   */
  const doctor = await prisma.doctor.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      user: {
        select: {
          name: true,
        },
      },
      branches: {
        select: {
          branchId: true,
        },
      },
    },
  });

  if (!doctor) {
    notFound();
  }

  /*
   * Buscamos al paciente únicamente si tiene una
   * historia clínica correspondiente al especialista.
   *
   * IMPORTANTE:
   * No usamos patient.doctorId porque ya vimos que
   * esa relación no necesariamente representa la
   * asignación real del paciente al especialista.
   */
  const patient = await prisma.patient.findFirst({
    where: {
      id,

      histories: {
        some: {
          data: {
            path: ["odontologo"],
            equals: doctor.name,
          },
        },
      },
    },

    include: {
      branch: true,
      plan: true,

      /*
       * TODOS los pagos del paciente.
       *
       * Esto permite mostrar también pagos anteriores
       * que ya existían antes de entrar desde el portal
       * del especialista.
       */
      payments: {
        orderBy: [
          {
            paidAt: "desc",
          },
          {
            dueDate: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      },

      budgets: {
        include: {
          doctors: {
            include: {
              doctor: {
                select: {
                  name: true,
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },

          /*
           * Solamente pagos cobrados para calcular
           * cuánto se abonó de cada presupuesto.
           */
          payments: {
            where: {
              status: "PAID",
            },
            orderBy: {
              paidAt: "desc",
            },
          },
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

  /*
   * El especialista solamente puede utilizar
   * la sucursal correspondiente al paciente.
   *
   * Esto evita que aparezca Ballesteros cuando
   * el paciente pertenece a Córdoba Capital.
   */
  const branches = await prisma.branch.findMany({
    where: {
      id: patient.branchId,
      active: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const siteConfig =
    await prisma.siteConfig.findFirst();

  const clinicName =
    siteConfig?.clinicName ||
    "Consultorios Nazaret";

  /*
   * Normalizamos presupuestos para mostrar:
   *
   * - total
   * - abonado
   * - saldo
   * - estado
   * - especialista
   */
  const normalizedBudgets =
    patient.budgets.map((budget, index) => {
      const total = Number(budget.total);

      const paidAmount =
        budget.payments.reduce(
          (accumulator, payment) =>
            accumulator +
            Number(payment.amount),
          0
        );

      const remainingAmount = Math.max(
        total - paidAmount,
        0
      );

      return {
        id: budget.id,
        number:
          patient.budgets.length - index,

        total,

        subtotal: Number(
          budget.subtotal
        ),

        discount: Number(
          budget.discount
        ),

        paidAmount,

        remainingAmount,

        status:
          remainingAmount <= 0
            ? "COMPLETED"
            : paidAmount > 0
            ? "IN_PROGRESS"
            : "CREATED",

        createdAt: budget.createdAt,

        doctorName:
          budget.doctors.length > 0
            ? budget.doctors
                .map(
                  ({ doctor }) =>
                    doctor.name ||
                    doctor.user?.name ||
                    "Especialista"
                )
                .join(", ")
            : "Sin especialista asignado",
      };
    });

  const pendingBudgets =
    normalizedBudgets.filter(
      (budget) =>
        budget.remainingAmount > 0
    );

  /*
   * Datos de presupuestos que recibe
   * NewPaymentForm.
   */
  const budgetsForForm =
    patient.budgets.map((budget) => {
      const total = Number(
        budget.total
      );

      const paidAmount =
        budget.payments.reduce(
          (accumulator, payment) =>
            accumulator +
            Number(payment.amount),
          0
        );

      const remainingAmount =
        Math.max(
          total - paidAmount,
          0
        );

      return {
        id: budget.id,
        total,
        paidAmount,
        remainingAmount,
        status: budget.status,
        createdAt:
          budget.createdAt.toISOString(),
      };
    });

  /*
   * Clasificación de pagos.
   */
  const paidPayments =
    patient.payments.filter(
      (payment) =>
        payment.status === "PAID"
    );

  const pendingStandalonePayments =
    patient.payments.filter(
      (payment) =>
        payment.status === "PENDING" &&
        !isPaymentOverdue(payment)
    );

  const delayedPayments =
    patient.payments.filter((payment) =>
      isPaymentOverdue(payment)
    );

  /*
   * Totales.
   */
  const totalPaid =
    paidPayments.reduce(
      (accumulator, payment) =>
        accumulator +
        Number(payment.amount),
      0
    );

  const totalPending =
    pendingBudgets.reduce(
      (accumulator, budget) =>
        accumulator +
        budget.remainingAmount,
      0
    );

  const totalDelayed =
    delayedPayments.reduce(
      (accumulator, payment) =>
        accumulator +
        Number(payment.amount),
      0
    );

  /*
   * Filtro actual.
   */
  const activeFilter =
    estado === "PAID" ||
    estado === "PENDING" ||
    estado === "OVERDUE"
      ? estado
      : "ALL";

  const filteredPayments =
    activeFilter === "PAID"
      ? paidPayments
      : activeFilter === "OVERDUE"
      ? delayedPayments
      : activeFilter === "PENDING"
      ? pendingStandalonePayments
      : patient.payments;

  const filters = [
    {
      label: "Todos",
      value: "ALL",
    },
    {
      label: "Pagados",
      value: "PAID",
    },
    {
      label: "Pendientes",
      value: "PENDING",
    },
    {
      label: "Demorados",
      value: "OVERDUE",
    },
  ];

  function getWhatsAppMessage(payment: {
    amount: number;
    createdAt: Date;
  }) {
    const month =
      new Date(
        payment.createdAt
      ).toLocaleDateString("es-AR", {
        month: "long",
        year: "numeric",
      });

    return `Hola ${patient?.firstName}, te recordamos que tenés un pago pendiente de ${formatCurrency(
      Number(payment.amount)
    )} correspondiente al mes de ${month}. El mismo debe abonarse entre el 1 y el 10 de cada mes.\n\nSaludos, ${clinicName}.`;
  }

  return (
    <main className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <div className="space-y-10">
        {/* HEADER */}
        <header>
          <Link
            href={`/dashboard/doctor/pacientes/${patient.id}`}
            className="inline-flex items-center gap-2 text-sm text-[#A2B38B] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al paciente
          </Link>

          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8FA07F]">
              Portal profesional
            </p>

            <h1 className="mt-2 font-[var(--font-cormorant)] text-4xl font-medium leading-tight">
              Pagos de{" "}
              {patient.firstName}{" "}
              {patient.lastName}
            </h1>

            <p className="mt-2 text-sm text-[#6B7774]">
              Registrá cobranzas, consultá el
              historial y controlá el saldo
              pendiente de los presupuestos.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="bg-[#EEF1E8] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5F6F6B]">
                DNI{" "}
                {patient.dni ||
                  "Sin registrar"}
              </span>

              <span className="bg-[#EEF1E8] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5F6F6B]">
                {patient.plan?.name ||
                  "Sin plan"}
              </span>

              <span className="bg-[#EEF1E8] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5F6F6B]">
                {patient.branch.name} —{" "}
                {patient.branch.city}
              </span>
            </div>
          </div>
        </header>

        {/* TARJETAS */}
        <section className="grid gap-6 md:grid-cols-3">
          <article className="border border-[#DED9CD] bg-white p-8">
            <CheckCircle className="mb-3 h-4 w-4 text-[#A2B38B]" />

            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Cobrado
            </p>

            <p className="mt-2 text-2xl font-semibold text-green-700">
              {formatCurrency(totalPaid)}
            </p>

            <p className="mt-2 text-xs text-[#6B7774]">
              Pagos registrados como
              cobrados
            </p>
          </article>

          <article className="border border-[#DED9CD] bg-white p-8">
            <Clock className="mb-3 h-4 w-4 text-[#A2B38B]" />

            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Saldo pendiente
            </p>

            <p className="mt-2 text-2xl font-semibold text-amber-700">
              {formatCurrency(totalPending)}
            </p>

            <p className="mt-2 text-xs text-[#6B7774]">
              Saldo restante de los
              presupuestos
            </p>
          </article>

          <article className="border border-[#DED9CD] bg-white p-8">
            <AlertCircle className="mb-3 h-4 w-4 text-[#A2B38B]" />

            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Demorados
            </p>

            <p className="mt-2 text-2xl font-semibold text-red-600">
              {formatCurrency(totalDelayed)}
            </p>

            <p className="mt-2 text-xs text-[#6B7774]">
              Pagos pendientes con fecha
              vencida
            </p>
          </article>
        </section>

        {/* FILTROS */}
        <div className="flex flex-wrap gap-3">
          {filters.map((filter) => {
            const href =
              filter.value === "ALL"
                ? `/dashboard/doctor/pacientes/${patient.id}/pagos`
                : `/dashboard/doctor/pacientes/${patient.id}/pagos?estado=${filter.value}`;

            return (
              <Link
                key={filter.value}
                href={href}
                className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                  activeFilter ===
                  filter.value
                    ? "bg-[#263F3B] text-white"
                    : "border border-[#DED9CD] bg-white text-[#263F3B] hover:bg-[#F7F5EF]"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>

        {/* REGISTRAR PAGO */}
        <NewPaymentForm
          patientId={patient.id}
          branches={branches}
          defaultBranchId={
            patient.branchId
          }
          budgets={budgetsForForm}
        />

        {/* PRESUPUESTOS */}
        {(activeFilter === "ALL" ||
          activeFilter === "PENDING") && (
          <section className="space-y-5">
            <div>
              <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
                Presupuestos con saldo
                pendiente
              </h2>

              <p className="mt-1 text-sm text-[#6B7774]">
                Deuda restante de los
                presupuestos del paciente.
              </p>
            </div>

            <div className="grid gap-5">
              {pendingBudgets.map(
                (budget) => (
                  <article
                    key={budget.id}
                    className="border border-[#DED9CD] bg-white p-7"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-[#A2B38B]">
                          <FileText className="h-4 w-4" />

                          <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                            Presupuesto #
                            {budget.number}
                          </span>
                        </div>

                        <h3 className="mt-3 font-[var(--font-cormorant)] text-2xl font-medium">
                          {
                            budget.doctorName
                          }
                        </h3>

                        <p className="mt-1 text-sm text-[#6B7774]">
                          Creado el{" "}
                          {budget.createdAt.toLocaleDateString(
                            "es-AR"
                          )}
                        </p>
                      </div>

                      <span className="w-fit border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                        Saldo pendiente
                      </span>
                    </div>

                    <div className="mt-6 grid gap-5 border-t border-[#DED9CD] pt-6 md:grid-cols-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
                          Total
                        </p>

                        <p className="mt-2 text-lg font-semibold">
                          {formatCurrency(
                            budget.total
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
                          Abonado
                        </p>

                        <p className="mt-2 text-lg font-semibold text-green-700">
                          {formatCurrency(
                            budget.paidAmount
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
                          Pendiente
                        </p>

                        <p className="mt-2 text-lg font-semibold text-amber-700">
                          {formatCurrency(
                            budget.remainingAmount
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <Link
                        href={`/dashboard/doctor/pacientes/${patient.id}/presupuestos`}
                        className="text-xs font-semibold uppercase tracking-[0.15em] text-[#A2B38B] hover:underline"
                      >
                        Ver presupuesto
                      </Link>
                    </div>
                  </article>
                )
              )}

              {pendingBudgets.length ===
                0 && (
                <article className="border border-[#DED9CD] bg-white p-8">
                  <p className="text-sm text-[#6B7774]">
                    El paciente no
                    tiene presupuestos
                    con saldo
                    pendiente.
                  </p>
                </article>
              )}
            </div>
          </section>
        )}

        {/* HISTORIAL */}
        {activeFilter !== "PENDING" && (
          <section className="space-y-5">
            <div>
              <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
                Historial de pagos
              </h2>

              <p className="mt-1 text-sm text-[#6B7774]">
                Pagos registrados para
                este paciente.
              </p>
            </div>

            <div className="grid gap-6">
              {filteredPayments.map(
                (payment, index) => {
                  const isOverdue =
                    isPaymentOverdue(
                      payment
                    );

                  return (
                    <article
                      key={payment.id}
                      className="border border-[#DED9CD] bg-white p-8"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <span className="text-xs text-[#A2B38B]">
                          #{index + 1}
                        </span>

                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                              payment.status ===
                              "PAID"
                                ? "text-green-700"
                                : isOverdue
                                ? "text-red-600"
                                : "text-yellow-700"
                            }`}
                          >
                            {payment.status ===
                            "PAID"
                              ? "Pagado"
                              : isOverdue
                              ? "Demorado"
                              : "Pendiente"}
                          </span>

                          <DeletePaymentButton
                            paymentId={
                              payment.id
                            }
                          />
                        </div>
                      </div>

                      <Wallet className="mb-3 h-4 w-4 text-[#A2B38B]" />

                      <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
                        {payment.concept ||
                          "Sin concepto"}
                      </h2>

                      <div className="mt-4 grid gap-5 text-sm md:grid-cols-3">
                        <p>
                          <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                            Monto
                          </span>

                          <span className="mt-2 block text-[15px]">
                            {formatCurrency(
                              Number(
                                payment.amount
                              )
                            )}
                          </span>
                        </p>

                        <p>
                          <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                            {payment.status ===
                            "PAID"
                              ? "Fecha de pago"
                              : "Vencimiento"}
                          </span>

                          <span className="mt-2 block">
                            {new Date(
                              payment.status ===
                                "PAID" &&
                              payment.paidAt
                                ? payment.paidAt
                                : payment.dueDate
                            ).toLocaleDateString(
                              "es-AR"
                            )}
                          </span>
                        </p>

                        <p>
                          <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                            Sucursal
                          </span>

                          <span className="mt-2 block">
                            {
                              patient
                                .branch
                                .name
                            }{" "}
                            —{" "}
                            {
                              patient
                                .branch
                                .address
                            }
                          </span>
                        </p>
                      </div>

                      <div className="mt-8 flex flex-wrap justify-end gap-3">
                        {payment.status ===
                          "PAID" && (
                          <Link
                            href={`/api/payments/${payment.id}/pdf`}
                            target="_blank"
                            className="inline-flex items-center gap-2 border border-[#DED9CD] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#263F3B] transition hover:bg-[#F7F5EF]"
                          >
                            <Download className="h-4 w-4" />
                            Comprobante
                          </Link>
                        )}

                        {payment.status !==
                          "PAID" && (
                          <>
                            <MarkAsPaidButton
                              paymentId={
                                payment.id
                              }
                            />

                            <WhatsAppReminderButton
                              paymentId={
                                payment.id
                              }
                              whatsappUrl={`https://wa.me/${formatPhoneForWhatsApp(
                                patient.phone
                              )}?text=${encodeURIComponent(
                                getWhatsAppMessage(
                                  {
                                    amount:
                                      Number(
                                        payment.amount
                                      ),
                                    createdAt:
                                      payment.createdAt,
                                  }
                                )
                              )}`}
                              sent={
                                payment.whatsappReminderSent
                              }
                            />
                          </>
                        )}
                      </div>
                    </article>
                  );
                }
              )}

              {filteredPayments.length ===
                0 && (
                <article className="border border-[#DED9CD] bg-white p-8">
                  <p className="text-sm text-[#6B7774]">
                    No hay pagos para este
                    filtro.
                  </p>
                </article>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}