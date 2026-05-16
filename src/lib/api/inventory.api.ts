/**
 * inventory.api.ts
 * ─────────────────────────────────────────────────────────────
 * Dominio: Productos y Categorías.
 */

import { supabase } from "@/lib/supabase/client";
import type { Product, Category } from "@/lib/database.types";

// ─── Tipos compuestos ──────────────────────────────────────────────────────────

export type ProductWithCategory = Product & { categories: Category | null };

export interface InventoryStats {
  totalProducts: number;
  criticalStock: number; // products con stock <= 10
  totalCategories: number;
}

// ─── Categorías ────────────────────────────────────────────────────────────────

/** Obtiene todas las categorías disponibles. */
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(`[inventory.api] getCategories: ${error.message}`);
  return (data ?? []) as Category[];
}

// ─── Productos ─────────────────────────────────────────────────────────────────

/** Obtiene productos, opcionalmente filtrados por categoría. */
export async function getProducts(categoryId?: string): Promise<ProductWithCategory[]> {
  let query = supabase
    .from("products")
    .select(`*, categories (*)`)
    .order("name", { ascending: true });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`[inventory.api] getProducts: ${error.message}`);
  return (data ?? []) as ProductWithCategory[];
}

/** Busca un producto por SKU. */
export async function getProductBySku(sku: string): Promise<ProductWithCategory | null> {
  const { data, error } = await supabase
    .from("products")
    .select(`*, categories (*)`)
    .eq("sku", sku)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`[inventory.api] getProductBySku: ${error.message}`);
  }
  return data as ProductWithCategory;
}

/** Obtiene productos con stock crítico (≤ threshold, default 10). */
export async function getLowStockProducts(threshold = 10): Promise<ProductWithCategory[]> {
  const { data, error } = await supabase
    .from("products")
    .select(`*, categories (*)`)
    .lte("stock", threshold)
    .order("stock", { ascending: true });

  if (error) throw new Error(`[inventory.api] getLowStockProducts: ${error.message}`);
  return (data ?? []) as ProductWithCategory[];
}

/** Ajusta el stock de un producto (delta positivo = entrada, negativo = salida). */
export async function adjustProductStock(productId: string, delta: number): Promise<Product> {
  // Leer stock actual
  const { data: current, error: readError } = await supabase
    .from("products")
    .select("stock")
    .eq("id", productId)
    .single();

  if (readError) throw new Error(`[inventory.api] adjustProductStock (read): ${readError.message}`);

  const newStock = (current.stock as number) + delta;
  if (newStock < 0) throw new Error(`[inventory.api] adjustProductStock: stock resultante negativo (${newStock})`);

  const { data, error } = await supabase
    .from("products")
    .update({ stock: newStock })
    .eq("id", productId)
    .select()
    .single();

  if (error) throw new Error(`[inventory.api] adjustProductStock (update): ${error.message}`);
  return data as Product;
}

/** Estadísticas rápidas del inventario para el dashboard. */
export async function getInventoryStats(): Promise<InventoryStats> {
  const [totalResult, criticalResult, categoriesResult] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).lte("stock", 10),
    supabase.from("categories").select("id", { count: "exact", head: true }),
  ]);

  if (totalResult.error) throw new Error(`[inventory.api] getInventoryStats (total): ${totalResult.error.message}`);
  if (criticalResult.error) throw new Error(`[inventory.api] getInventoryStats (critical): ${criticalResult.error.message}`);
  if (categoriesResult.error) throw new Error(`[inventory.api] getInventoryStats (categories): ${categoriesResult.error.message}`);

  return {
    totalProducts: totalResult.count ?? 0,
    criticalStock: criticalResult.count ?? 0,
    totalCategories: categoriesResult.count ?? 0,
  };
}

/** Distribución del inventario por categoría (nombre + cantidad de productos). */
export async function getInventoryDistribution(): Promise<
  Array<{ category: string; count: number; percentage: number }>
> {
  const { data, error } = await supabase.from("products").select(`categories (name)`);
  if (error) throw new Error(`[inventory.api] getInventoryDistribution: ${error.message}`);

  const countMap: Record<string, number> = {};
  const total = (data ?? []).length;

  for (const row of data ?? []) {
    const name = (row.categories as { name: string } | null)?.name ?? "Sin categoría";
    countMap[name] = (countMap[name] ?? 0) + 1;
  }

  return Object.entries(countMap).map(([category, count]) => ({
    category,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
}

/** Crea una nueva categoría. Retorna el registro insertado. */
export async function createCategory(name: string): Promise<Category> {
  const { data, error } = await supabase
    .from("categories")
    .insert({ name })
    .select()
    .single();

  if (error) throw new Error(`[inventory.api] createCategory: ${error.message}`);
  return data as Category;
}

/** Crea un nuevo producto. Retorna el registro insertado. */
export async function createProduct(
  input: Pick<Product, "sku" | "name" | "category_id" | "price" | "stock">
): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`[inventory.api] createProduct: ${error.message}`);
  return data as Product;
}

/** Actualiza un producto existente. */
export async function updateProduct(
  id: string,
  input: Partial<Pick<Product, "sku" | "name" | "category_id" | "price" | "stock">>
): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`[inventory.api] updateProduct: ${error.message}`);
  return data as Product;
}

/** Elimina un producto. */
export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(`[inventory.api] deleteProduct: ${error.message}`);
}
