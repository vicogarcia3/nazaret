import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import WhatsAppReminderButton from "./WhatsAppReminderButton";
import DeletePaymentButton from "./DeletePaymentButton";
import MarkAsPaidButton from "./MarkAsPaidButton";
import NewPaymentForm from "./NewPaymentForm";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
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

function isPaymentOverdue(payment: PaymentForOverdueCheck) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(payment.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  return payment.status === "PENDING" && dueDate < today;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function PagosPacientePage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { estado } = await searchParams;

  const patient = await prisma.patient.findUnique({
    where: {
      id,
    },

    include: {
      branch: true,
      plan: true,

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
          doctor: {
            include: {
              user: true,
            },
          },

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

  const branches = await prisma.branch.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const siteConfig = await prisma.siteConfig.findFirst();

  const clinicName =
    siteConfig?.clinicName || "Consultorios Nazaret";

  const normalizedBudgets = patient.budgets.map(
    (budget, index) => {
      const total = Number(budget.total);

      const paidAmount = budget.payments.reduce(
        (accumulator, payment) =>
          accumulator + Number(payment.amount),
        0
      );

      const remainingAmount = Math.max(
        total - paidAmount,
        0
      );

      return {
        id: budget.id,
        number: patient.budgets.length - index,
        total,
        subtotal: Number(budget.subtotal),
        discount: Number(budget.discount),
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
          budget.doctor.user.name ||
          "Sin especialista asignado",
      };
    }
  );

  const pendingBudgets = normalizedBudgets.filter(
    (budget) => budget.remainingAmount > 0
  );

  const budgetsForForm = patient.budgets.map((budget) => {
    const total = Number(budget.total);

    const paidAmount = budget.payments.reduce(
      (acc, payment) => acc + Number(payment.amount),
      0
    );

    const remainingAmount = Math.max(
      total - paidAmount,
      0
    );

    return {
      id: budget.id,
      total,
      subtotal: Number(budget.subtotal),
      discount: Number(budget.discount),
      status: budget.status,
      createdAt: budget.createdAt.toISOString(),
      paidAmount,
      remainingAmount,
    };
  });

  const paidPayments = patient.payments.filter(
    (payment) => payment.status === "PAID"
  );

  const pendingStandalonePayments =
    patient.payments.filter(
      (payment) =>
        payment.status === "PENDING" &&
        !isPaymentOverdue(payment)
    );

  const delayedPayments = patient.payments.filter(
    (payment) => isPaymentOverdue(payment)
  );

  const totalPaid = paidPayments.reduce(
    (accumulator, payment) =>
      accumulator + Number(payment.amount),
    0
  );

  const totalPending = pendingBudgets.reduce(
    (accumulator, budget) =>
      accumulator + budget.remainingAmount,
    0
  );

  const totalDelayed = delayedPayments.reduce(
    (accumulator, payment) =>
      accumulator + Number(payment.amount),
    0
  );

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
      : activeFilter === "ALL"
      ? patient.payments
      : [];

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

  function formatPhoneForWhatsApp(phone: string) {
    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.startsWith("54")) {
      return cleanPhone;
    }

    return `54${cleanPhone}`;
  }

  function getWhatsAppMessage(payment: {
    amount: number;
    createdAt: Date;
  }) {
    const month = new Date(
      payment.createdAt
    ).toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });

    if (!patient) {
      return "";
    }

    return `Hola ${
      patient.firstName
    }, te recordamos que tenés un pago pendiente de ${formatCurrency(
      Number(payment.amount)
    )} correspondiente al mes de ${month}. El mismo debe abonarse entre el 1 y el 10 de cada mes.\n\nSaludos, ${clinicName}.`;
  }

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <div className="space-y-10">
        <header>
          <Link
            href={`/dashboard/admin/mi-panel/pacientes/${patient.id}`}
            className="inline-flex items-center gap-2 text-sm text-[#A2B38B] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al paciente
          </Link>

          <div className="mt-6">
            <h1 className="font-[var(--font-cormorant)] text-4xl font-medium leading-tight">
              Pagos de {patient.firstName}{" "}
              {patient.lastName}
            </h1>

            <p className="mt-2 text-sm text-[#6B7774]">
              Registrá cobranzas, consultá el historial y
              controlá el saldo pendiente de los presupuestos.
            </p>
          </div>
        </header>

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
              Pagos registrados como cobrados
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
              Saldo restante de los presupuestos
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
              Pagos pendientes con fecha vencida
            </p>
          </article>
        </section>

        <div className="flex flex-wrap gap-3">
          {filters.map((filter) => {
            const href =
              filter.value === "ALL"
                ? `/dashboard/admin/mi-panel/pacientes/${patient.id}/pagos`
                : `/dashboard/admin/mi-panel/pacientes/${patient.id}/pagos?estado=${filter.value}`;

            return (
              <Link
                key={filter.value}
                href={href}
                className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition ${
                  activeFilter === filter.value
                    ? "bg-[#263F3B] text-white"
                    : "border border-[#DED9CD] bg-white text-[#263F3B] hover:bg-[#F7F5EF]"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>

        <NewPaymentForm
          patientId={patient.id}
          branches={branches}
          defaultBranchId={patient.branchId}
          budgets={budgetsForForm}
        />

        {(activeFilter === "ALL" ||
          activeFilter === "PENDING") && (
          <section className="space-y-5">
            <div>
              <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
                Presupuestos con saldo pendiente
              </h2>

              <p className="mt-1 text-sm text-[#6B7774]">
                Deuda restante de los presupuestos del
                paciente.
              </p>
            </div>

            <div className="grid gap-5">
              {pendingBudgets.map((budget) => (
                <article
                  key={budget.id}
                  className="border border-[#DED9CD] bg-white p-7"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[#A2B38B]">
                        <FileText className="h-4 w-4" />

                        <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                          Presupuesto #{budget.number}
                        </span>
                      </div>

                      <h3 className="mt-3 font-[var(--font-cormorant)] text-2xl font-medium">
                        {budget.doctorName}
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
                        {formatCurrency(budget.total)}
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
                      href={`/dashboard/admin/mi-panel/pacientes/${patient.id}/presupuestos`}
                      className="text-xs font-semibold uppercase tracking-[0.15em] text-[#A2B38B] hover:underline"
                    >
                      Ver presupuesto
                    </Link>
                  </div>
                </article>
              ))}

              {pendingBudgets.length === 0 && (
                <article className="border border-[#DED9CD] bg-white p-8">
                  <p className="text-sm text-[#6B7774]">
                    El paciente no tiene presupuestos con saldo
                    pendiente.
                  </p>
                </article>
              )}
            </div>
          </section>
        )}

        {activeFilter !== "PENDING" && (
          <section className="space-y-5">
            <div>
              <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
                Historial de pagos
              </h2>

              <p className="mt-1 text-sm text-[#6B7774]">
                Pagos registrados para este paciente.
              </p>
            </div>

            <div className="grid gap-6">
              {filteredPayments.map((payment, index) => {
                const isOverdue =
                  isPaymentOverdue(payment);

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
                            payment.status === "PAID"
                              ? "text-green-700"
                              : isOverdue
                              ? "text-red-600"
                              : "text-yellow-700"
                          }`}
                        >
                          {payment.status === "PAID"
                            ? "Pagado"
                            : isOverdue
                            ? "Demorado"
                            : "Pendiente"}
                        </span>

                        <DeletePaymentButton
                          paymentId={payment.id}
                        />
                      </div>
                    </div>

                    <Wallet className="mb-3 h-4 w-4 text-[#A2B38B]" />

                    <h2 className="font-[var(--font-cormorant)] text-2xl font-medium">
                      {payment.concept || "Sin concepto"}
                    </h2>

                    <div className="mt-4 grid gap-5 text-sm md:grid-cols-3">
                      <p>
                        <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                          Monto
                        </span>

                        <span className="mt-2 block text-[15px]">
                          {formatCurrency(
                            Number(payment.amount)
                          )}
                        </span>
                      </p>

                      <p>
                        <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                          {payment.status === "PAID"
                            ? "Fecha de pago"
                            : "Vencimiento"}
                        </span>

                        <span className="mt-2 block">
                          {new Date(
                            payment.status === "PAID" &&
                              payment.paidAt
                              ? payment.paidAt
                              : payment.dueDate
                          ).toLocaleDateString("es-AR")}
                        </span>
                      </p>

                      <p>
                        <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                          Sucursal
                        </span>

                        <span className="mt-2 block">
                          {patient.branch.name} —{" "}
                          {patient.branch.address}
                        </span>
                      </p>
                    </div>

                    {payment.status !== "PAID" && (
                      <div className="mt-8 flex justify-end gap-3">
                        <MarkAsPaidButton
                          paymentId={payment.id}
                        />

                        <WhatsAppReminderButton
                          paymentId={payment.id}
                          whatsappUrl={`https://wa.me/${formatPhoneForWhatsApp(
                            patient.phone
                          )}?text=${encodeURIComponent(
                            getWhatsAppMessage({
                              amount: Number(
                                payment.amount
                              ),
                              createdAt:
                                payment.createdAt,
                            })
                          )}`}
                          sent={
                            payment.whatsappReminderSent
                          }
                        />
                      </div>
                    )}
                  </article>
                );
              })}

              {filteredPayments.length === 0 && (
                <article className="border border-[#DED9CD] bg-white p-8">
                  <p className="text-sm text-[#6B7774]">
                    No hay pagos para este filtro.
                  </p>
                </article>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}