"use client";

import { FileText } from "lucide-react";

type Props = {
  budgetId: string;
};

export default function ViewBudgetPdfButton({ budgetId }: Props) {
  return (
    <a
      href={`/api/budgets/${budgetId}/pdf`}
      target="_blank"
      title="Ver PDF"
      className="text-[#263F3B] transition hover:text-black"
    >
      <FileText className="h-4 w-4" />
    </a>
  );
}