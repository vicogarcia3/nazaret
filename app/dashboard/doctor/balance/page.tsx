"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  Banknote,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  MapPin,
  ReceiptText,
  Search,
  TrendingUp,
} from "lucide-react";

type PaymentStatus =
  | "PAID"
  | "PENDING"
  | "OVERDUE";

type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
};

type Payment = {
  id: string;
  amount: number;
  concept: string | null;
  status: PaymentStatus;
  dueDate: string;
  paidAt: string | null;

  patient: {
    id: string;
    name: string;
    email: string | null;
  };

  branch: Branch;

  budget: {
    id: string;
    description: string | null;
    total: number;
    status: string;
  } | null;
};

type MonthlyIncome = {
  month: number;
  income: number;
};

type BalanceResponse = {
  doctor: {
    id: string;
    name: string | null;
  };

  period: {
    month: number;
    year: number;
  };

  branches: Branch[];

  summary: {
    paid: number;
    pending: number;
    overdue: number;
    completedAppointments: number;
    paymentCount: number;
  };

  payments: Payment[];

  monthlyIncome: MonthlyIncome[];
};

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const SHORT_MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat(
    "es-AR",
    {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

function formatDate(value: string) {
  return new Date(
    value
  ).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getStatusLabel(
  status: PaymentStatus
) {
  const labels: Record<
    PaymentStatus,
    string
  > = {
    PAID: "Cobrado",
    PENDING: "Pendiente",
    OVERDUE: "Demorado",
  };

  return labels[status];
}

function getStatusClasses(
  status: PaymentStatus
) {
  const classes: Record<
    PaymentStatus,
    string
  > = {
    PAID:
      "bg-[#E7F0E3] text-[#56704C]",
    PENDING:
      "bg-[#FFF3CD] text-[#866C22]",
    OVERDUE:
      "bg-[#F8E4E4] text-[#A05252]",
  };

  return classes[status];
}

export default function DoctorBalancePage() {
  const now = new Date();

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(
    now.getMonth()
  );

  const [
    selectedYear,
    setSelectedYear,
  ] = useState(
    now.getFullYear()
  );

  const [
    selectedBranchId,
    setSelectedBranchId,
  ] = useState("");

  const [search, setSearch] =
    useState("");

  const [data, setData] =
    useState<BalanceResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadBalance =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams({
            month: String(
              selectedMonth
            ),
            year: String(
              selectedYear
            ),
          });

        if (selectedBranchId) {
          params.set(
            "branchId",
            selectedBranchId
          );
        }

        const response =
          await fetch(
            `/api/doctor/balance?${params.toString()}`,
            {
              cache: "no-store",
            }
          );

        const responseData =
          await response.json();

        if (!response.ok) {
          throw new Error(
            responseData.error ||
              "No se pudo cargar el balance."
          );
        }

        setData(
          responseData as BalanceResponse
        );
      } catch (loadError) {
        console.error(loadError);

        setData(null);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar el balance."
        );
      } finally {
        setLoading(false);
      }
    }, [
      selectedMonth,
      selectedYear,
      selectedBranchId,
    ]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const filteredPayments =
    useMemo(() => {
      if (!data) {
        return [];
      }

      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      if (!normalizedSearch) {
        return data.payments;
      }

      return data.payments.filter(
        (payment) => {
          const patientName =
            payment.patient.name.toLowerCase();

          const concept =
            payment.concept?.toLowerCase() ||
            "";

          const budgetDescription =
            payment.budget?.description?.toLowerCase() ||
            "";

          const branchName =
            payment.branch.name.toLowerCase();

          return (
            patientName.includes(
              normalizedSearch
            ) ||
            concept.includes(
              normalizedSearch
            ) ||
            budgetDescription.includes(
              normalizedSearch
            ) ||
            branchName.includes(
              normalizedSearch
            )
          );
        }
      );
    }, [data, search]);

  const maxChartValue =
    useMemo(() => {
      if (!data) {
        return 1;
      }

      return Math.max(
        ...data.monthlyIncome.map(
          (item) => item.income
        ),
        1
      );
    }, [data]);

  function navigateMonth(
    direction:
      | "previous"
      | "next"
  ) {
    const amount =
      direction === "next"
        ? 1
        : -1;

    const nextDate =
      new Date(
        selectedYear,
        selectedMonth + amount,
        1
      );

    setSelectedMonth(
      nextDate.getMonth()
    );

    setSelectedYear(
      nextDate.getFullYear()
    );
  }

  function goToCurrentMonth() {
    const currentDate =
      new Date();

    setSelectedMonth(
      currentDate.getMonth()
    );

    setSelectedYear(
      currentDate.getFullYear()
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F5EF] px-5 py-8 text-[#263F3B] md:px-10 md:py-10">
      <div className="mx-auto max-w-[1500px]">
        {/* ENCABEZADO */}

        <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A2B38B]">
              Gestión profesional
            </p>

            <h1 className="mt-2 font-serif text-4xl font-medium md:text-5xl">
              Balance
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B7774]">
              Consultá tus cobros,
              pagos pendientes y
              actividad profesional
              del período.
            </p>
          </div>

          <button
            type="button"
            onClick={
              goToCurrentMonth
            }
            className="w-fit border border-[#A2B38B] bg-white px-6 py-3 text-sm font-semibold text-[#5F7653] transition hover:bg-[#EEF2E9]"
          >
            Mes actual
          </button>
        </header>

        {/* FILTROS */}

        <section className="mt-8 grid gap-4 border border-[#DED9CD] bg-white p-5 lg:grid-cols-[1fr_300px]">
          <label className="relative block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2B38B]" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Buscar por paciente, concepto o sucursal"
              className="w-full border border-[#DED9CD] bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#6F855F]"
            />
          </label>

          <select
            value={
              selectedBranchId
            }
            onChange={(event) =>
              setSelectedBranchId(
                event.target
                  .value
              )
            }
            className="border border-[#DED9CD] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#6F855F]"
          >
            <option value="">
              Todas mis sucursales
            </option>

            {data?.branches.map(
              (branch) => (
                <option
                  key={
                    branch.id
                  }
                  value={
                    branch.id
                  }
                >
                  {branch.name} —{" "}
                  {
                    branch.address
                  }
                </option>
              )
            )}
          </select>
        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-5 border border-[#E3B7B7] bg-[#FBEFEF] px-5 py-4 text-sm text-[#9D5050]">
            {error}
          </div>
        )}

        {/* PERÍODO */}

        <section className="mt-6 flex flex-col justify-between gap-5 border border-[#DED9CD] bg-white p-5 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EEF2E9] text-[#6F855F]">
              <CalendarCheck className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A2B38B]">
                Período seleccionado
              </p>

              <h2 className="mt-1 font-serif text-2xl capitalize md:text-3xl">
                {
                  MONTHS[
                    selectedMonth
                  ]
                }{" "}
                {selectedYear}
              </h2>
            </div>
          </div>

          <div className="flex border border-[#DED9CD]">
            <button
              type="button"
              onClick={() =>
                navigateMonth(
                  "previous"
                )
              }
              aria-label="Mes anterior"
              className="border-r border-[#DED9CD] p-3 transition hover:bg-[#F7F5EF]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() =>
                navigateMonth(
                  "next"
                )
              }
              aria-label="Mes siguiente"
              className="p-3 transition hover:bg-[#F7F5EF]"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>

        {loading ? (
          <div className="mt-6 flex min-h-[420px] items-center justify-center border border-[#DED9CD] bg-white">
            <Loader2 className="h-7 w-7 animate-spin text-[#6F855F]" />
          </div>
        ) : data ? (
          <>
            {/* INDICADORES PRINCIPALES */}

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Cobrado"
                value={formatCurrency(
                  data.summary.paid
                )}
                description="Pagos acreditados"
                icon={
                  <Banknote className="h-5 w-5" />
                }
              />

              <MetricCard
                title="Pendiente"
                value={formatCurrency(
                  data.summary.pending
                )}
                description="Aún no cobrado"
                icon={
                  <Clock3 className="h-5 w-5" />
                }
              />

              <MetricCard
                title="Demorado"
                value={formatCurrency(
                  data.summary.overdue
                )}
                description="Pagos vencidos"
                icon={
                  <AlertCircle className="h-5 w-5" />
                }
              />

              <MetricCard
                title="Atenciones"
                value={String(
                  data.summary
                    .completedAppointments
                )}
                description="Turnos completados"
                icon={
                  <CheckCircle2 className="h-5 w-5" />
                }
              />
            </section>

            {/* RESUMEN HORIZONTAL */}

            <section className="mt-4 grid gap-4 md:grid-cols-3">
              <MiniSummaryCard
                label="Cantidad de pagos"
                value={String(
                  data.summary
                    .paymentCount
                )}
              />

              <MiniSummaryCard
                label="Total generado"
                value={formatCurrency(
                  data.summary.paid +
                    data.summary
                      .pending +
                    data.summary
                      .overdue
                )}
              />

              <MiniSummaryCard
                label="Por cobrar"
                value={formatCurrency(
                  data.summary
                    .pending +
                    data.summary
                      .overdue
                )}
              />
            </section>

            {/* TABLA PAGOS */}

            <section className="mt-6 border border-[#DED9CD] bg-white">
              <div className="flex flex-col justify-between gap-4 border-b border-[#DED9CD] p-6 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A2B38B]">
                    Movimientos
                  </p>

                  <h2 className="mt-2 font-serif text-3xl">
                    Pagos del período
                  </h2>

                  <p className="mt-2 text-sm text-[#6B7774]">
                    {
                      filteredPayments.length
                    }{" "}
                    {filteredPayments.length ===
                    1
                      ? "movimiento encontrado."
                      : "movimientos encontrados."}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A2B38B]">
                    Cobrado
                  </p>

                  <p className="mt-1 font-semibold text-2xl">
                    {formatCurrency(
                      data.summary
                        .paid
                    )}
                  </p>
                </div>
              </div>

              {filteredPayments.length >
              0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="bg-[#FAF9F5] text-[10px] uppercase tracking-[0.16em] text-[#6B7774]">
                      <tr>
                        <th className="px-6 py-4">
                          Paciente
                        </th>

                        <th className="px-6 py-4">
                          Concepto
                        </th>

                        <th className="px-6 py-4">
                          Sucursal
                        </th>

                        <th className="px-6 py-4">
                          Fecha
                        </th>

                        <th className="px-6 py-4">
                          Estado
                        </th>

                        <th className="px-6 py-4 text-right">
                          Importe
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredPayments.map(
                        (
                          payment
                        ) => (
                          <tr
                            key={
                              payment.id
                            }
                            className="border-t border-[#DED9CD] transition hover:bg-[#FFFCF7]"
                          >
                            <td className="px-6 py-5">
                              <p className="font-semibold">
                                {
                                  payment
                                    .patient
                                    .name
                                }
                              </p>

                              {payment
                                .patient
                                .email && (
                                <p className="mt-1 text-xs text-[#8A9390]">
                                  {
                                    payment
                                      .patient
                                      .email
                                  }
                                </p>
                              )}
                            </td>

                            <td className="px-6 py-5">
                              <p className="font-medium">
                                {payment.concept ||
                                  payment
                                    .budget
                                    ?.description ||
                                  "Pago de tratamiento"}
                              </p>

                              {payment.budget && (
                                <p className="mt-1 text-xs text-[#8A9390]">
                                  Presupuesto:{" "}
                                  {formatCurrency(
                                    payment
                                      .budget
                                      .total
                                  )}
                                </p>
                              )}
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex items-start gap-2">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#A2B38B]" />

                                <div>
                                  <p className="font-medium">
                                    {
                                      payment
                                        .branch
                                        .name
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-[#8A9390]">
                                    {
                                      payment
                                        .branch
                                        .address
                                    }
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <p>
                                {formatDate(
                                  payment.paidAt ||
                                    payment.dueDate
                                )}
                              </p>

                              <p className="mt-1 text-xs text-[#8A9390]">
                                {payment.paidAt
                                  ? "Fecha de cobro"
                                  : "Fecha de vencimiento"}
                              </p>
                            </td>

                            <td className="px-6 py-5">
                              <span
                                className={`inline-flex px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${getStatusClasses(
                                  payment.status
                                )}`}
                              >
                                {getStatusLabel(
                                  payment.status
                                )}
                              </span>
                            </td>

                            <td className="px-6 py-5 text-right font-semibold">
                              {formatCurrency(
                                payment.amount
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-10 text-center">
                  <ReceiptText className="mx-auto h-6 w-6 text-[#A2B38B]" />

                  <p className="mt-3 font-serif text-xl">
                    No hay movimientos
                  </p>

                  <p className="mt-1 text-sm text-[#6B7774]">
                    No se encontraron
                    pagos para los
                    filtros seleccionados.
                  </p>
                </div>
              )}
            </section>

            {/* GRÁFICO */}

            <section className="mt-6 border border-[#DED9CD] bg-white p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEF2E9] text-[#6F855F]">
                    <TrendingUp className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#A2B38B]">
                      Evolución anual
                    </p>

                    <h2 className="mt-1 font-serif text-3xl">
                      Cobros mensuales de{" "}
                      {selectedYear}
                    </h2>
                  </div>
                </div>

                <div className="text-sm text-[#6B7774]">
                  Seleccioná un mes
                  para ver su detalle.
                </div>
              </div>

              <div className="mt-8 flex h-64 items-end gap-4 overflow-x-auto pb-2">
                {data.monthlyIncome.map(
                  (item) => {
                    const height =
                      item.income ===
                      0
                        ? 2
                        : Math.max(
                            (item.income /
                              maxChartValue) *
                              100,
                            6
                          );

                    const isSelected =
                      item.month ===
                      selectedMonth;

                    return (
                      <button
                        key={
                          item.month
                        }
                        type="button"
                        onClick={() =>
                          setSelectedMonth(
                            item.month
                          )
                        }
                        className="group flex h-full min-w-[60px] flex-1 flex-col items-center justify-end"
                      >
                        <span className="mb-2 text-xs font-semibold text-[#5F7653] opacity-0 transition group-hover:opacity-100">
                          {formatCurrency(
                            item.income
                          )}
                        </span>

                        <div className="flex h-44 w-full items-end justify-center">
                          <div
                            className={`w-8 transition-all duration-300 ${
                              isSelected
                                ? "bg-[#263F3B]"
                                : "bg-[#A2B38B] group-hover:bg-[#6F855F]"
                            }`}
                            style={{
                              height: `${height}%`,
                            }}
                          />
                        </div>

                        <span
                          className={`mt-3 text-xs font-semibold uppercase ${
                            isSelected
                              ? "text-[#263F3B]"
                              : "text-[#7B8582]"
                          }`}
                        >
                          {
                            SHORT_MONTHS[
                              item.month
                            ]
                          }
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="border border-[#DED9CD] bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
            {title}
          </p>

          <p className="mt-4 text-2xl font-semibold tracking-tight text-[#263F3B]">
            {value}
          </p>

          <p className="mt-2 text-xs text-[#7B8582]">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF2E9] text-[#6F855F]">
          {icon}
        </div>
      </div>
    </article>
  );
}

function MiniSummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="flex items-center justify-between gap-5 border border-[#DED9CD] bg-white px-6 py-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
        {label}
      </p>

      <p className="font-semibold text-2xl font-medium text-[#263F3B]">
        {value}
      </p>
    </article>
  );
}