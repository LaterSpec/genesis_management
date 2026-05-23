"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { MembershipPlan } from "@/lib/database.types";
import type { MembershipWithRelations } from "@/lib/api/clients.api";
import {
  addPlanAction,
  editPlanAction,
  removePlanAction,
  cancelMembershipAction,
} from "./actions";

// ─── PlanDrawer ────────────────────────────────────────────────────────────────
interface PlanDrawerProps {
  isOpen: boolean;
  editingPlan: MembershipPlan | null;
  onClose: () => void;
  onSaved: () => void;
}

function PlanDrawer({ isOpen, editingPlan, onClose, onSaved }: PlanDrawerProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const initial = editingPlan
    ? {
        name: editingPlan.name,
        description: editingPlan.description ?? "",
        price: String(editingPlan.price),
        duration_days: String(editingPlan.duration_days),
      }
    : { name: "", description: "", price: "", duration_days: "" };

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimating(true)));
      setIsDirty(false);
    } else {
      setAnimating(false);
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const checkDirty = useCallback(() => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const changed = (Object.keys(initial) as (keyof typeof initial)[]).some(
      (k) => (fd.get(k) ?? "") !== initial[k]
    );
    setIsDirty(changed);
  }, [initial]);

  const requestClose = () => {
    if (isDirty && !window.confirm("¿Salir sin guardar los cambios?")) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setIsPending(true);
    try {
      const data = {
        name: fd.get("name") as string,
        description: (fd.get("description") as string) || null,
        price: parseFloat(fd.get("price") as string),
        duration_days: parseInt(fd.get("duration_days") as string, 10),
      };
      if (editingPlan) {
        await editPlanAction(editingPlan.id, data);
      } else {
        await addPlanAction(data);
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
      <div
        onClick={requestClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: animating ? 1 : 0 }}
      />
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
              {editingPlan ? "Editar Plan" : "Nuevo Plan de Membresía"}
            </h3>
            {isDirty && (
              <p className="text-[11px] text-primary/80 font-semibold mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                Cambios sin guardar
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
          {/* Nombre del Plan */}
          <div>
            <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
              Nombre del Plan
            </label>
            <input
              required
              name="name"
              defaultValue={initial.name}
              className={inputCls}
              placeholder="Ej. Plan Mensual, Pase Diario…"
            />
          </div>

          {/* Precio y Duración (en grid) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
                Precio (S/)
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                name="price"
                defaultValue={initial.price}
                className={inputCls}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
                Duración (días)
              </label>
              <input
                required
                type="number"
                min="1"
                name="duration_days"
                defaultValue={initial.duration_days}
                className={inputCls}
                placeholder="30"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
              Descripción <span className="text-on-surface/30 normal-case">(opcional)</span>
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={initial.description}
              className={`${inputCls} resize-none`}
              placeholder="Describe los beneficios del plan…"
            />
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
              ) : editingPlan ? (
                "Guardar Cambios"
              ) : (
                "Crear Plan"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: {
      label: "Activa",
      cls: "bg-primary/10 text-primary",
    },
    expired: {
      label: "Vencida",
      cls: "bg-error/10 text-error",
    },
    cancelled: {
      label: "Cancelada",
      cls: "bg-surface-container-high text-on-surface/50",
    },
  };
  const config = map[status] ?? map.cancelled;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${config.cls}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}

// ─── PlanCard ─────────────────────────────────────────────────────────────────
function PlanCard({
  plan,
  onEdit,
  onDelete,
}: {
  plan: MembershipPlan;
  onEdit: (p: MembershipPlan) => void;
  onDelete: (p: MembershipPlan) => void;
}) {
  const durationLabel =
    plan.duration_days === 1
      ? "1 día"
      : plan.duration_days < 30
      ? `${plan.duration_days} días`
      : plan.duration_days === 30
      ? "1 mes"
      : plan.duration_days === 90
      ? "3 meses"
      : plan.duration_days === 365
      ? "1 año"
      : `${plan.duration_days} días`;

  const isDaily = plan.duration_days <= 1;

  return (
    <div
      className={`relative rounded-[2rem] p-8 flex flex-col gap-4 border transition-all group hover:shadow-xl hover:-translate-y-1 ${
        isDaily
          ? "bg-surface-container-low border-outline-variant/20"
          : "bg-gradient-to-br from-primary/5 to-primary-container/10 border-primary/10"
      }`}
    >
      {/* Icon & duration badge */}
      <div className="flex items-start justify-between">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            isDaily ? "bg-surface-container" : "bg-primary/10"
          }`}
        >
          <span
            className="material-symbols-outlined text-3xl text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {isDaily ? "door_open" : "card_membership"}
          </span>
        </div>
        <span className="font-body text-[11px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
          {durationLabel}
        </span>
      </div>

      {/* Name & description */}
      <div>
        <h3 className="font-headline font-bold text-xl text-on-surface mb-1">{plan.name}</h3>
        <p className="font-body text-sm text-on-surface/60 line-clamp-2">
          {plan.description ?? `Acceso por ${durationLabel}.`}
        </p>
      </div>

      {/* Price */}
      <div className="mt-auto">
        <span className="font-headline font-extrabold text-4xl text-on-surface">
          S/ {Number(plan.price).toFixed(2)}
        </span>
        <span className="font-body text-sm text-on-surface/40 ml-2">/ {durationLabel}</span>
      </div>

      {/* Actions (visible on hover) */}
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pt-2 border-t border-outline-variant/10">
        <button
          onClick={() => onEdit(plan)}
          className="flex-1 py-2 rounded-xl bg-surface-container text-on-surface/70 hover:text-primary hover:bg-primary/5 text-sm font-semibold font-body transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
          Editar
        </button>
        <button
          onClick={() => onDelete(plan)}
          className="flex-1 py-2 rounded-xl bg-surface-container text-on-surface/70 hover:text-error hover:bg-error/5 text-sm font-semibold font-body transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
          Eliminar
        </button>
      </div>
    </div>
  );
}

// ─── MembershipsManager (Main) ────────────────────────────────────────────────
export default function MembershipsManager({
  initialPlans,
  initialMemberships,
}: {
  initialPlans: MembershipPlan[];
  initialMemberships: MembershipWithRelations[];
}) {
  const [activeTab, setActiveTab] = useState<"plans" | "records">("plans");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

  // Stats for header cards
  const activeMemberships = useMemo(
    () => initialMemberships.filter((m) => m.status === "active").length,
    [initialMemberships]
  );
  const expiredMemberships = useMemo(
    () => initialMemberships.filter((m) => m.status === "expired").length,
    [initialMemberships]
  );

  // Filtered memberships
  const filtered = useMemo(() => {
    return initialMemberships.filter((m) => {
      const matchesStatus =
        statusFilter === "Todos" ||
        (statusFilter === "Activas" && m.status === "active") ||
        (statusFilter === "Vencidas" && m.status === "expired") ||
        (statusFilter === "Canceladas" && m.status === "cancelled");

      if (!matchesStatus) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      const client = m.clients;
      return (
        client?.first_name?.toLowerCase().includes(q) ||
        client?.last_name?.toLowerCase().includes(q) ||
        client?.dni?.toLowerCase().includes(q) ||
        m.membership_plans?.name?.toLowerCase().includes(q)
      );
    });
  }, [initialMemberships, search, statusFilter]);

  const openAdd = () => {
    setEditingPlan(null);
    setIsDrawerOpen(true);
  };

  const openEdit = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (plan: MembershipPlan) => {
    if (!window.confirm(`¿Eliminar el plan "${plan.name}"? Esta acción no se puede deshacer.`))
      return;
    await removePlanAction(plan.id);
  };

  const handleCancelMembership = async (id: string, clientName: string) => {
    if (!window.confirm(`¿Cancelar la membresía de ${clientName}?`)) return;
    await cancelMembershipAction(id);
  };

  return (
    <>
      <PlanDrawer
        isOpen={isDrawerOpen}
        editingPlan={editingPlan}
        onClose={() => setIsDrawerOpen(false)}
        onSaved={() => setIsDrawerOpen(false)}
      />

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-2">
            Membresías
          </h2>
          <p className="text-on-surface/60 font-body text-sm max-w-lg">
            Administra los planes disponibles y el estado de membresías de los clientes del gimnasio.
          </p>
        </div>
        {activeTab === "plans" && (
          <button
            onClick={openAdd}
            className="bg-gradient-cta text-white rounded-full py-3 px-8 font-label font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 whitespace-nowrap shadow-[0_8px_16px_rgba(16,185,129,0.2)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              add_card
            </span>
            Nuevo Plan
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-surface-container-low rounded-2xl p-1.5 mb-8 w-fit">
        {(["plans", "records"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl font-body font-semibold text-sm transition-all cursor-pointer ${
              activeTab === tab
                ? "bg-surface-container-low text-primary shadow-sm"
                : "text-on-surface/60 hover:text-on-surface"
            }`}
          >
            {tab === "plans" ? (
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">style</span>
                Planes disponibles
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">list_alt</span>
                Registro de membresías
                <span className="bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {activeMemberships}
                </span>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Planes ── */}
      {activeTab === "plans" && (
        <div>
          {initialPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="material-symbols-outlined text-6xl text-on-surface/20 mb-4">
                card_membership
              </span>
              <p className="font-body text-on-surface/40 text-sm">
                No hay planes registrados. Crea el primero.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {initialPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Registro ── */}
      {activeTab === "records" && (
        <div>
          {/* Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10 shadow-sm">
              <p className="text-[11px] uppercase tracking-widest text-on-surface/40 font-bold mb-1">Activas</p>
              <span className="font-headline text-3xl font-extrabold text-primary">{activeMemberships}</span>
            </div>
            <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10 shadow-sm">
              <p className="text-[11px] uppercase tracking-widest text-on-surface/40 font-bold mb-1">Vencidas</p>
              <span className="font-headline text-3xl font-extrabold text-error">{expiredMemberships}</span>
            </div>
            <div className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10 shadow-sm flex flex-col gap-2">
              {/* Search */}
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/30 pointer-events-none text-[18px]">
                  search
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o DNI…"
                  className="w-full bg-surface-container rounded-xl pl-9 pr-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface/30"
                />
              </div>
            </div>
          </div>

          {/* Status filter */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {["Todos", "Activas", "Vencidas", "Canceladas"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold font-body transition-all cursor-pointer ${
                  statusFilter === f
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-container text-on-surface/60 hover:bg-surface-container-high"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="py-4 px-6 font-label text-xs font-semibold text-on-surface/60 uppercase tracking-wider">Cliente</th>
                    <th className="py-4 px-6 font-label text-xs font-semibold text-on-surface/60 uppercase tracking-wider">Plan</th>
                    <th className="py-4 px-6 font-label text-xs font-semibold text-on-surface/60 uppercase tracking-wider">Inicio</th>
                    <th className="py-4 px-6 font-label text-xs font-semibold text-on-surface/60 uppercase tracking-wider">Vencimiento</th>
                    <th className="py-4 px-6 font-label text-xs font-semibold text-on-surface/60 uppercase tracking-wider">Estado</th>
                    <th className="py-4 px-6 font-label text-xs font-semibold text-on-surface/60 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low/50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-on-surface/40 font-body text-sm">
                        No se encontraron membresías.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((m) => {
                      const client = m.clients;
                      const clientName = client
                        ? `${client.first_name} ${client.last_name}`
                        : "—";
                      const initials = client
                        ? `${client.first_name[0]}${client.last_name[0]}`.toUpperCase()
                        : "?";
                      const endDate = new Date(m.end_date);
                      const daysLeft = Math.ceil(
                        (endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                      );
                      const isExpiringSoon = m.status === "active" && daysLeft <= 5 && daysLeft >= 0;

                      return (
                        <tr
                          key={m.id}
                          className="group hover:bg-primary-container/5 transition-colors"
                        >
                          {/* Cliente */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-surface-container-high shrink-0 flex items-center justify-center text-primary font-bold text-xs">
                                {initials}
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-on-surface">{clientName}</p>
                                <p className="text-xs text-on-surface/40 font-body">{client?.dni ?? "—"}</p>
                              </div>
                            </div>
                          </td>
                          {/* Plan */}
                          <td className="py-4 px-6 font-body text-sm text-on-surface/80">
                            {m.membership_plans?.name ?? "—"}
                          </td>
                          {/* Inicio */}
                          <td className="py-4 px-6 font-body text-sm text-on-surface/60">
                            {new Date(m.start_date).toLocaleDateString("es-PE", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          {/* Vencimiento */}
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-body text-sm text-on-surface/80">
                                {endDate.toLocaleDateString("es-PE", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                              {isExpiringSoon && (
                                <p className="text-[11px] text-amber-600 font-semibold">
                                  Vence en {daysLeft} día{daysLeft !== 1 ? "s" : ""}
                                </p>
                              )}
                            </div>
                          </td>
                          {/* Estado */}
                          <td className="py-4 px-6">
                            <StatusBadge status={m.status} />
                          </td>
                          {/* Acciones */}
                          <td className="py-4 px-6 text-right">
                            {m.status === "active" && (
                              <button
                                onClick={() => handleCancelMembership(m.id, clientName)}
                                className="p-2 text-on-surface/40 hover:text-error transition-colors cursor-pointer bg-surface-container-high rounded-full shadow-sm opacity-0 group-hover:opacity-100"
                                title="Cancelar membresía"
                              >
                                <span className="material-symbols-outlined text-[18px]">cancel</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-surface/50 border-t border-outline-variant/10">
              <p className="text-xs font-body text-on-surface/40">
                Mostrando {filtered.length} de {initialMemberships.length} membresías
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
