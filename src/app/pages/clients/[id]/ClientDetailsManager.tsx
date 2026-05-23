"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { ClientWithMembership } from "@/lib/api/clients.api";
import type { SaleWithItems } from "@/lib/api/sales.api";
import type { ClientAttendanceFull } from "@/lib/api/attendance.api";
import { updateClientNotesAction } from "./actions";

interface ClientDetailsManagerProps {
  client: ClientWithMembership;
  initialSales: SaleWithItems[];
  initialAttendances: ClientAttendanceFull[];
}

export default function ClientDetailsManager({
  client,
  initialSales,
  initialAttendances,
}: ClientDetailsManagerProps) {
  const [notes, setNotes] = useState(client.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const initials = `${client.first_name[0] || ""}${client.last_name[0] || ""}`.toUpperCase();
  
  const formattedJoinDate = new Date(client.join_date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleSaveNotes = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      await updateClientNotesAction(client.id, notes.trim() || null);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error("Error al guardar notas:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper payment method translations and icons
  const getPaymentMethodDetails = (method: string) => {
    switch (method) {
      case "efectivo":
        return { label: "Efectivo", icon: "payments", colorClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
      case "tarjeta":
        return { label: "Tarjeta", icon: "credit_card", colorClass: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
      case "yape":
        return { label: "Yape", icon: "qr_code_2", colorClass: "bg-purple-500/10 text-purple-500 border-purple-500/20" };
      default:
        return { label: method, icon: "receipt_long", colorClass: "bg-on-surface/10 text-on-surface/60 border-on-surface/20" };
    }
  };

  return (
    <>
      {/* Back navigation */}
      <div className="mb-4">
        <Link
          href="/pages/clients"
          className="inline-flex items-center gap-2 text-on-surface/60 hover:text-primary transition-all font-semibold text-sm cursor-pointer group"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
            arrow_back
          </span>
          Volver a Clientes
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-on-surface/40 font-body text-xs font-bold uppercase tracking-widest">
            Detalles de Miembro
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
          <span className="text-on-surface/40 font-body text-xs font-mono">
            ID: #{client.id.toString().slice(-6).toUpperCase()}
          </span>
        </div>
        <h2 className="font-headline text-4xl md:text-5xl font-black text-on-surface tracking-tight">
          {client.first_name} {client.last_name}
        </h2>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Profile, Locker, Notes) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Profile Details Card */}
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/5 blur-2xl pointer-events-none"></div>
            
            <div className="flex flex-col items-center text-center pb-6 border-b border-outline-variant/10">
              <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-black text-3xl shadow-inner mb-4 border border-outline-variant/20">
                {initials}
              </div>
              <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
                {client.first_name} {client.last_name}
              </h3>
              
              {client.status === "active" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container/20 text-primary-container text-xs font-bold border border-primary-container/20">
                  <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" /> Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface/50 text-xs font-bold border border-outline-variant/20">
                  <span className="w-2 h-2 rounded-full bg-on-surface/40" /> Inactivo
                </span>
              )}
            </div>

            <div className="pt-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-on-surface/40">badge</span>
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-on-surface/40 tracking-wider">Documento (DNI)</p>
                  <p className="text-sm font-semibold text-on-surface">{client.dni}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-on-surface/40">mail</span>
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-on-surface/40 tracking-wider">Correo Electrónico</p>
                  <p className="text-sm font-semibold text-on-surface break-all">{client.email ?? "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-on-surface/40">call</span>
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-on-surface/40 tracking-wider">Teléfono / WhatsApp</p>
                  <p className="text-sm font-semibold text-on-surface">{client.phone ?? "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-on-surface/40">calendar_today</span>
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-on-surface/40 tracking-wider">Fecha de Registro</p>
                  <p className="text-xs font-semibold text-on-surface/80">{formattedJoinDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Locker Block (Mock) */}
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h4 className="font-headline font-bold text-base text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-secondary">grid_view</span>
              Casillero Asignado
            </h4>
            
            <div className="flex items-center gap-4 bg-surface-container/40 p-4 rounded-2xl border border-outline-variant/20 hover:border-outline-variant/45 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-secondary-container/20 flex items-center justify-center text-secondary border border-secondary-container/30">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  lock
                </span>
              </div>
              <div>
                <p className="font-headline font-extrabold text-base text-on-surface">Casillero #24</p>
                <p className="font-body text-xs text-on-surface/50">Zona A — Nivel Medio</p>
              </div>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-secondary px-2.5 py-1 rounded bg-secondary/15 border border-secondary/20">
                Mock
              </span>
            </div>
            
            <div className="mt-4 flex items-start gap-2 bg-surface-container-high/40 p-3 rounded-xl border border-outline-variant/15">
              <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5">info</span>
              <p className="font-body text-[11px] leading-relaxed text-on-surface/60">
                La asignación física de casilleros se encuentra en fase de pruebas. El guardado e integración nativa en base de datos estarán disponibles próximamente.
              </p>
            </div>
          </div>

          {/* Notes Block */}
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col relative">
            <h4 className="font-headline font-bold text-base text-on-surface mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">edit_note</span>
              Notas Internas
            </h4>
            <p className="text-xs text-on-surface/50 mb-4">
              Anotaciones de entrenamiento, condiciones médicas o alertas administrativas.
            </p>
            
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Escribe algo sobre este cliente..."
                className="w-full bg-surface-container rounded-xl p-4 text-sm text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-shown:italic transition-shadow min-h-[140px] resize-none border border-outline-variant/15"
                disabled={isSaving}
              />
              
              {saveStatus === "success" && (
                <div className="absolute top-2 right-2 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold py-1 px-2.5 rounded-full flex items-center gap-1.5 animate-fade-in animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Guardado
                </div>
              )}

              {saveStatus === "error" && (
                <div className="absolute top-2 right-2 bg-error/10 border border-error/20 text-error text-[10px] font-bold py-1 px-2.5 rounded-full flex items-center gap-1.5 animate-fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                  Error
                </div>
              )}
            </div>

            <button
              onClick={handleSaveNotes}
              disabled={isSaving || notes.trim() === (client.notes || "")}
              className="bg-gradient-cta text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,108,73,0.15)] text-sm disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer mt-3 w-full"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Guardando notas…</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Guardar Notas</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right Column (Memberships, Recent Purchases, Attendances) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Memberships block */}
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h4 className="font-headline font-bold text-lg text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px] text-primary">card_membership</span>
              Membresías e Ingresos
            </h4>

            {client.memberships.length === 0 ? (
              <div className="text-center py-10 bg-surface-container/30 border border-dashed border-outline-variant/20 rounded-2xl">
                <span className="material-symbols-outlined text-4xl text-on-surface/20 mb-2">assignment_late</span>
                <p className="font-body text-sm text-on-surface/50 font-medium">Este cliente no registra membresías asociadas.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {client.memberships.map((m) => {
                  const planName = m.membership_plans?.name ?? "Plan Personalizado";
                  const price = m.membership_plans?.price ?? 0;
                  
                  const startDateStr = new Date(m.start_date).toLocaleDateString("es-PE", {
                    day: "2-digit", month: "short", year: "numeric"
                  });
                  const endDateStr = new Date(m.end_date).toLocaleDateString("es-PE", {
                    day: "2-digit", month: "short", year: "numeric"
                  });

                  // Calculate days remaining
                  const endTimestamp = new Date(m.end_date).getTime();
                  const nowTimestamp = Date.now();
                  const diffTime = endTimestamp - nowTimestamp;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const daysRemaining = diffDays > 0 ? diffDays : 0;

                  const durationDays = m.membership_plans?.duration_days ?? 30;
                  const progressPercent = m.status === "active"
                    ? Math.max(0, Math.min(100, (daysRemaining / durationDays) * 100))
                    : 0;

                  return (
                    <div
                      key={m.id}
                      className="bg-surface-container/30 border border-outline-variant/15 p-5 rounded-2xl space-y-4 hover:border-outline-variant/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h5 className="font-headline font-bold text-base text-on-surface">{planName}</h5>
                          <p className="font-body text-xs text-on-surface/50">
                            Vigencia: {startDateStr} — {endDateStr}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-headline font-bold text-sm text-primary">S/ {price.toFixed(2)}</span>
                          {m.status === "active" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-container/20 text-primary-container text-xs font-bold border border-primary-container/20">
                              Activa
                            </span>
                          ) : m.status === "expired" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface/40 text-xs font-semibold border border-outline-variant/15">
                              Expirada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container/10 text-error-container text-xs font-semibold border border-error-container/20">
                              Cancelada
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Remaining Days Progress for active plans */}
                      {m.status === "active" && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-on-surface/60 font-body">Días Restantes</span>
                            <span className="text-primary font-headline font-bold">{daysRemaining} de {durationDays} días</span>
                          </div>
                          <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Entries progress (For package/session plans) */}
                      {(m.allowed_entries !== null && m.allowed_entries !== undefined) && (
                        <div className="flex items-center justify-between bg-surface-container-low/50 border border-outline-variant/10 px-4 py-2.5 rounded-xl text-xs font-semibold">
                          <span className="text-on-surface/50 font-body">Ingresos Consumidos</span>
                          <span className="text-on-surface font-headline font-bold">
                            {m.used_entries} / {m.allowed_entries} asistencias
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Purchases Block */}
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h4 className="font-headline font-bold text-lg text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px] text-primary">shopping_bag</span>
              Compras Recientes
            </h4>

            {initialSales.length === 0 ? (
              <div className="text-center py-10 bg-surface-container/30 border border-dashed border-outline-variant/20 rounded-2xl">
                <span className="material-symbols-outlined text-4xl text-on-surface/20 mb-2">receipt_long</span>
                <p className="font-body text-sm text-on-surface/50 font-medium">No se registran transacciones de venta.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {initialSales.map((sale) => {
                  const dateStr = new Date(sale.created_at).toLocaleDateString("es-PE", {
                    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                  });
                  const payment = getPaymentMethodDetails(sale.payment_method);
                  
                  return (
                    <div
                      key={sale.id}
                      className="bg-surface-container/20 border border-outline-variant/15 p-4 rounded-xl space-y-3 hover:border-outline-variant/30 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/5 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-headline font-extrabold text-sm text-on-surface">
                            Venta #{sale.id.toString().slice(-6).toUpperCase()}
                          </span>
                          <span className="text-xs text-on-surface/40 font-body">{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${payment.colorClass}`}>
                            <span className="material-symbols-outlined text-[12px]">{payment.icon}</span>
                            {payment.label}
                          </span>
                          <span className="font-headline font-black text-sm text-on-surface">
                            S/ {sale.total.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Items lists */}
                      <div className="space-y-1.5 pl-1">
                        {sale.sale_items.map((item) => {
                          const name = item.products?.name ?? item.membership_plans?.name ?? "Ítem de venta";
                          return (
                            <div key={item.id} className="flex items-center justify-between text-xs font-body text-on-surface/75">
                              <span className="flex-1 mr-4">
                                {name} <span className="text-on-surface/40 font-medium">x {item.quantity}</span>
                              </span>
                              <span className="font-semibold">
                                S/ {(item.unit_price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Last Attendances Block */}
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
            <h4 className="font-headline font-bold text-lg text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[22px] text-primary">fact_check</span>
              Últimas Asistencias
            </h4>

            {initialAttendances.length === 0 ? (
              <div className="text-center py-10 bg-surface-container/30 border border-dashed border-outline-variant/20 rounded-2xl">
                <span className="material-symbols-outlined text-4xl text-on-surface/20 mb-2">event_busy</span>
                <p className="font-body text-sm text-on-surface/50 font-medium">No se registran asistencias para este cliente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {initialAttendances.map((att) => {
                  const checkInTime = new Date(att.attendance_at).toLocaleTimeString("es-PE", {
                    hour: "2-digit", minute: "2-digit"
                  });
                  const checkInDate = new Date(att.attendance_at).toLocaleDateString("es-PE", {
                    weekday: "long", day: "2-digit", month: "short", year: "numeric"
                  });
                  
                  const registrarName = att.profiles 
                    ? `${att.profiles.first_name} ${att.profiles.last_name}`
                    : "Sistema / QR";

                  return (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3.5 bg-surface-container/40 border border-outline-variant/10 rounded-xl hover:bg-surface-container-high/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-on-surface capitalize">{checkInDate}</p>
                          <p className="text-[10px] text-on-surface/40 font-body">Registrado por: {registrarName}</p>
                        </div>
                      </div>
                      <span className="font-headline font-black text-xs text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10">
                        {checkInTime}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </>
  );
}
