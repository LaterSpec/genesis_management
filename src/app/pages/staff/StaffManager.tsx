"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { StaffMember, CreateStaffInput } from "@/lib/api/users.api";
import { createStaffAction, deleteStaffAction, changeStaffPasswordAction } from "./actions";

// ─── Drawer para Registro de Personal ──────────────────────────────────────────
interface StaffDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (newStaff: StaffMember) => void;
}

function StaffDrawer({ isOpen, onClose, onSaved }: StaffDrawerProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setErrorMsg("");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimating(true));
      });
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
    const hasValues = Array.from(fd.values()).some((val) => val !== "");
    setIsDirty(hasValues);
  }, []);

  const requestClose = () => {
    if (isDirty) {
      if (!window.confirm("¿Seguro que deseas salir? Los datos ingresados se perderán.")) return;
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    const fd = new FormData(e.currentTarget);

    const password = fd.get("password") as string;
    const confirmPassword = fd.get("confirm_password") as string;

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsPending(true);
    try {
      const data: CreateStaffInput = {
        first_name: fd.get("first_name") as string,
        last_name: fd.get("last_name") as string,
        email: fd.get("email") as string,
        password: password,
        role: fd.get("role") as "administrator" | "receptionist",
        birth_date: (fd.get("birth_date") as string) || undefined,
        gender: (fd.get("gender") as string) || undefined,
      };

      const res = await createStaffAction(data);
      if (res.success && res.data) {
        setIsDirty(false);
        formRef.current?.reset();
        onSaved(res.data);
      } else {
        setErrorMsg(res.error || "Ocurrió un error inesperado al registrar.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al conectar con el servidor.");
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
              Registrar Nuevo Personal
            </h3>
            <p className="text-xs text-on-surface/50 font-body mt-0.5">
              Crea una cuenta de acceso para un recepcionista.
            </p>
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
          {errorMsg && (
            <div className="bg-error-container/20 text-error rounded-xl p-4 text-xs font-semibold flex items-center gap-2 border border-error/20 animate-pulse">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              {errorMsg}
            </div>
          )}

          {/* Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
                Nombres
              </label>
              <input
                required
                name="first_name"
                className={inputCls}
                placeholder="Ej. Ana"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
                Apellidos
              </label>
              <input
                required
                name="last_name"
                className={inputCls}
                placeholder="Ej. Gómez"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
              Email / Usuario
            </label>
            <input
              required
              type="email"
              name="email"
              className={inputCls}
              placeholder="ana.gomez@genesisgym.com"
            />
          </div>

          {/* Contraseñas */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <input
                required
                type="password"
                name="password"
                className={inputCls}
                placeholder="Min. 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
                Confirmar Contraseña
              </label>
              <input
                required
                type="password"
                name="confirm_password"
                className={inputCls}
                placeholder="Repite la contraseña"
              />
            </div>
          </div>

          {/* Rol (Desplegable Interactivo) */}
          <div>
            <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
              Rol Asignado
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary text-[18px]">badge</span>
              <select
                required
                name="role"
                className={inputCls + " pl-10 appearance-none cursor-pointer font-semibold"}
                defaultValue="receptionist"
              >
                <option value="receptionist">Recepcionista</option>
                <option value="administrator">Administrador</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface/40 pointer-events-none text-[18px]">
                arrow_drop_down
              </span>
            </div>
          </div>

          {/* Fecha de Nacimiento (Opcional) */}
          <div>
            <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
              Fecha de Nacimiento <span className="text-on-surface/30 font-normal">(Opcional)</span>
            </label>
            <input
              type="date"
              name="birth_date"
              className={inputCls}
            />
          </div>

          {/* Género (Opcional) */}
          <div>
            <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
              Género <span className="text-on-surface/30 font-normal">(Opcional)</span>
            </label>
            <select
              name="gender"
              className={inputCls}
              defaultValue=""
            >
              <option value="">No especificar</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </select>
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
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  Registrando…
                </>
              ) : (
                "Crear Cuenta de Personal"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal para Cambio de Contraseña ───────────────────────────────────────────
interface PasswordModalProps {
  isOpen: boolean;
  staff: StaffMember | null;
  onClose: () => void;
}

function PasswordModal({ isOpen, staff, onClose }: PasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, setIsPending] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNewPassword("");
      setConfirmPassword("");
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [isOpen]);

  if (!isOpen || !staff) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (newPassword !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsPending("saving");
    try {
      const res = await changeStaffPasswordAction(staff.id, newPassword);
      if (res.success) {
        setSuccessMsg("¡Contraseña actualizada con éxito!");
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setErrorMsg(res.error || "Ocurrió un error al cambiar la contraseña.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al conectar con el servidor.");
    } finally {
      setIsPending("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="relative bg-surface-container-low max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-outline-variant/10 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div>
          <h3 className="font-headline font-bold text-lg text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">key</span>
            Cambiar Contraseña
          </h3>
          <p className="text-xs text-on-surface/60 font-body mt-1">
            Actualizarás la credencial de acceso para: <span className="font-bold text-on-surface">{staff.first_name} {staff.last_name}</span>.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-error-container/20 text-error rounded-xl p-3 text-xs font-semibold flex items-center gap-2 border border-error/20">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-primary-container/10 text-primary rounded-xl p-3 text-xs font-semibold flex items-center gap-2 border border-primary/20">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
              Nueva Contraseña
            </label>
            <input
              required
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-surface-container rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-on-surface/30"
              placeholder="Min. 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
              Confirmar Nueva Contraseña
            </label>
            <input
              required
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-surface-container rounded-lg px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-on-surface/30"
              placeholder="Repite la contraseña"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3 text-sm font-semibold">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 hover:bg-surface-container-high rounded-lg text-on-surface/60 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!!isPending}
              className="px-4 py-2 bg-primary text-surface hover:opacity-90 disabled:opacity-50 rounded-lg shadow-md transition-opacity flex items-center gap-1.5"
            >
              {isPending ? (
                <span className="w-3.5 h-3.5 border-2 border-surface/40 border-t-surface rounded-full animate-spin"></span>
              ) : null}
              Guardar Contraseña
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Componente Principal StaffManager ─────────────────────────────────────────
export default function StaffManager({
  initialStaff,
  currentUserId,
}: {
  initialStaff: StaffMember[];
  currentUserId: string;
}) {
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaff);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [passwordModalStaff, setPasswordModalStaff] = useState<StaffMember | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);
  const [isDeletingPending, setIsDeletingPending] = useState(false);

  // Filtrado reactivo en memoria
  const filteredStaff = staffList.filter((m) => {
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    const email = m.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = fullName.includes(query) || email.includes(query);

    if (filterRole === "Administradores") return matchesSearch && m.role === "administrator";
    if (filterRole === "Recepcionistas") return matchesSearch && m.role === "receptionist";
    return matchesSearch;
  });

  // Paginación
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / pageSize));
  const displayedStaff = filteredStaff.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Estadísticas rápidas
  const totalCount = staffList.length;
  const adminCount = staffList.filter((s) => s.role === "administrator").length;
  const receptionistCount = staffList.filter((s) => s.role === "receptionist").length;

  const handleSaved = (newStaff: StaffMember) => {
    setStaffList((prev) => [newStaff, ...prev]);
    setIsDrawerOpen(false);
  };

  const handleDelete = async () => {
    if (!deletingStaff) return;
    setIsDeletingPending(true);
    try {
      const res = await deleteStaffAction(deletingStaff.id);
      if (res.success) {
        setStaffList((prev) => prev.filter((s) => s.id !== deletingStaff.id));
        setDeletingStaff(null);
      } else {
        alert(res.error || "No se pudo dar de baja la cuenta.");
      }
    } catch (err: any) {
      alert(err.message || "Error al procesar la baja.");
    } finally {
      setIsDeletingPending(false);
    }
  };

  return (
    <>
      {/* Drawer de Creación */}
      <StaffDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSaved={handleSaved}
      />

      {/* Modal para Modificar Contraseña */}
      <PasswordModal
        isOpen={!!passwordModalStaff}
        staff={passwordModalStaff}
        onClose={() => setPasswordModalStaff(null)}
      />

      {/* Modal / Diálogo de Confirmación para dar de baja */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setDeletingStaff(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-surface-container-low max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-outline-variant/10 flex flex-col space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="font-headline font-bold text-lg text-error flex items-center gap-2">
                <span className="material-symbols-outlined">warning</span>
                Confirmar Baja de Personal
              </h3>
              <p className="text-xs text-on-surface/60 font-body mt-2">
                ¿Seguro que deseas dar de baja y desactivar la cuenta de <span className="font-bold text-on-surface">{deletingStaff.first_name} {deletingStaff.last_name}</span>?
              </p>
              <p className="text-[11px] text-error font-semibold mt-2 bg-error-container/10 p-2 rounded-lg">
                El usuario ya no podrá iniciar sesión ni aparecer en los formularios de personal, pero todos sus registros y datos históricos se mantendrán a salvo.
              </p>
            </div>
            <div className="flex justify-end gap-3 text-sm font-semibold pt-2">
              <button
                type="button"
                disabled={isDeletingPending}
                onClick={() => setDeletingStaff(null)}
                className="px-4 py-2 hover:bg-surface-container-high rounded-lg text-on-surface/60 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingPending}
                onClick={handleDelete}
                className="px-4 py-2 bg-error text-white hover:opacity-90 rounded-lg flex items-center gap-1.5 transition-opacity"
              >
                {isDeletingPending ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                ) : null}
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-in fade-in duration-300">
        <div>
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-2">
            Administración de Personal
          </h2>
          <p className="text-on-surface/60 font-body text-sm max-w-lg">
            Gestiona el equipo de trabajo de GenesisGym, genera nuevos usuarios y actualiza o elimina sus credenciales de acceso con total seguridad.
          </p>
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="bg-gradient-cta text-white rounded-full py-3 px-8 font-label font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 whitespace-nowrap shadow-[0_8px_16px_rgba(16,185,129,0.2)] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            person_add
          </span>
          Registrar Nuevo Personal
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-in fade-in duration-500">
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[11px] uppercase tracking-[0.05em] text-on-surface/50 font-bold mb-1">Total Personal</p>
          <span className="font-headline text-4xl font-extrabold text-on-surface">{totalCount}</span>
        </div>
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[11px] uppercase tracking-[0.05em] text-on-surface/50 font-bold mb-1">Administradores</p>
          <span className="font-headline text-4xl font-extrabold text-primary">{adminCount}</span>
        </div>
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-[11px] uppercase tracking-[0.05em] text-on-surface/50 font-bold mb-1">Recepcionistas</p>
          <span className="font-headline text-4xl font-extrabold text-secondary">{receptionistCount}</span>
        </div>

        {/* Filter & Search Box */}
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex flex-col justify-center space-y-2">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/40 pointer-events-none text-[20px]">
              filter_list
            </span>
            <select
              value={filterRole}
              onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
              className="w-full bg-surface-container appearance-none border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-body text-on-surface focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
            >
              <option>Todos</option>
              <option>Administradores</option>
              <option>Recepcionistas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="mb-6 relative w-full max-w-md animate-in fade-in duration-500">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/40 pointer-events-none">
          search
        </span>
        <input
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          placeholder="Buscar personal por nombre o correo..."
          className="w-full bg-surface-container-low rounded-2xl pl-12 pr-10 py-3 text-sm text-on-surface focus:outline-none border border-outline-variant/10 focus:ring-2 focus:ring-primary transition-shadow placeholder:text-on-surface/30 shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface/40 hover:text-on-surface text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Staff Table */}
      <div className="bg-surface-container-low rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10 animate-in fade-in duration-700">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="py-4 px-6 font-label text-xs font-semibold text-on-surface/60 uppercase tracking-wider">Nombre del Personal</th>
                <th className="py-4 px-6 font-label text-xs font-semibold text-on-surface/60 uppercase tracking-wider">Rol de Acceso</th>
                <th className="py-4 px-6 font-label text-xs font-semibold text-on-surface/60 uppercase tracking-wider">Género</th>
                <th className="py-4 px-6 font-label text-xs font-semibold text-on-surface/60 uppercase tracking-wider">Fecha Registro</th>
                <th className="py-4 px-6 font-label text-xs font-semibold text-on-surface/60 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low/50 font-body">
              {displayedStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-on-surface/40 font-body text-sm">
                    No se encontró personal registrado con los filtros activos.
                  </td>
                </tr>
              ) : (
                displayedStaff.map((staff) => {
                  const initials = `${staff.first_name[0]}${staff.last_name[0]}`.toUpperCase();
                  const regDate = staff.created_at
                    ? new Date(staff.created_at).toLocaleDateString("es-PE", {
                        day: "2-digit", month: "short", year: "numeric",
                      })
                    : "—";
                  
                  const isCurrent = staff.id === currentUserId;

                  return (
                    <tr key={staff.id} className="group hover:bg-primary-container/5 transition-colors relative">
                      {/* Left Hover Border Accent */}
                      <td className="py-4 px-6 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-surface-container-high shrink-0 flex items-center justify-center text-primary font-bold text-sm shadow-sm select-none">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-on-surface">
                              {staff.first_name} {staff.last_name} {isCurrent && <span className="text-[10px] bg-primary/20 text-primary font-bold px-1.5 py-0.5 rounded-full ml-1 select-none">Tú</span>}
                            </p>
                            <p className="text-xs text-on-surface/50 font-normal">{staff.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="py-4 px-6">
                        {staff.role === "administrator" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary-container/10 text-primary text-xs font-semibold border border-primary/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Administrador
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-secondary-container/10 text-secondary text-xs font-semibold border border-secondary/10">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Recepcionista
                          </span>
                        )}
                      </td>

                      {/* Género */}
                      <td className="py-4 px-6 text-sm text-on-surface/80 capitalise">
                        {staff.gender ? staff.gender : "—"}
                      </td>

                      {/* Fecha de Registro */}
                      <td className="py-4 px-6 text-sm text-on-surface/80">{regDate}</td>

                      {/* Acciones */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setPasswordModalStaff(staff)}
                            className="p-2 text-on-surface/60 hover:text-primary hover:bg-surface-container-highest transition-all cursor-pointer rounded-full shadow-sm"
                            title="Cambiar Contraseña"
                          >
                            <span className="material-symbols-outlined text-[18px]">key</span>
                          </button>
                          
                          {!isCurrent && (
                            <button
                              onClick={() => setDeletingStaff(staff)}
                              className="p-2 text-on-surface/60 hover:text-error hover:bg-error-container/10 transition-all cursor-pointer rounded-full shadow-sm"
                              title="Dar de Baja"
                            >
                              <span className="material-symbols-outlined text-[18px]">person_remove</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-surface/50 border-t border-outline-variant/10 flex items-center justify-between">
          <p className="text-xs font-body text-on-surface/50">
            Mostrando {displayedStaff.length} de {filteredStaff.length} personal{" "}
            {filterRole !== "Todos" && `(${filterRole.toLowerCase()})`}
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
