"use client";

import { useState } from "react";

import BudgetAccordion, {
  EditableBudget,
} from "./BudgetAccordion";

import NewBudgetForm from "./NewBudgetForm";

type Doctor = {
  id: string;
  name: string | null;
  specialty?: string | null;

  user: {
    name: string | null;
  } | null;
};

type Payment = {
  id: string;
  amount: number;
  concept: string | null;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
};

type BudgetStatus =
  | "CREATED"
  | "IN_PROGRESS"
  | "COMPLETED";

type BudgetItem = {
  id: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type Budget = {
  id: string;
  createdAt: string;

  total: number;
  paidAmount: number;
  remainingAmount: number;

  status: BudgetStatus;

  doctorName: string;

  doctorIds: string[];

  items: BudgetItem[];

  payments: Payment[];
};

type Props = {
  patientId: string;

  doctors: Doctor[];

  discountPercent: number;

  budgets: Budget[];

  branchName: string;
};

export default function BudgetManager({
  patientId,
  doctors,
  discountPercent,
  budgets,
  branchName,
}: Props) {
  const [
    editingBudget,
    setEditingBudget,
  ] = useState<EditableBudget | null>(
    null
  );

  function handleEditBudget(
    budget: EditableBudget
  ) {
    setEditingBudget(budget);
  }

  function handleCancelEdit() {
    setEditingBudget(null);
  }

  function handleSaved() {
    setEditingBudget(null);
  }

  return (
    <div className="space-y-10">
      <NewBudgetForm
        patientId={patientId}
        doctors={doctors}
        discountPercent={
          discountPercent
        }
        editingBudget={
          editingBudget
        }
        onCancelEdit={
          handleCancelEdit
        }
        onSaved={
          handleSaved
        }
      />

      <BudgetAccordion
        budgets={budgets}
        branchName={branchName}
        onEditBudget={
          handleEditBudget
        }
      />
    </div>
  );
}