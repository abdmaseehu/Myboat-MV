"use client";

import { Toaster } from "sonner";
import CategoryListFactory from "@/components/admin/categories/category-list-factory";

export default function CategoriesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Toaster position="top-center" />

      {/* Category List */}
      <CategoryListFactory />
    </div>
  );
}
