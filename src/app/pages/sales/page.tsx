import React from "react";
import { getProducts, getCategories } from "@/lib/api/inventory.api";
import { getMembershipPlans } from "@/lib/api/clients.api";
import type { ProductWithCategory } from "@/lib/api/inventory.api";
import type { MembershipPlan } from "@/lib/database.types";

// ─── Server Component (async) ─────────────────────────────────────────────────
export default async function SalesPage() {
  const [products, categories, plans] = await Promise.all([
    getProducts(),
    getCategories(),
    getMembershipPlans(),
  ]);

  return (
    <>
      {/* Page Title */}
      <div className="flex flex-col gap-2 mb-8">
        <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight">
          Punto de Venta
        </h2>
        <p className="font-body text-secondary text-sm">
          Selecciona productos o membresías para agregar a la cuenta actual.
        </p>
      </div>

      {/* POS Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
        {/* Left Canvas: Product Selection */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Categories */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button className="px-6 py-2 rounded-full bg-primary/10 text-primary font-body font-semibold text-sm whitespace-nowrap cursor-pointer">
              Todos
            </button>
            <button className="px-6 py-2 rounded-full bg-surface-container-high text-on-surface font-body font-semibold text-sm whitespace-nowrap cursor-pointer hover:bg-surface-container transition-colors">
              Suscripciones
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className="px-6 py-2 rounded-full bg-surface-container-high text-on-surface font-body font-semibold text-sm whitespace-nowrap cursor-pointer hover:bg-surface-container transition-colors"
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Featured Membership Plans */}
            {plans.map((plan) => (
              <MembershipPlanCard key={plan.id} plan={plan} />
            ))}

            {/* Products */}
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* Right Canvas: Cart & Checkout */}
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <div className="bg-surface-container-lowest rounded-[2.5rem] p-8 flex flex-col shadow-[0_40px_80px_-20px_rgba(20,27,43,0.08)] border border-outline-variant/10 h-fit">
            {/* Cart Header */}
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-headline font-bold text-xl text-on-surface">Resumen</h3>
              <button className="text-secondary hover:text-error transition-colors text-sm font-body flex items-center gap-1 cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Vaciar
              </button>
            </div>

            {/* Empty Cart State */}
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="material-symbols-outlined text-5xl text-on-surface/20 mb-3">
                shopping_cart
              </span>
              <p className="font-body text-sm text-on-surface/40">
                El carrito está vacío.
                <br />
                Selecciona un producto o membresía.
              </p>
            </div>

            {/* Checkout Footer */}
            <div className="pt-8 border-t border-outline-variant/10 flex flex-col gap-4 mt-auto">
              <div className="flex justify-between items-center">
                <span className="font-body text-secondary text-sm">Subtotal</span>
                <span className="font-headline font-semibold text-on-surface">$0.00</span>
              </div>
              <button
                className="w-full bg-gradient-cta text-white rounded-full py-4 mt-4 font-body font-semibold text-lg shadow-lg shadow-primary/20 opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
                disabled
              >
                Finalizar Venta
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Sub-componentes puros ─────────────────────────────────────────────────────
function MembershipPlanCard({ plan }: { plan: MembershipPlan }) {
  const isFeatured = plan.duration_days >= 30;
  if (!isFeatured) return null; // solo mostrar planes mensuales o más

  return (
    <div className="col-span-1 sm:col-span-2 xl:col-span-2 bg-surface-container-lowest rounded-[2rem] p-8 flex flex-col sm:flex-row gap-6 items-center hover:bg-surface-container-low transition-all group cursor-pointer border border-outline-variant/10 shadow-sm hover:shadow-md">
      <div className="w-24 h-24 rounded-2xl bg-primary-container/20 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          card_membership
        </span>
      </div>
      <div className="flex-1 text-center sm:text-left">
        <span className="font-body text-[11px] uppercase tracking-widest text-primary font-bold mb-1 block">
          Plan de Membresía
        </span>
        <h3 className="font-headline font-bold text-2xl text-on-surface mb-2">{plan.name}</h3>
        <p className="font-body text-sm text-secondary line-clamp-2">
          {plan.description ?? `Acceso por ${plan.duration_days} días.`}
        </p>
      </div>
      <div className="flex flex-col items-center sm:items-end gap-3 shrink-0">
        <span className="font-headline font-extrabold text-3xl text-on-surface">
          ${plan.price.toFixed(2)}
        </span>
        <button className="bg-primary text-white p-3 rounded-full shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: ProductWithCategory }) {
  const isLowStock = product.stock <= 10;

  return (
    <div className="bg-surface-container-lowest rounded-[2rem] p-6 flex flex-col gap-4 hover:bg-surface-container-low transition-all group cursor-pointer border border-outline-variant/10 shadow-sm hover:shadow-md">
      <div className="w-full h-32 rounded-2xl bg-surface-container flex items-center justify-center overflow-hidden">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">
          inventory_2
        </span>
      </div>
      <div>
        <h3 className="font-headline font-bold text-lg text-on-surface">{product.name}</h3>
        <span className="font-body text-[10px] font-semibold tracking-wide uppercase bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
          {product.categories?.name ?? "—"}
        </span>
        <span className="font-headline font-extrabold text-xl text-primary mt-1 block">
          ${product.price.toFixed(2)}
        </span>
        {isLowStock && (
          <span className="font-body text-xs text-error font-medium">
            Stock bajo: {product.stock} unidades
          </span>
        )}
      </div>
      <button
        className="w-full mt-auto py-3 bg-primary/5 text-primary font-body font-semibold text-sm rounded-xl group-hover:bg-primary group-hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={product.stock === 0}
      >
        {product.stock === 0 ? "Sin stock" : "Agregar"}
      </button>
    </div>
  );
}
