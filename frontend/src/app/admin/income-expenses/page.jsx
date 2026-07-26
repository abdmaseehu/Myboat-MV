// src/app/admin/income-expenses/page.jsx
"use client";

import { Toaster } from "sonner";
import IncomeExpenseListFactory from "@/components/admin/income-expenses/income-expense-list-factory";

export default function IncomeExpensesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />

      {/* Income & Expenses List */}
      <IncomeExpenseListFactory />
    </div>
  );
}
