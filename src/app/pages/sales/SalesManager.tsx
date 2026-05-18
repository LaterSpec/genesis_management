"use client";

import React, { useState, useMemo, useCallback } from "react";
import type { Client, MembershipPlan, PaymentMethod } from "@/lib/database.types";
import type { ProductWithCategory } from "@/lib/api/inventory.api";
import type { CartItem } from "@/lib/api/sales.api";
import { processSaleAction } from "./actions";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  products: ProductWithCategory[];
  plans: MembershipPlan[];
  clients: Client[];
  visitorId: string;
}

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: "efectivo", label: "Efectivo", icon: "payments" },
  { value: "tarjeta", label: "Tarjeta", icon: "credit_card" },
  { value: "yape", label: "Yape", icon: "qr_code_2" },
];

// ─── SuccessModal ─────────────────────────────────────────────────────────────
function SuccessModal({
  saleId,
  total,
  paymentMethod,
  onNew,
}: {
  saleId: string;
  total: number;
  paymentMethod: PaymentMethod;
  onNew: () => void;
}) {
  const pm = PAYMENT_OPTIONS.find((p) => p.value === paymentMethod)!;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-surface-container-low rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl flex flex-col items-center text-center gap-5 animate-[fadeInUp_0.4s_ease]">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <span
            className="material-symbols-outlined text-5xl text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </div>
        <div>
          <h3 className="font-headline font-extrabold text-2xl text-on-surface mb-1">
            ¡Venta completada!
          </h3>
          <p className="font-body text-sm text-on-surface/60">
            Venta #{saleId.toString().slice(-6).toUpperCase()}
          </p>
        </div>
        <div className="w-full bg-surface-container rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="font-body text-sm text-on-surface/60">Total cobrado</span>
            <span className="font-headline font-extrabold text-2xl text-primary">
              ${total.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-body text-sm text-on-surface/60">Método de pago</span>
            <span className="flex items-center gap-1.5 font-body text-sm font-semibold text-on-surface">
              <span className="material-symbols-outlined text-[16px]">{pm.icon}</span>
              {pm.label}
            </span>
          </div>
        </div>
        <button
          onClick={onNew}
          className="w-full bg-gradient-cta text-white rounded-full py-4 font-body font-semibold text-base shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined">add_shopping_cart</span>
          Nueva Venta
        </button>
      </div>
    </div>
  );
}

// ─── SalesManager ─────────────────────────────────────────────────────────────
export default function SalesManager({ products, plans, clients, visitorId }: Props) {
  const [selectedClientId, setSelectedClientId] = useState<string>(visitorId);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("Todos");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [isPending, setIsPending] = useState(false);
  const [successData, setSuccessData] = useState<{ saleId: string; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const isVisitor = selectedClientId === visitorId;

  // Categories derived from products
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.categories?.name ?? "Sin categoría"));
    return Array.from(set);
  }, [products]);

  // Filtered products/plans
  const visibleProducts = useMemo(() => {
    if (categoryFilter === "Todos" || categoryFilter === "Membresías") return products;
    if (categoryFilter === "Membresías") return [];
    return products.filter((p) => p.categories?.name === categoryFilter);
  }, [products, categoryFilter]);

  const showPlans = categoryFilter === "Todos" || categoryFilter === "Membresías";

  // Client autocomplete
  const clientSuggestions = useMemo(() => {
    if (!clientSearch) return [];
    const q = clientSearch.toLowerCase();
    return clients
      .filter(
        (c) =>
          c.id !== visitorId &&
          (`${c.first_name} ${c.last_name}`.toLowerCase().includes(q) || c.dni.includes(q))
      )
      .slice(0, 5);
  }, [clients, clientSearch, visitorId]);

  const selectClient = (c: Client) => {
    setSelectedClientId(c.id);
    setClientSearch(`${c.first_name} ${c.last_name}`);
    setShowClientDropdown(false);
  };

  const clearClient = () => {
    setSelectedClientId(visitorId);
    setClientSearch("");
    setShowClientDropdown(false);
  };

  // Cart helpers
  const cartTotal = useMemo(
    () => cart.reduce((s, i) => s + i.quantity * i.unit_price, 0),
    [cart]
  );

  const addProduct = useCallback(
    (product: ProductWithCategory) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.type === "product" && i.product_id === product.id);
        if (existing) {
          if (existing.quantity >= product.stock) return prev;
          return prev.map((i) =>
            i.type === "product" && i.product_id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }
        return [
          ...prev,
          {
            type: "product",
            product_id: product.id,
            name: product.name,
            quantity: 1,
            unit_price: product.price,
            stock: product.stock,
          },
        ];
      });
    },
    []
  );

  const addPlan = useCallback(
    (plan: MembershipPlan) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.type === "plan" && i.plan_id === plan.id);
        if (existing) return prev;
        return [
          ...prev,
          {
            type: "plan",
            plan_id: plan.id,
            plan_duration_days: plan.duration_days,
            name: plan.name,
            quantity: 1,
            unit_price: plan.price,
          },
        ];
      });
    },
    []
  );

  const updateQty = (idx: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item, i) => {
          if (i !== idx) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null as unknown as CartItem;
          if (item.type === "product" && item.stock && newQty > item.stock) return item;
          return { ...item, quantity: newQty };
        })
        .filter(Boolean)
    );
  };

  const updatePrice = (idx: number, value: string) => {
    const price = parseFloat(value);
    if (isNaN(price) || price < 0) return;
    setCart((prev) => prev.map((item, i) => (i === idx ? { ...item, unit_price: price } : item)));
  };

  const removeItem = (idx: number) => setCart((prev) => prev.filter((_, i) => i !== idx));

  // Quick daily pass
  const handleDailyPass = () => {
    const daily = plans.find((p) => p.duration_days === 1);
    if (!daily) return;
    setSelectedClientId(visitorId);
    setClientSearch("");
    setCart([
      {
        type: "plan",
        plan_id: daily.id,
        plan_duration_days: daily.duration_days,
        name: daily.name,
        quantity: 1,
        unit_price: daily.price,
      },
    ]);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsPending(true);
    setErrorMsg(null);
    try {
      const result = await processSaleAction(selectedClientId, cart, paymentMethod, isVisitor);
      if (result.success && result.saleId) {
        setSuccessData({ saleId: result.saleId, total: result.total ?? cartTotal });
      } else {
        setErrorMsg(result.error ?? "Error al procesar la venta.");
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleNewSale = () => {
    setCart([]);
    setSelectedClientId(visitorId);
    setClientSearch("");
    setPaymentMethod("efectivo");
    setSuccessData(null);
    setErrorMsg(null);
  };

  const inputCls =
    "w-full bg-surface-container rounded-lg px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface/30";

  return (
    <>
      {successData && (
        <SuccessModal
          saleId={successData.saleId}
          total={successData.total}
          paymentMethod={paymentMethod}
          onNew={handleNewSale}
        />
      )}

      {/* Page header */}
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight">
              Punto de Venta
            </h2>
            <p className="font-body text-secondary text-sm mt-1">
              Selecciona productos o membresías para agregar a la cuenta actual.
            </p>
          </div>
          {/* Quick daily pass */}
          <button
            onClick={handleDailyPass}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-body font-semibold text-sm hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              door_open
            </span>
            Ingreso por Día
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
        {/* ── Left: Catalog ── */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Category filters */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {["Todos", "Membresías", ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-5 py-2 rounded-full font-body font-semibold text-sm whitespace-nowrap cursor-pointer transition-colors ${
                  categoryFilter === cat
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-container-high text-on-surface/70 hover:bg-surface-container"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product/Plan grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {/* Plans */}
            {showPlans &&
              plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => addPlan(plan)}
                  className="bg-gradient-to-br from-primary/5 to-primary-container/10 border border-primary/10 rounded-[2rem] p-6 flex flex-col gap-3 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span
                        className="material-symbols-outlined text-2xl text-primary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {plan.duration_days <= 1 ? "door_open" : "card_membership"}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      {plan.duration_days === 1
                        ? "1 día"
                        : plan.duration_days >= 365
                        ? "1 año"
                        : `${plan.duration_days} días`}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-base text-on-surface">{plan.name}</h3>
                    <p className="font-body text-xs text-on-surface/50 line-clamp-1">
                      {plan.description ?? `Acceso por ${plan.duration_days} día(s)`}
                    </p>
                  </div>
                  <span className="font-headline font-extrabold text-2xl text-on-surface">
                    ${Number(plan.price).toFixed(2)}
                  </span>
                </button>
              ))}

            {/* Products */}
            {(categoryFilter !== "Membresías") &&
              visibleProducts.map((product) => {
                const cartItem = cart.find(
                  (i) => i.type === "product" && i.product_id === product.id
                );
                const inCart = cartItem?.quantity ?? 0;
                const noStock = product.stock === 0;
                const maxReached = inCart >= product.stock;
                const isLow = product.stock <= 10 && product.stock > 0;

                return (
                  <button
                    key={product.id}
                    onClick={() => !noStock && !maxReached && addProduct(product)}
                    disabled={noStock || maxReached}
                    className={`bg-surface-container-low border border-outline-variant/10 rounded-[2rem] p-5 flex flex-col gap-3 text-left transition-all group ${
                      noStock || maxReached
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                    }`}
                  >
                    <div className="w-full h-24 rounded-xl bg-surface-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-on-surface/20">
                        inventory_2
                      </span>
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-sm text-on-surface">{product.name}</h3>
                      <span className="font-body text-[10px] font-semibold uppercase tracking-wide bg-surface-container px-2 py-0.5 rounded text-on-surface/50">
                        {product.categories?.name ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-headline font-extrabold text-lg text-primary">
                        ${product.price.toFixed(2)}
                      </span>
                      <div className="flex flex-col items-end">
                        {isLow && (
                          <span className="text-[10px] text-error font-semibold">
                            Stock: {product.stock}
                          </span>
                        )}
                        {inCart > 0 && (
                          <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                            {inCart} en carrito
                          </span>
                        )}
                        {noStock && (
                          <span className="text-[10px] text-error font-semibold">Sin stock</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* ── Right: Cart ── */}
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <div className="bg-surface-container-low rounded-[2.5rem] p-7 flex flex-col shadow-[0_40px_80px_-20px_rgba(20,27,43,0.08)] border border-outline-variant/10">
            {/* Client selector */}
            <div className="mb-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface/40 mb-2">
                Cliente
              </p>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/30 text-[18px] pointer-events-none">
                  person_search
                </span>
                <input
                  value={clientSearch}
                  onChange={(e) => {
                    setClientSearch(e.target.value);
                    setShowClientDropdown(true);
                    if (!e.target.value) clearClient();
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  placeholder="Buscar cliente…"
                  className="w-full bg-surface-container rounded-xl pl-10 pr-10 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface/30"
                />
                {!isVisitor && (
                  <button
                    onClick={clearClient}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface/30 hover:text-error transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
                {showClientDropdown && clientSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-low rounded-xl shadow-xl border border-outline-variant/10 z-20 overflow-hidden">
                    {clientSuggestions.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectClient(c)}
                        className="w-full px-4 py-3 text-left hover:bg-surface-container transition-colors flex items-center gap-3 cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {c.first_name[0]}{c.last_name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-on-surface">
                            {c.first_name} {c.last_name}
                          </p>
                          <p className="text-xs text-on-surface/40">{c.dni}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isVisitor ? "bg-amber-400" : "bg-primary"}`} />
                <span className="font-body text-xs text-on-surface/60">
                  {isVisitor
                    ? "Visitante"
                    : `${selectedClient?.first_name} ${selectedClient?.last_name} · ${selectedClient?.dni}`}
                </span>
              </div>
            </div>

            {/* Cart header */}
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-headline font-bold text-lg text-on-surface">Resumen</h3>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-secondary hover:text-error transition-colors text-xs font-body flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Vaciar
                </button>
              )}
            </div>

            {/* Cart items */}
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="material-symbols-outlined text-5xl text-on-surface/15 mb-3">
                  shopping_cart
                </span>
                <p className="font-body text-xs text-on-surface/30">
                  El carrito está vacío.
                  <br />
                  Selecciona un producto o membresía.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1 mb-4">
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-surface-container rounded-2xl p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="material-symbols-outlined text-[18px] text-primary"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {item.type === "plan" ? "card_membership" : "inventory_2"}
                        </span>
                        <span className="font-body text-sm font-semibold text-on-surface leading-tight">
                          {item.name}
                        </span>
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-on-surface/30 hover:text-error transition-colors shrink-0 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      {/* Qty (only products) */}
                      {item.type === "product" ? (
                        <div className="flex items-center gap-1 bg-surface-container-high rounded-lg px-1 py-0.5">
                          <button
                            onClick={() => updateQty(idx, -1)}
                            className="w-6 h-6 flex items-center justify-center text-on-surface/60 hover:text-primary transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">remove</span>
                          </button>
                          <span className="font-body font-bold text-sm text-on-surface min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(idx, 1)}
                            disabled={!!(item.stock && item.quantity >= item.stock)}
                            className="w-6 h-6 flex items-center justify-center text-on-surface/60 hover:text-primary transition-colors disabled:opacity-30 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">add</span>
                          </button>
                        </div>
                      ) : (
                        <span className="font-body text-xs text-on-surface/40 italic">1 plan</span>
                      )}

                      {/* Fixed price */}
                      <div className="flex items-center gap-1">
                        <span className="font-body text-xs text-on-surface/40">$</span>
                        <span className="w-20 bg-surface-container-high rounded-lg px-2 py-1 text-sm font-bold text-on-surface text-right">
                          {Number(item.unit_price).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-body text-xs text-on-surface/50">
                        Subtotal:{" "}
                        <span className="font-bold text-on-surface">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payment method */}
            <div className="mb-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface/40 mb-2">
                Método de Pago
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPaymentMethod(opt.value)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold font-body transition-all cursor-pointer border ${
                      paymentMethod === opt.value
                        ? "bg-primary/10 border-primary text-primary shadow-sm"
                        : "bg-surface-container border-transparent text-on-surface/60 hover:border-outline-variant/30"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {errorMsg && (
              <div className="mb-4 bg-error/10 border border-error/20 rounded-xl p-3 text-xs text-error font-body">
                {errorMsg}
              </div>
            )}

            {/* Total & checkout */}
            <div className="pt-5 border-t border-outline-variant/10 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="font-body text-secondary text-sm">Total</span>
                <span className="font-headline font-extrabold text-2xl text-on-surface">
                  ${cartTotal.toFixed(2)}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isPending}
                className="w-full bg-gradient-cta text-white rounded-full py-4 font-body font-semibold text-base shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Procesando…
                  </>
                ) : (
                  <>
                    Finalizar Venta
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
