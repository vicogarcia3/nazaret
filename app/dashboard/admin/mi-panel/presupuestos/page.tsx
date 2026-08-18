"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Loader2,
  ReceiptText,
  Search,
  UsersRound,
  Wallet,
} from "lucide-react";

type BudgetStatus =
  | "CREATED"
  | "IN_PROGRESS"
  | "COMPLETED";

type Doctor = {
  id: string;
  name: string;
  specialty: string | null;
  professionalLicense: string | null;
};

type BudgetItem = {
  id: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type Budget = {
  id: string;
  description: string | null;

  subtotal: number;
  discount: number;
  total: number;

  paidAmount: number;
  remainingAmount: number;

  status: BudgetStatus;

  createdAt: string;
  updatedAt: string;

  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dni: string | null;

    user?: {
      name: string | null;
      email: string | null;
    } | null;

    branch?: {
      id: string;
      name: string;
      city: string;
      address: string;
    } | null;
  };

  doctors: Doctor[];

  items: BudgetItem[];
};

const STATUS_LABELS: Record<
  BudgetStatus,
  string
> = {
  CREATED: "Pendiente",
  IN_PROGRESS: "En curso",
  COMPLETED: "Abonado",
};

const STATUS_CLASSES: Record<
  BudgetStatus,
  string
> = {
  CREATED:
    "bg-[#F3EFE5] text-[#816D3E]",
  IN_PROGRESS:
    "bg-[#EAF0E5] text-[#5F7653]",
  COMPLETED:
    "bg-[#E3EFE2] text-[#4F7049]",
};

function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    "es-AR",
    {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

function formatDate(
  value: string
) {
  return new Date(
    value
  ).toLocaleDateString(
    "es-AR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

export default function PresupuestosPage() {
  const [budgets, setBudgets] =
    useState<Budget[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<
      "ALL" | BudgetStatus
    >("ALL");

  const [doctorFilter, setDoctorFilter] =
    useState("ALL");

  useEffect(() => {
    void loadBudgets();
  }, []);

  async function loadBudgets() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/budgets",
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "No se pudieron cargar los presupuestos."
        );
      }

      setBudgets(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (loadError) {
      console.error(
        "Error cargando presupuestos:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los presupuestos."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredBudgets =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return budgets.filter(
        (budget) => {
          if (
            statusFilter !== "ALL" &&
            budget.status !== statusFilter
          ) {
            return false;
          }

          if (
            doctorFilter !== "ALL" &&
            !budget.doctors.some(
              (doctor) =>
                doctor.id === doctorFilter
            )
          ) {
            return false;
          }

          if (!normalizedSearch) {
            return true;
          }

          const patientName = [
            budget.patient
              .firstName,
            budget.patient
              .lastName,
            budget.patient.user
              ?.name || "",
          ]
            .join(" ")
            .toLowerCase();

          const dni =
            budget.patient.dni ||
            "";

          const doctors =
            budget.doctors
              .map(
                (doctor) =>
                  doctor.name
              )
              .join(" ")
              .toLowerCase();

          const treatments =
            budget.items
              .map(
                (item) =>
                  item.serviceName
              )
              .join(" ")
              .toLowerCase();

          return (
            patientName.includes(
              normalizedSearch
            ) ||
            dni.includes(
              normalizedSearch
            ) ||
            doctors.includes(
              normalizedSearch
            ) ||
            treatments.includes(
              normalizedSearch
            ) ||
            (
              budget.description ||
              ""
            )
              .toLowerCase()
              .includes(
                normalizedSearch
              )
          );
        }
      );
    }, [
      budgets,
      search,
      statusFilter,
      doctorFilter,
    ]);

  const totals = useMemo(() => {
    return filteredBudgets.reduce(
      (result, budget) => {
        result.total += Number(
          budget.total || 0
        );

        result.paid += Number(
          budget.paidAmount || 0
        );

        result.pending += Number(
          budget.remainingAmount || 0
        );

        return result;
      },
      {
        total: 0,
        paid: 0,
        pending: 0,
      }
    );
  }, [filteredBudgets]);

  const availableDoctors = useMemo(() => {
    const doctorMap = new Map<
      string,
      Doctor
    >();

    budgets.forEach((budget) => {
      budget.doctors.forEach((doctor) => {
        doctorMap.set(
          doctor.id,
          doctor
        );
      });
    });

    return Array.from(
      doctorMap.values()
    ).sort((a, b) =>
      a.name.localeCompare(
        b.name,
        "es"
      )
    );
  }, [budgets]);

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#263F3B]">
      <div className="space-y-8">
        {/* HEADER */}

        <header>
          <div className="mb-3 flex items-center gap-2 text-[#A2B38B]">
            <ReceiptText className="h-5 w-5" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.22em]">
              Gestión financiera
            </span>
          </div>

          <h1 className="font-serif text-4xl font-medium">
            Presupuestos
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B7774]">
            Consultá todos los
            presupuestos del
            consultorio, los importes
            abonados y los saldos
            pendientes de cada
            paciente.
          </p>
        </header>

        {/* RESUMEN */}

        <section className="grid gap-4 md:grid-cols-4">
          <SummaryCard
            label="Presupuestos"
            value={String(
              filteredBudgets.length
            )}
            description="Total registrados"
            icon={
              <FileText className="h-5 w-5" />
            }
          />

          <SummaryCard
            label="Total presupuestado"
            value={formatCurrency(
              totals.total
            )}
            description="Importe total"
            icon={
              <Wallet className="h-5 w-5" />
            }
          />

          <SummaryCard
            label="Abonado"
            value={formatCurrency(
              totals.paid
            )}
            description="Pagos registrados"
            icon={
              <Banknote className="h-5 w-5" />
            }
          />

          <SummaryCard
            label="Pendiente"
            value={formatCurrency(
              totals.pending
            )}
            description="Saldo por cobrar"
            icon={
              <Clock3 className="h-5 w-5" />
            }
          />
        </section>

        {/* FILTROS */}
        <section className="grid gap-4 border border-[#DED9CD] bg-white p-5 md:grid-cols-[1fr_240px_240px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2B38B]" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar por paciente, DNI, especialista o tratamiento"
              className="w-full border border-[#DED9CD] bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#263F3B]"
            />
          </div>

          <select
            value={doctorFilter}
            onChange={(event) =>
              setDoctorFilter(
                event.target.value
              )
            }
            className="border border-[#DED9CD] bg-white px-4 py-3 text-sm outline-none focus:border-[#263F3B]"
          >
            <option value="ALL">
              Todos los especialistas
            </option>

            {availableDoctors.map(
              (doctor) => (
                <option
                  key={doctor.id}
                  value={doctor.id}
                >
                  {doctor.name}
                </option>
              )
            )}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "ALL"
                  | BudgetStatus
              )
            }
            className="border border-[#DED9CD] bg-white px-4 py-3 text-sm outline-none focus:border-[#263F3B]"
          >
            <option value="ALL">
              Todos los estados
            </option>

            <option value="CREATED">
              Pendientes
            </option>

            <option value="IN_PROGRESS">
              En curso
            </option>

            <option value="COMPLETED">
              Abonados
            </option>
          </select>
        </section>

        {/* ERROR */}

        {error && (
          <div className="border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* CARGANDO */}

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center border border-[#DED9CD] bg-white">
            <Loader2 className="h-7 w-7 animate-spin text-[#6F855F]" />
          </div>
        ) : (
          <section className="border border-[#DED9CD] bg-white">
            {/* CABECERA */}

            <div className="flex items-end justify-between border-b border-[#DED9CD] px-6 py-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A2B38B]">
                  Listado general
                </p>

                <h2 className="mt-2 font-serif text-2xl">
                  Todos los presupuestos
                </h2>
              </div>

              <p className="text-sm text-[#6B7774]">
                {
                  filteredBudgets.length
                }{" "}
                {filteredBudgets.length ===
                1
                  ? "resultado"
                  : "resultados"}
              </p>
            </div>

            {filteredBudgets.length >
            0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-[#FAF9F5]">
                    <tr className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[#71807C]">
                      <th className="px-6 py-4">
                        Paciente
                      </th>

                      <th className="px-5 py-4">
                        Tratamiento
                      </th>

                      <th className="px-5 py-4">
                        Especialista/s
                      </th>

                      <th className="px-5 py-4">
                        Fecha
                      </th>

                      <th className="px-5 py-4 text-right">
                        Total
                      </th>

                      <th className="px-5 py-4 text-right">
                        Abonado
                      </th>

                      <th className="px-5 py-4 text-right">
                        Pendiente
                      </th>

                      <th className="px-5 py-4">
                        Estado
                      </th>

                      <th className="px-6 py-4" />
                    </tr>
                  </thead>

                  <tbody>
                    {filteredBudgets.map(
                      (budget) => {
                        const patientName =
                          `${budget.patient.lastName}, ${budget.patient.firstName}`;

                        const treatments =
                          budget.items
                            ?.map(
                              (item) =>
                                item.serviceName
                            )
                            .filter(Boolean)
                            .join(", ") ||
                          budget.description ||
                          "Sin descripción";

                        const doctorNames =
                          budget.doctors
                            ?.map(
                              (doctor) =>
                                doctor.name
                            )
                            .filter(Boolean)
                            .join(", ") ||
                          "Sin especialista";

                        return (
                          <tr
                            key={
                              budget.id
                            }
                            className="border-t border-[#E8E3D9] transition hover:bg-[#FCFBF8]"
                          >
                            {/* PACIENTE */}

                            <td className="px-6 py-5">
                              <p className="font-semibold text-[#263F3B]">
                                {
                                  patientName
                                }
                              </p>

                              {budget
                                .patient
                                .dni && (
                                <p className="mt-1 text-xs text-[#7B8582]">
                                  DNI{" "}
                                  {
                                    budget
                                      .patient
                                      .dni
                                  }
                                </p>
                              )}

                              {budget
                                .patient
                                .branch && (
                                <p className="mt-1 text-xs text-[#A2B38B]">
                                  {
                                    budget
                                      .patient
                                      .branch
                                      .name
                                  }
                                </p>
                              )}
                            </td>

                            {/* TRATAMIENTO */}

                            <td className="max-w-[240px] px-5 py-5">
                              <p className="line-clamp-2 text-sm leading-5">
                                {
                                  treatments
                                }
                              </p>

                              {budget.discount >
                                0 && (
                                <p className="mt-1 text-xs text-[#6F855F]">
                                  {
                                    budget.discount
                                  }
                                  % de
                                  descuento
                                </p>
                              )}
                            </td>

                            {/* DOCTORES */}

                            <td className="max-w-[210px] px-5 py-5">
                              <div className="flex items-start gap-2">
                                <UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-[#A2B38B]" />

                                <p className="text-sm leading-5">
                                  {
                                    doctorNames
                                  }
                                </p>
                              </div>
                            </td>

                            {/* FECHA */}

                            <td className="whitespace-nowrap px-5 py-5 text-sm text-[#6B7774]">
                              {formatDate(
                                budget.createdAt
                              )}
                            </td>

                            {/* TOTAL */}

                            <td className="whitespace-nowrap px-5 py-5 text-right font-semibold">
                              {formatCurrency(
                                budget.total
                              )}
                            </td>

                            {/* ABONADO */}

                            <td className="whitespace-nowrap px-5 py-5 text-right font-semibold text-[#5F7653]">
                              {formatCurrency(
                                budget.paidAmount
                              )}
                            </td>

                            {/* PENDIENTE */}

                            <td className="whitespace-nowrap px-5 py-5 text-right font-semibold">
                              {formatCurrency(
                                budget.remainingAmount
                              )}
                            </td>

                            {/* ESTADO */}

                            <td className="px-5 py-5">
                              <span
                                className={`inline-flex whitespace-nowrap px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                                  STATUS_CLASSES[
                                    budget
                                      .status
                                  ]
                                }`}
                              >
                                {
                                  STATUS_LABELS[
                                    budget
                                      .status
                                  ]
                                }
                              </span>
                            </td>

                            {/* DETALLE */}

                            <td className="px-6 py-5">
                              <Link
                                href={`/dashboard/admin/mi-panel/presupuestos/${budget.id}`}
                                className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.16em] text-[#263F3B] transition hover:text-[#6F855F]"
                              >
                                Ver detalle

                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
                <CheckCircle2 className="h-7 w-7 text-[#A2B38B]" />

                <h3 className="mt-4 font-serif text-2xl">
                  No encontramos presupuestos
                </h3>

                <p className="mt-2 text-sm text-[#6B7774]">
                  Probá cambiando los
                  filtros o el término de
                  búsqueda.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="border border-[#DED9CD] bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A2B38B]">
            {label}
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