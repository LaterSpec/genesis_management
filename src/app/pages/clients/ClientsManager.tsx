"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import type { ClientWithMembership } from "@/lib/api/clients.api";
import { addClientAction, editClientAction, removeClientAction } from "./actions";

// ─── Drawer Component ─────────────────────────────────────────────────────────
interface DrawerProps {
  isOpen: boolean;
  editingClient: ClientWithMembership | null;
  onClose: () => void;
  onSaved: () => void;
}

function ClientDrawer({ isOpen, editingClient, onClose, onSaved }: DrawerProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Build initial values from editingClient
  const initial = editingClient
    ? {
        dni: editingClient.dni ?? "",
        first_name: editingClient.first_name ?? "",
        last_name: editingClient.last_name ?? "",
        email: editingClient.email ?? "",
        phone: editingClient.phone ?? "",
        status: editingClient.status ?? "active",
      }
    : { dni: "", first_name: "", last_name: "", email: "", phone: "", status: "active" };

  // ── Animation lifecycle ────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      // Trigger enter animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true));
      });
      setIsDirty(false);
    } else {
      setAnimating(false);
      // Wait for exit transition before hiding
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

  // ── Close with guard ──────────────────────────────────────────────────────
  const requestClose = () => {
    if (isDirty) {
      if (!window.confirm("¿Seguro que deseas salir? Los datos no guardados se perderán.")) return;
    }
    onClose();
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setIsPending(true);
    try {
      const data = {
        first_name: fd.get("first_name") as string,
        last_name: fd.get("last_name") as string,
        email: (fd.get("email") as string) || null,
        dni: fd.get("dni") as string,
        phone: (fd.get("phone") as string) || null,
      };
      if (editingClient) {
        await editClientAction(editingClient.id, { ...data, status: fd.get("status") as string });
      } else {
        await addClientAction(data as any);
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
              {editingClient ? "Editar Cliente" : "Añadir Nuevo Cliente"}
            </h3>
            {isDirty && (
              <p className="text-[11px] text-primary/80 font-semibold mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
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
          {/* DNI */}
          <div>
            <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
              DNI / Documento
            </label>
            <input
              required
              name="dni"
              defaultValue={initial.dni}
              className={inputCls}
              placeholder="Número de documento"
            />
          </div>

          {/* Nombre / Apellido */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
                Nombres
              </label>
              <input
                required
                name="first_name"
                defaultValue={initial.first_name}
                className={inputCls}
                placeholder="Ej. Juan"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
                Apellidos
              </label>
              <input
                required
                name="last_name"
                defaultValue={initial.last_name}
                className={inputCls}
                placeholder="Ej. Pérez"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              defaultValue={initial.email}
              className={inputCls}
              placeholder="correo@ejemplo.com"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
              Teléfono
            </label>
            <input
              name="phone"
              defaultValue={initial.phone}
              className={inputCls}
              placeholder="+51 999 888 777"
            />
          </div>

          {/* Estado (solo en edición) */}
          {editingClient && (
            <div>
              <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
                Estado
              </label>
              <select
                name="status"
                defaultValue={initial.status}
                className={inputCls}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          )}

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-cta text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  Guardando…
                </>
              ) : editingClient ? (
                "Guardar Cambios"
              ) : (
                "Crear Cliente"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Manager ─────────────────────────────────────────────────────────────
export default function ClientsManager({
  initialClients,
  stats,
}: {
  initialClients: ClientWithMembership[];
  stats: any;
}) {
  const [filterStatus, setFilterStatus] = useState("Todos los Estados");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithMembership | null>(null);

  const filteredClients = initialClients.filter((client) => {
    if (filterStatus === "Activos") return client.status === "active";
    if (filterStatus === "Inactivos") return client.status === "inactive";
    return true;
  });

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const displayedClients = filteredClients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const openAdd = () => {
    setEditingClient(null);
    setIsDrawerOpen(true);
  };

  const openEdit = (client: ClientWithMembership) => {
    setEditingClient(client);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Eliminar este cliente? Esta acción no se puede deshacer.")) {
      await removeClientAction(id);
    }
  };

  const handleClose = () => setIsDrawerOpen(false);
  const handleSaved = () => setIsDrawerOpen(false);

  return (
    <>
      <ClientDrawer
        isOpen={isDrawerOpen}
        editingClient={editingClient}
        onClose={handleClose}
        onSaved={handleSaved}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-2">
            Clientes
          </h2>
          <p className="text-on-surface/60 font-body text-sm max-w-lg">
            Gestiona el padrón de miembros. Monitorea estados activos y revisa historiales de ingreso con precisión.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-gradient-cta text-white rounded-full py-3 px-8 font-label font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 whitespace-nowrap shadow-[0_8px_16px_rgba(16,185,129,0.2)] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            person_add
          </span>
          Añadir Nuevo Cliente
        </button>
      </div>

      {/* Stats / Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[11px] uppercase tracking-[0.05em] text-on-surface/50 font-bold mb-1">Total Activos</p>
          <span className="font-headline text-4xl font-extrabold text-on-surface">{stats.totalActive}</span>
        </div>
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[11px] uppercase tracking-[0.05em] text-on-surface/50 font-bold mb-1">Nuevos este mes</p>
          <span className="font-headline text-4xl font-extrabold text-on-surface">{stats.newThisMonth}</span>
        </div>
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col justify-center">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/40 pointer-events-none">
              filter_list
            </span>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="w-full bg-surface-container appearance-none border-none rounded-xl py-3 pl-10 pr-4 text-sm font-body text-on-surface focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
            >
              <option>Todos los Estados</option>
              <option>Activos</option>
              <option>Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="py-4 px-6 font-label text-xs font-semibold text-on-surface/60 uppercase tracking-wider">Cliente</th>
                <th className="py-4 px-6 font-label text-xs font-semibold text-on-surface/60 uppercase tracking-wider">Plan de Membresía</th>
                <th className="py-4 px-6 font-label text-xs font-semibold text-on-surface/60 uppercase tracking-wider">Fecha Ingreso</th>
                <th className="py-4 px-6 font-label text-xs font-semibold text-on-surface/60 uppercase tracking-wider">Estado</th>
                <th className="py-4 px-6 font-label text-xs font-semibold text-on-surface/60 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low/50">
              {displayedClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-on-surface/40 font-body text-sm">
                    No hay clientes registrados.
                  </td>
                </tr>
              ) : (
                displayedClients.map((client) => {
                  const activeMembership = client.memberships?.find((m) => m.status === "active");
                  const planName = activeMembership?.membership_plans?.name ?? "Sin plan";
                  const initials = `${client.first_name[0]}${client.last_name[0]}`.toUpperCase();
                  const joinDate = new Date(client.join_date).toLocaleDateString("es-PE", {
                    day: "2-digit", month: "short", year: "numeric",
                  });
                  return (
                    <tr key={client.id} className="group hover:bg-primary-container/5 transition-colors relative">
                      <td className="py-4 px-6 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-surface-container-high shrink-0 flex items-center justify-center text-primary font-bold text-sm">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-on-surface">{client.first_name} {client.last_name}</p>
                            <p className="text-xs text-on-surface/50 font-body">{client.dni} • {client.email ?? "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-body text-sm text-on-surface/80">{planName}</td>
                      <td className="py-4 px-6 font-body text-sm text-on-surface/80">{joinDate}</td>
                      <td className="py-4 px-6">
                        {client.status === "active" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary-container/20 text-primary-container text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-container" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-high text-on-surface/50 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-on-surface/40" /> Inactivo
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/pages/clients/${client.id}`}
                            className="w-9 h-9 flex items-center justify-center bg-surface-container-high hover:bg-surface-container-highest rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all text-secondary cursor-pointer border border-outline-variant/10"
                            title="Ver Detalles"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </Link>
                          <button
                            onClick={() => openEdit(client)}
                            className="w-9 h-9 flex items-center justify-center bg-surface-container-high hover:bg-surface-container-highest rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all text-primary cursor-pointer border border-outline-variant/10"
                            title="Editar"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="w-9 h-9 flex items-center justify-center bg-surface-container-high hover:bg-surface-container-highest rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all text-error cursor-pointer border border-outline-variant/10"
                            title="Eliminar"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-surface/50 border-t border-outline-variant/10 flex items-center justify-between">
          <p className="text-xs font-body text-on-surface/50">
            Mostrando {displayedClients.length} de {filteredClients.length} clientes{" "}
            {filterStatus !== "Todos los Estados" && `(${filterStatus.toLowerCase()})`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 text-on-surface/40 hover:text-primary transition-colors disabled:opacity-30 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <span className="text-sm font-semibold text-on-surface px-2">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 text-on-surface/60 hover:text-primary disabled:opacity-30 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
