import React from "react";
import {
  getProducts,
  getInventoryStats,
  getInventoryDistribution,
  getCategories,
} from "@/lib/api/inventory.api";
import InventoryManager from "./InventoryManager";

// ─── Server Component (async) ─────────────────────────────────────────────────
export default async function InventoryPage() {
  const [products, stats, distribution, categories] = await Promise.all([
    getProducts(),
    getInventoryStats(),
    getInventoryDistribution(),
    getCategories(),
  ]);

  return (
    <InventoryManager
      initialProducts={products}
      categories={categories}
      stats={stats}
      distribution={distribution}
    />
  );
}
