"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { ProductWithCategory } from "@/lib/api/inventory.api";
import { addProductAction, editProductAction, removeProductAction } from "./actions";

// ─── Drawer Component ─────────────────────────────────────────────────────────
interface ProductDrawerProps {
  isOpen: boolean;
  editingProduct: ProductWithCategory | null;
  categories: any[];
  onClose: () => void;
  onSaved: () => void;
}

function ProductDrawer({ isOpen, editingProduct, categories, onClose, onSaved }: ProductDrawerProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const initial = editingProduct
    ? {
        sku: editingProduct.sku ?? "",
        name: editingProduct.name ?? "",
        price: String(editingProduct.price ?? ""),
        stock: String(editingProduct.stock ?? ""),
        category_id: editingProduct.category_id ?? "",
        new_category_name: "",
      }
    : { sku: "", name: "", price: "", stock: "", category_id: "", new_category_name: "" };

  // ── Animation lifecycle ────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setIsCreatingCategory(false);
      setIsDirty(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true));
      });
    } else {
      setAnimating(false);
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // ── Dirty detection ────────────────────────────────────────────────────────
  const checkDirty = useCallback(() => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const changed = (Object.keys(initial) as (keyof typeof initial)[]).some(
      (k) => (fd.get(k) ?? "") !== initial[k]
    );
    setIsDirty(changed);
  }, [initial]);

  const requestClose = () => {
    if (isDirty) {
      if (!window.confirm("¿Seguro que deseas salir? Los datos no guardados se perderán.")) return;
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setIsPending(true);
    try {
      const data = {
        name: fd.get("name") as string,
        sku: fd.get("sku") as string,
        price: parseFloat(fd.get("price") as string),
        stock: parseInt(fd.get("stock") as string, 10),
        category_id: isCreatingCategory ? "" : (fd.get("category_id") as string),
      };
      const newCategoryName = isCreatingCategory ? (fd.get("new_category_name") as string) : undefined;
      if (editingProduct) {
        await editProductAction(editingProduct.id, data, newCategoryName);
      } else {
        await addProductAction(data, newCategoryName);
      }
      setIsDirty(false);
      onSaved();
    } finally {
      setIsPending(false);
    }
  };

  if (!visible) return null;

  const inputCls =
    "w-full bg-surface-container rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-on-surface/30 transition-shadow";

  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        onClick={requestClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: animating ? 1 : 0 }}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-md bg-surface-container-low h-full shadow-2xl flex flex-col"
        style={{
          transform: animating ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-headline font-bold text-xl text-on-surface">
              {editingProduct ? "Editar Producto" : "Añadir Nuevo Producto"}
            </h3>
            {isDirty && (
              <p className="text-[11px] text-primary/80 font-semibold mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                Hay cambios sin guardar
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="w-9 h-9 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface/50 hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          onChange={checkDirty}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {/* SKU */}
          <div>
            <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
              SKU
            </label>
            <input required name="sku" defaultValue={initial.sku} className={inputCls} placeholder="Código de producto" />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
              Nombre
            </label>
            <input required name="name" defaultValue={initial.name} className={inputCls} placeholder="Ej. Proteína Whey 1kg" />
          </div>

          {/* Precio / Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
                Precio (S/)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface/50 select-none pointer-events-none">
                  S/
                </span>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  name="price"
                  defaultValue={initial.price}
                  className="w-full bg-surface-container rounded-lg pl-8 pr-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-on-surface/30"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
                Stock
              </label>
              <input
                required
                type="number"
                min="0"
                name="stock"
                defaultValue={initial.stock}
                className={inputCls}
                placeholder="Cantidad"
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
              Categoría
            </label>
            <select
              name="category_id"
              required={!isCreatingCategory}
              defaultValue={initial.category_id}
              onChange={(e) => {
                setIsCreatingCategory(e.target.value === "NEW");
                checkDirty();
              }}
              className={inputCls}
            >
              <option value="" disabled>Selecciona una categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
              <option value="NEW">[ + Crear Nueva Categoría ]</option>
            </select>

            {isCreatingCategory && (
              <div className="mt-3">
                <input
                  required
                  name="new_category_name"
                  className="w-full bg-surface-container-high border border-primary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Nombre de la nueva categoría"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-cta text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Guardando…
                </>
              ) : editingProduct ? (
                "Guardar Cambios"
              ) : (
                "Crear Producto"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Quick Stock Lookup ────────────────────────────────────────────────────────
function QuickStockPanel({ products }: { products: ProductWithCategory[] }) {
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = query.length >= 1
    ? products
        .filter(
          (p) =>
            p.sku.toLowerCase().includes(query.toLowerCase()) ||
            p.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 6)
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectSuggestion = (p: ProductWithCategory) => {
    setQuery(p.sku);
    setSelectedProduct(p);
    setShowSuggestions(false);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedProduct(null);
    setShowSuggestions(true);
  };

  const handleStockUpdate = () => {
    if (!selectedProduct) {
      alert("Selecciona un producto de la lista antes de actualizar el stock.");
      return;
    }
    // In a real integration you'd call adjustProductStock here.
    alert(`Stock actualizado: ${selectedProduct.name} +${qty} unidades.\n(Integración DB pendiente en este panel.)`);
    setQuery("");
    setSelectedProduct(null);
    setQty(1);
  };

  return (
    <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-outline-variant/10">
      <h3 className="font-headline font-bold text-lg text-on-surface mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">add_box</span>
        Registro Rápido
      </h3>
      <div className="space-y-5">
        {/* SKU search with autocomplete */}
        <div>
          <label className="block font-body text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
            Código / Nombre
          </label>
          <div className="relative" ref={containerRef}>
            <input
              className="w-full bg-surface-container-highest/30 border-0 border-b border-outline-variant/40 focus:border-b-2 focus:border-primary focus:ring-0 px-3 py-2 text-sm font-body transition-all outline-none pr-8"
              placeholder="Busca por SKU o nombre…"
              type="text"
              value={query}
              onChange={handleInput}
              onFocus={() => query.length >= 1 && setShowSuggestions(true)}
              autoComplete="off"
            />
            {/* Clear */}
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => { setQuery(""); setSelectedProduct(null); setShowSuggestions(false); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface/30 hover:text-on-surface/60 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-40 top-full left-0 right-0 mt-1 bg-surface-container-low border border-outline-variant/20 rounded-xl shadow-xl overflow-hidden">
                {suggestions.map((p) => {
                  const isLow = p.stock <= 10;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onMouseDown={() => selectSuggestion(p)}
                        className="w-full text-left px-4 py-3 hover:bg-primary-container/10 transition-colors flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{p.name}</p>
                          <p className="text-[11px] text-on-surface/50 font-mono">{p.sku}</p>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${isLow ? "bg-error/10 text-error" : "bg-primary/10 text-primary"}`}>
                          {p.stock} und.
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* No results */}
            {showSuggestions && query.length >= 1 && suggestions.length === 0 && (
              <div className="absolute z-40 top-full left-0 right-0 mt-1 bg-surface-container-low border border-outline-variant/20 rounded-xl shadow-xl px-4 py-3">
                <p className="text-xs text-on-surface/50">Sin resultados para &ldquo;{query}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Selected indicator */}
          {selectedProduct && (
            <p className="text-[11px] text-primary font-semibold mt-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              {selectedProduct.name} — Stock actual: {selectedProduct.stock}
            </p>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label className="block font-body text-xs font-semibold text-on-surface-variant mb-1 uppercase tracking-wider">
            Cantidad a Añadir
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">remove</span>
            </button>
            <input
              className="w-16 text-center bg-transparent border-0 border-b border-outline-variant/40 focus:border-b-2 focus:border-primary focus:ring-0 py-1 font-headline font-bold text-lg outline-none"
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            />
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStockUpdate}
          className="w-full bg-gradient-cta text-white font-body font-semibold py-3 rounded-xl mt-4 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow cursor-pointer"
        >
          Actualizar Stock
        </button>
      </div>
    </div>
  );
}

// ─── Main Manager ─────────────────────────────────────────────────────────────
export default function InventoryManager({
  initialProducts,
  categories,
  stats,
  distribution,
}: {
  initialProducts: ProductWithCategory[];
  categories: any[];
  stats: any;
  distribution: any[];
}) {
  const [filterCategory, setFilterCategory] = useState<string>("Todos");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);

  const filteredProducts = initialProducts.filter((p) =>
    filterCategory === "Todos" ? true : p.categories?.name === filterCategory
  );

  const openAdd = () => { setEditingProduct(null); setIsDrawerOpen(true); };
  const openEdit = (p: ProductWithCategory) => { setEditingProduct(p); setIsDrawerOpen(true); };
  const handleDelete = async (id: string) => {
    if (window.confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) {
      await removeProductAction(id);
    }
  };

  return (
    <>
      <ProductDrawer
        isOpen={isDrawerOpen}
        editingProduct={editingProduct}
        categories={categories}
        onClose={() => setIsDrawerOpen(false)}
        onSaved={() => setIsDrawerOpen(false)}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <span className="font-body text-xs font-bold uppercase tracking-[0.05em] text-primary block mb-2">
            Catálogo
          </span>
          <div className="flex items-center gap-4">
            <h2 className="font-headline text-4xl lg:text-5xl font-extrabold tracking-tight text-on-surface">
              Inventario
            </h2>
            <button
              onClick={openAdd}
              className="bg-primary text-on-primary hover:bg-primary/90 transition-colors px-4 py-2 rounded-lg font-body text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Agregar Producto
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { icon: "inventory", color: "text-primary", bg: "bg-primary-container/20", label: "Total Productos", value: stats.totalProducts.toLocaleString("es-PE") },
          { icon: "warning", color: "text-error", bg: "bg-error-container/40", label: "Stock Crítico", value: stats.criticalStock },
          { icon: "category", color: "text-tertiary", bg: "bg-tertiary-container/20", label: "Categorías", value: stats.totalCategories },
        ].map(({ icon, color, bg, label, value }) => (
          <div key={label} className="bg-surface-container-low rounded-2xl p-6 relative overflow-hidden group shadow-sm border border-outline-variant/10 hover:shadow-md transition-shadow">
            <div className={`absolute top-0 right-0 w-32 h-32 ${bg} rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110`} />
            <span className={`material-symbols-outlined ${color} mb-4 block text-3xl relative z-10`}>{icon}</span>
            <h3 className="font-body text-sm text-on-surface-variant mb-1 relative z-10">{label}</h3>
            <p className="font-headline text-3xl font-bold text-on-surface relative z-10">{value}</p>
          </div>
        ))}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Product List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
            <h3 className="font-headline font-bold text-xl text-on-surface">
              Todos los Productos ({filteredProducts.length})
            </h3>
            <div className="flex flex-col gap-2 items-end">
              <span className="text-xs font-semibold text-on-surface/50 uppercase tracking-wider">Filtrar</span>
              <div className="flex gap-2 flex-wrap justify-end">
                <button
                  onClick={() => setFilterCategory("Todos")}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full font-body text-xs font-bold transition-colors cursor-pointer ${filterCategory === "Todos" ? "bg-primary-container text-on-primary-container shadow-sm" : "bg-surface-container-highest text-on-surface hover:bg-surface-container-high"}`}
                >
                  Todos
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(cat.name)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full font-body text-xs font-bold transition-colors cursor-pointer ${filterCategory === cat.name ? "bg-primary-container text-on-primary-container shadow-sm" : "bg-surface-container-highest text-on-surface hover:bg-surface-container-high"}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-2 shadow-sm border border-outline-variant/10 max-h-[600px] overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <p className="py-12 text-center text-on-surface/40 font-body text-sm">
                No hay productos en esta categoría.
              </p>
            ) : (
              filteredProducts.map((product) => {
                const isLow = product.stock <= 10;
                return (
                  <div
                    key={product.id}
                    className="group flex items-center justify-between p-4 rounded-xl hover:bg-primary-container/5 transition-colors relative border-b border-outline-variant/10 last:border-0"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-left rounded-l-xl" />
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl text-on-surface/30">inventory_2</span>
                      </div>
                      <div>
                        <h4 className="font-headline font-bold text-on-surface text-base">{product.name}</h4>
                        <p className="font-body text-xs text-on-surface-variant flex items-center gap-2 mt-0.5">
                          <span className="bg-surface-container px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase">
                            {product.categories?.name ?? "—"}
                          </span>
                          SKU: {product.sku}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-headline font-bold text-on-surface text-lg">
                          S/ {product.price.toFixed(2)}
                        </p>
                        <p className={`font-body text-xs font-medium mt-0.5 flex items-center justify-end gap-1 ${isLow ? "text-error" : "text-primary"}`}>
                          <span className={`w-2 h-2 rounded-full inline-block ${isLow ? "bg-error" : "bg-primary"}`} />
                          {product.stock} en stock
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(product)}
                          className="text-on-surface/50 hover:text-primary cursor-pointer p-1"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-on-surface/50 hover:text-error cursor-pointer p-1"
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="lg:col-span-4 space-y-8">
          <QuickStockPanel products={initialProducts} />

          {/* Distribution */}
          <div className="bg-surface-container-low rounded-2xl p-6 relative overflow-hidden shadow-sm border border-outline-variant/10">
            <div className="absolute -right-8 -bottom-8 opacity-5">
              <span className="material-symbols-outlined text-[120px]">pie_chart</span>
            </div>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-2 relative z-10">Distribución</h3>
            <p className="font-body text-sm text-on-surface-variant mb-6 relative z-10">
              Desglose del inventario por categoría.
            </p>
            <div className="space-y-4 relative z-10">
              {distribution.map((item) => (
                <div key={item.category}>
                  <div className="flex justify-between text-xs font-body font-medium mb-1">
                    <span className="text-on-surface">{item.category}</span>
                    <span className="text-primary-container">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary-container h-1.5 rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
