import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import WhatsAppReminderButton from "./WhatsAppReminderButton";
import DeletePaymentButton from "./DeletePaymentButton";
import MarkAsPaidButton from "./MarkAsPaidButton";
import NewPaymentForm from "./NewPaymentForm";
import {
  ArrowLeft,
  Wallet,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ estado?: string }>;
};

export default async function PagosPacientePage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { estado } = await searchParams;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      branch: true,
      plan: true,
      payments: {
        orderBy: {
          dueDate: "desc",
        },
      },
      budgets: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!patient) notFound();

  const branches = await prisma.branch.findMany();
  const budgetsForForm = patient.budgets.map((budget) => ({
    id: budget.id,
    total: Number(budget.total),
    subtotal: Number(budget.subtotal),
    discount: Number(budget.discount),
    status: budget.status,
    createdAt: budget.createdAt.toISOString(),
  }));

  const siteConfig = await prisma.siteConfig.findFirst();
  const clinicName = siteConfig?.clinicName || "Consultorios Nazaret";

  function formatPhoneForWhatsApp(phone: string) {
    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.startsWith("54")) return cleanPhone;

    return `54${cleanPhone}`;
  }

  function getWhatsAppMessage(payment: {
    amount: any;
    createdAt: Date;
  }) {
    const month = new Date(payment.createdAt).toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });

    return `Hola ${patient.firstName}, te recordamos que tenés un pago pendiente de $${Number(
      payment.amount
    ).toLocaleString("es-AR")} correspondiente al mes de ${month}. El mismo debe abonarse entre el 1 y el 10 de cada mes.\n\nSaludos, ${clinicName}.`;
  }

  const paidPayments = patient.payments.filter((p) => p.status === "PAID");
  const pendingPayments = patient.payments.filter(
    (p) => p.status === "PENDING" && !isPaymentOverdue(p)
  );

  const delayedPayments = patient.payments.filter(
    (p) => isPaymentOverdue(p)
  );

  const totalPaid = paidPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const totalPending = pendingPayments.reduce(
    (acc, p) => acc + Number(p.amount),
    0
  );
  const totalDelayed = delayedPayments.reduce(
    (acc, p) => acc + Number(p.amount),
    0
  );

  const activeFilter =
    estado === "PAID" || estado === "PENDING" || estado === "OVERDUE"
      ? estado
      : "ALL";

  const filteredPayments =
    activeFilter === "ALL"
      ? patient.payments
      : patient.payments.filter((payment) => {
          if (activeFilter === "PAID") return payment.status === "PAID";
          if (activeFilter === "PENDING") {
            return payment.status === "PENDING" && !isPaymentOverdue(payment);
          }
          if (activeFilter === "OVERDUE") return isPaymentOverdue(payment);
          return true;
        });

  const filters = [
    { label: "Todos", value: "ALL" },
    { label: "Pagados", value: "PAID" },
    { label: "Pendientes", value: "PENDING" },
    { label: "Demorados", value: "OVERDUE" },
  ];

  function isPaymentOverdue(payment: { status: string; dueDate: Date }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(payment.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    return payment.status === "PENDING" && dueDate < today;
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
              Pagos de {patient.firstName} {patient.lastName}
            </h1>

            <p className="mt-2 text-sm text-[#6B7774]">
              Historial de pagos, vencimientos y estados del paciente.
            </p>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <article className="border border-[#DED9CD] bg-white p-8">
            <CheckCircle className="mb-3 h-4 w-4 text-[#A2B38B]" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Cobrados
            </p>
            <p className="mt-2 text-2xl font-semibold">
              ${totalPaid.toLocaleString("es-AR")}
            </p>
          </article>

          <article className="border border-[#DED9CD] bg-white p-8">
            <Clock className="mb-3 h-4 w-4 text-[#A2B38B]" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Pendientes
            </p>
            <p className="mt-2 text-2xl font-semibold">
              ${totalPending.toLocaleString("es-AR")}
            </p>
          </article>

          <article className="border border-[#DED9CD] bg-white p-8">
            <AlertCircle className="mb-3 h-4 w-4 text-[#A2B38B]" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
              Demorados
            </p>
            <p className="mt-2 text-2xl font-semibold">
              ${totalDelayed.toLocaleString("es-AR")}
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

        <section className="grid gap-6">
          {filteredPayments.map((payment, index) => {
            const isOverdue = isPaymentOverdue(payment);

            return (
              <article
                key={payment.id}
                className="border border-[#DED9CD] bg-white p-8"
              >
                <div className="mb-4 flex items-start justify-between">
                  <span className="text-xs text-[#A2B38B]">#{index + 1}</span>

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

                    <DeletePaymentButton paymentId={payment.id} />
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
                      ${Number(payment.amount).toLocaleString("es-AR")}
                    </span>
                  </p>

                  <p>
                    <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                      Vencimiento
                    </span>
                    <span className="mt-2 block">
                      {new Date(payment.dueDate).toLocaleDateString("es-AR")}
                    </span>
                  </p>

                  <p>
                    <span className="block text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                      Sucursal
                    </span>
                    <span className="mt-2 block">
                      {patient.branch.name} — {patient.branch.address}
                    </span>
                  </p>
                </div>

                {payment.status !== "PAID" && (
                  <div className="mt-8 flex justify-end gap-3">
                    <MarkAsPaidButton paymentId={payment.id} />

                    <WhatsAppReminderButton
                      paymentId={payment.id}
                      whatsappUrl={`https://wa.me/${formatPhoneForWhatsApp(
                        patient.phone
                      )}?text=${encodeURIComponent(getWhatsAppMessage(payment))}`}
                      sent={payment.whatsappReminderSent}
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
        </section>
      </div>
    </div>
  );
}