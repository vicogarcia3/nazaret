"use client";

import { useEffect, useState } from "react";
import {
  ClipboardList,
  CalendarDays,
  UserRound,
  Percent,
  BadgeDollarSign,
  FileText,
} from "lucide-react";

type BudgetItem = {
  id: string;
  serviceName: string;
  total: number;
};

type Doctor = {
  id: string;
  name: string | null;

  user?: {
    name: string | null;
  } | null;
};

type Budget = {
  id: string;
  subtotal: number;
  discount: number;
  total: number;
  createdAt: string;

  doctors: Doctor[];

  items: BudgetItem[];
};

function money(value: number) {
  return `$${Number(value).toLocaleString(
    "es-AR"
  )}`;
}

export default function PatientPresupuestosPage() {
  const [budgets, setBudgets] =
    useState<Budget[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadBudgets() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/patient/budgets",
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
      } catch (error) {
        console.error(
          "Error cargando presupuestos del paciente:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los presupuestos."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadBudgets();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="font-serif text-4xl text-[#173b33]">
          Mis presupuestos
        </h1>

        <p className="mt-4 text-sm text-[#6c7b72]">
          Cargando presupuestos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="font-serif text-4xl text-[#173b33]">
          Mis presupuestos
        </h1>

        <div className="mt-8 border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-4xl text-[#173b33]">
        Mis presupuestos
      </h1>

      <p className="mt-2 text-[#6c7b72]">
        Consultá los presupuestos emitidos por tu odontólogo.
      </p>

      <div className="mt-8 space-y-4">
        {budgets.length === 0 && (
          <div className="border border-[#d8d2c4] bg-white p-8 text-[#6c7b72]">
            Todavía no tenés presupuestos cargados.
          </div>
        )}

        {budgets.map((budget) => {
          const date =
            new Date(
              budget.createdAt
            );

          const doctorNames =
            budget.doctors?.length > 0
              ? budget.doctors
                  .map(
                    (doctor) =>
                      doctor.name ||
                      doctor.user
                        ?.name ||
                      "Especialista"
                  )
                  .join(", ")
              : "Sin especialista asignado";

          return (
            <div
              key={budget.id}
              className="border border-[#d8d2c4] bg-white p-6"
            >
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <InfoCard
                  icon={
                    <CalendarDays
                      size={18}
                    />
                  }
                  title="Fecha"
                  value={date.toLocaleDateString(
                    "es-AR"
                  )}
                />

                <InfoCard
                  icon={
                    <UserRound
                      size={18}
                    />
                  }
                  title={
                    budget.doctors
                      ?.length > 1
                      ? "Odontólogos"
                      : "Odontólogo"
                  }
                  value={
                    doctorNames
                  }
                />

                <InfoCard
                  icon={
                    <Percent
                      size={18}
                    />
                  }
                  title="Descuento"
                  value={`${budget.discount}%`}
                />

                <InfoCard
                  icon={
                    <BadgeDollarSign
                      size={18}
                    />
                  }
                  title="Total"
                  value={money(
                    budget.total
                  )}
                  strong
                />
              </div>

              <div className="mt-5 border border-[#d8d2c4]">
                <div className="flex items-center justify-between border-b border-[#d8d2c4] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#A2B38B]">
                    Detalle
                  </p>

                  <a
                    href={`/api/budgets/${budget.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 border border-[#DED9CD] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#263F3B] hover:bg-[#F7F5EF]"
                  >
                    <FileText className="h-4 w-4" />
                    Ver PDF
                  </a>
                </div>

                <div className="divide-y divide-[#d8d2c4]">
                  {budget.items?.length >
                  0 ? (
                    budget.items.map(
                      (item) => (
                        <div
                          key={
                            item.id
                          }
                          className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                        >
                          <div className="flex min-w-0 items-center gap-2 text-[#173b33]">
                            <ClipboardList
                              size={
                                16
                              }
                              className="shrink-0 text-[#A2B38B]"
                            />

                            <span className="break-words">
                              {
                                item.serviceName
                              }
                            </span>
                          </div>

                          <span className="shrink-0 font-medium text-[#173b33]">
                            {money(
                              item.total
                            )}
                          </span>
                        </div>
                      )
                    )
                  ) : (
                    <div className="px-4 py-4 text-sm text-[#6c7b72]">
                      Sin tratamientos cargados.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <div className="w-full space-y-1 text-sm text-[#173b33]">
                  <div className="flex justify-between">
                    <span>
                      Subtotal
                    </span>

                    <span>
                      {money(
                        budget.subtotal
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-[#6c7b72]">
                    <span>
                      Descuento
                    </span>

                    <span>
                      {
                        budget.discount
                      }
                      %
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-[#d8d2c4] pt-3 text-xl font-semibold">
                    <span>
                      Total
                    </span>

                    <span>
                      {money(
                        budget.total
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  value,
  strong = false,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="min-w-0 border border-[#d8d2c4] p-4">
      <div className="mb-2 text-[#A2B38B]">
        {icon}
      </div>

      <p className="font-semibold text-[#173b33]">
        {title}
      </p>

      <p
        className={`mt-1 break-words text-sm ${
          strong
            ? "font-semibold text-[#173b33]"
            : "text-[#6c7b72]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}