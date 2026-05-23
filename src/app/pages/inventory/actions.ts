"use server";

import { createProduct, updateProduct, deleteProduct, createCategory, adjustProductStock } from "@/lib/api/inventory.api";
import { revalidatePath } from "next/cache";

export async function addProductAction(data: any, newCategoryName?: string) {
  let category_id = data.category_id;
  if (newCategoryName) {
    const newCat = await createCategory(newCategoryName);
    category_id = newCat.id;
  }
  await createProduct({ ...data, category_id });
  revalidatePath("/pages/inventory");
  revalidatePath("/pages/dashboard");
}

export async function editProductAction(id: string, data: any, newCategoryName?: string) {
  let category_id = data.category_id;
  if (newCategoryName) {
    const newCat = await createCategory(newCategoryName);
    category_id = newCat.id;
  }
  await updateProduct(id, { ...data, category_id });
  revalidatePath("/pages/inventory");
  revalidatePath("/pages/dashboard");
}

export async function removeProductAction(id: string) {
  await deleteProduct(id);
  revalidatePath("/pages/inventory");
  revalidatePath("/pages/dashboard");
}

export async function adjustStockAction(productId: string, delta: number) {
  await adjustProductStock(productId, delta);
  revalidatePath("/pages/inventory");
  revalidatePath("/pages/dashboard");
}

