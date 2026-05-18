"use client";

import React, { useMemo, useState } from "react";
import type {
  AttendanceClientLookup,
  AttendanceWarningReason,
  ClientAttendanceFull,
} from "@/lib/api/attendance.api";
import {
  deleteAttendanceAction,
  getAttendanceDayListAction,
  registerAttendanceAction,
} from "./actions";

interface Props {
  clients: AttendanceClientLookup[];
  initialAttendances: ClientAttendanceFull[];
  initialDate: string;
  todayDate: string;
}

const WARNING_COPY: Record<AttendanceWarningReason, string> = {
  inactive_client:
    "El cliente está inactivo. Puedes cancelar o aprobar manualmente el ingreso.",
  no_active_membership:
    "El cliente no tiene una membresía activa vigente. Puedes cancelar o aprobar manualmente el ingreso.",
  both:
    "El cliente está inactivo y tampoco tiene una membresía activa vigente. Puedes cancelar o aprobar manualmente el ingreso.",
};

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSelectedDateReference(date: string) {
  return new Date(`${date}T12:00:00`);
}

function getAttendanceState(
  client: ClientAttendanceFull["clients"],
  selectedDate: string
) {
  if (!client) {
    return {
      label: "Sin cliente",
      className: "bg-surface-container-high text-on-surface/60",
    };
  }

  const referenceDate = getSelectedDateReference(selectedDate);
  const activeMembership = client.memberships?.find((membership) => {
    if (membership.status !== "active") return false;

    const start = new Date(membership.start_date).getTime();
    const end = new Date(membership.end_date).getTime();
    const current = referenceDate.getTime();

    return start <= current && end >= current;
  });

  if (client.status !== "active" && !activeMembership) {
    return {
      label: "Inactivo / Sin membresía",
      className: "bg-error-container text-on-error-container",
    };
  }

  if (client.status !== "active") {
    return {
      label: "Cliente inactivo",
      className: "bg-error-container text-on-error-container",
    };
  }

  if (!activeMembership) {
    return {
      label: "Sin membresía activa",
      className: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
    };
  }

  return {
    label: activeMembership.membership_plans?.name
      ? `Membresía: ${activeMembership.membership_plans.name}`
      : "Membresía activa",
    className: "bg-primary-container/20 text-primary",
  };
}

function SearchResultButton({
  client,
  onSelect,
}: {
  client: AttendanceClientLookup;
  onSelect: (client: AttendanceClientLookup) => void;
}) {
  const membershipLabel = client.activeMembership
    ? `${client.activeMembership.planName} · vence ${new Date(
        client.activeMembership.endDate
      ).toLocaleDateString("es-PE")}`
    : "Sin membresía activa";

  return (
    <button
      type="button"
      onClick={() => onSelect(client)}
      className="w-full text-left px-4 py-3 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors border border-transparent hover:border-outline-variant/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-on-surface">
            {client.first_name} {client.last_name}
          </p>
          <p className="text-xs text-on-surface/60 mt-1">DNI: {client.dni}</p>
          <p className="text-xs text-on-surface/60 mt-1">{membershipLabel}</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
            client.warningReason
              ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
              : "bg-primary-container/20 text-primary"
          }`}
        >
          {client.warningReason ? "Revisión" : "Listo"}
        </span>
      </div>
    </button>
  );
}

function WarningModal({
  client,
  warningReason,
  isPending,
  onCancel,
  onConfirm,
}: {
  client: AttendanceClientLookup | null;
  warningReason: AttendanceWarningReason | null;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!client || !warningReason) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-[2rem] bg-surface-container-low border border-outline-variant/10 shadow-2xl p-8">
        <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200 flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-3xl">warning</span>
        </div>
        <h3 className="font-headline font-extrabold text-2xl text-on-surface mb-2">
          Confirmar ingreso
        </h3>
        <p className="text-sm text-on-surface/70 mb-3">
          {client.first_name} {client.last_name}
        </p>
        <p className="text-sm text-on-surface/70 mb-8">
          {WARNING_COPY[warningReason]}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full py-3 px-5 bg-surface-container text-on-surface font-semibold hover:bg-surface-container-high transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="flex-1 rounded-full py-3 px-5 bg-gradient-cta text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {isPending ? "Registrando…" : "Aprobar ingreso"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AttendanceManager({
  clients,
  initialAttendances,
  initialDate,
  todayDate,
}: Props) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [attendanceRows, setAttendanceRows] =
    useState<ClientAttendanceFull[]>(initialAttendances);
  const [query, setQuery] = useState("");
  const [selectedClient, setSelectedClient] =
    useState<AttendanceClientLookup | null>(null);
  const [warningReason, setWarningReason] =
    useState<AttendanceWarningReason | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoadingDate, setIsLoadingDate] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    return clients
      .filter((client) => {
        const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
        return fullName.includes(normalized) || client.dni.includes(normalized);
      })
      .slice(0, 8);
  }, [clients, query]);

  const stats = useMemo(() => {
    return {
      totalEntries: attendanceRows.length,
      uniqueClients: new Set(attendanceRows.map((row) => row.client_id)).size,
    };
  }, [attendanceRows]);

  async function loadAttendances(date: string) {
    setIsLoadingDate(true);
    setErrorMessage(null);

    try {
      const rows = await getAttendanceDayListAction(date);
      setAttendanceRows(rows);
      setSelectedDate(date);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las asistencias."
      );
    } finally {
      setIsLoadingDate(false);
    }
  }

  function handleSelectClient(client: AttendanceClientLookup) {
    setSelectedClient(client);
    setQuery(`${client.first_name} ${client.last_name}`);
    setErrorMessage(null);
    setInfoMessage(null);
  }

  function resetSelection() {
    setSelectedClient(null);
    setQuery("");
    setWarningReason(null);
  }

  async function handleRegister(force = false) {
    if (!selectedClient) {
      setErrorMessage("Selecciona un cliente antes de registrar la asistencia.");
      return;
    }

    setIsRegistering(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const result = await registerAttendanceAction({
        clientId: selectedClient.id,
        force,
      });

      if (result.requiresConfirmation && result.warningReason) {
        setWarningReason(result.warningReason);
        return;
      }

      if (!result.success) {
        setErrorMessage(result.message ?? "No se pudo registrar la asistencia.");
        return;
      }

      setWarningReason(null);
      setInfoMessage(result.message ?? "Asistencia registrada correctamente.");
      resetSelection();
      await loadAttendances(todayDate);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo registrar la asistencia."
      );
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleDelete(attendanceId: string) {
    if (!window.confirm("¿Eliminar este registro de asistencia?")) return;

    setDeletingId(attendanceId);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      await deleteAttendanceAction(attendanceId);
      await loadAttendances(selectedDate);
      setInfoMessage("Asistencia eliminada correctamente.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la asistencia."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <WarningModal
        client={selectedClient}
        warningReason={warningReason}
        isPending={isRegistering}
        onCancel={() => setWarningReason(null)}
        onConfirm={() => handleRegister(true)}
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-xs font-body uppercase tracking-[0.05em] text-primary font-bold mb-2 block">
            Control de Acceso
          </span>
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-2">
            Asistencias
          </h2>
          <p className="text-on-surface/60 font-body text-sm max-w-2xl">
            Registra entradas de clientes y revisa el historial diario de asistencias por fecha.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-surface-container-low rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3">
            Fecha visible
          </p>
          <p className="font-headline font-extrabold text-3xl text-on-surface">
            {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("es-PE", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="bg-surface-container-low rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3">
            Registros del día
          </p>
          <p className="font-headline font-extrabold text-3xl text-on-surface">
            {stats.totalEntries}
          </p>
        </div>
        <div className="bg-surface-container-low rounded-[2rem] p-6 border border-outline-variant/10 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3">
            Clientes únicos
          </p>
          <p className="font-headline font-extrabold text-3xl text-on-surface">
            {stats.uniqueClients}
          </p>
        </div>
      </div>

      {(infoMessage || errorMessage) && (
        <div
          className={`mb-6 rounded-2xl px-4 py-3 text-sm font-medium ${
            errorMessage
              ? "bg-error-container text-on-error-container"
              : "bg-primary-container/20 text-primary"
          }`}
        >
          {errorMessage ?? infoMessage}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <section className="xl:col-span-5 bg-surface-container-low rounded-[2.5rem] p-6 md:p-8 border border-outline-variant/10 shadow-sm">
          <div className="mb-6">
            <h3 className="font-headline font-bold text-2xl text-on-surface">
              Registrar entrada
            </h3>
            <p className="text-sm text-on-surface/60 mt-2">
              Busca al cliente por nombre o DNI y registra su ingreso del día.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
                Buscar cliente
              </label>
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelectedClient(null);
                }}
                placeholder="Ej. Juan Pérez o 12345678"
                className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {query && !selectedClient && (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {suggestions.length === 0 ? (
                  <div className="rounded-2xl bg-surface-container px-4 py-5 text-sm text-on-surface/50">
                    No se encontraron clientes con esa búsqueda.
                  </div>
                ) : (
                  suggestions.map((client) => (
                    <SearchResultButton
                      key={client.id}
                      client={client}
                      onSelect={handleSelectClient}
                    />
                  ))
                )}
              </div>
            )}

            {selectedClient && (
              <div className="rounded-[2rem] bg-surface-container p-5 border border-outline-variant/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-headline font-bold text-xl text-on-surface">
                      {selectedClient.first_name} {selectedClient.last_name}
                    </p>
                    <p className="text-sm text-on-surface/60 mt-1">
                      DNI: {selectedClient.dni}
                    </p>
                    {selectedClient.email ? (
                      <p className="text-sm text-on-surface/60 mt-1">
                        {selectedClient.email}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={resetSelection}
                    className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface/60 hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ${
                      selectedClient.status === "active"
                        ? "bg-primary-container/20 text-primary"
                        : "bg-error-container text-on-error-container"
                    }`}
                  >
                    {selectedClient.status === "active"
                      ? "Cliente activo"
                      : "Cliente inactivo"}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ${
                      selectedClient.activeMembership
                        ? "bg-primary-container/20 text-primary"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200"
                    }`}
                  >
                    {selectedClient.activeMembership
                      ? `${selectedClient.activeMembership.planName} · vence ${new Date(
                          selectedClient.activeMembership.endDate
                        ).toLocaleDateString("es-PE")}`
                      : "Sin membresía activa"}
                  </span>
                </div>

                {selectedClient.warningReason ? (
                  <div className="mt-4 rounded-2xl bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-100 px-4 py-3 text-sm">
                    {WARNING_COPY[selectedClient.warningReason]}
                  </div>
                ) : null}
              </div>
            )}

            <button
              type="button"
              onClick={() => handleRegister(false)}
              disabled={!selectedClient || isRegistering}
              className="w-full rounded-full py-3.5 bg-gradient-cta text-white font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isRegistering ? "Registrando…" : "Registrar entrada"}
            </button>
          </div>
        </section>

        <section className="xl:col-span-7 bg-surface-container-low rounded-[2.5rem] p-6 md:p-8 border border-outline-variant/10 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-6">
            <div>
              <h3 className="font-headline font-bold text-2xl text-on-surface">
                Lista de asistencias
              </h3>
              <p className="text-sm text-on-surface/60 mt-2">
                Revisa las entradas registradas para la fecha seleccionada.
              </p>
            </div>

            <div className="w-full md:w-auto">
              <label className="block text-xs font-semibold text-on-surface/60 uppercase tracking-wider mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => loadAttendances(event.target.value)}
                className="w-full md:w-[220px] bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {isLoadingDate ? (
            <div className="py-16 text-center text-on-surface/50 text-sm">
              Cargando asistencias…
            </div>
          ) : attendanceRows.length === 0 ? (
            <div className="py-16 text-center rounded-[2rem] bg-surface-container text-on-surface/45 text-sm">
              No hay asistencias registradas para esta fecha.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="py-4 pr-4 text-[11px] uppercase tracking-widest text-secondary font-black">
                      Hora
                    </th>
                    <th className="py-4 px-4 text-[11px] uppercase tracking-widest text-secondary font-black">
                      Cliente
                    </th>
                    <th className="py-4 px-4 text-[11px] uppercase tracking-widest text-secondary font-black">
                      Estado
                    </th>
                    <th className="py-4 pl-4 text-[11px] uppercase tracking-widest text-secondary font-black text-right">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRows.map((row) => {
                    const state = getAttendanceState(row.clients, selectedDate);
                    return (
                      <tr
                        key={row.id}
                        className="border-b border-outline-variant/5 last:border-b-0"
                      >
                        <td className="py-4 pr-4">
                          <p className="font-bold text-on-surface">
                            {formatTime(row.attendance_at)}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-semibold text-on-surface">
                            {row.clients
                              ? `${row.clients.first_name} ${row.clients.last_name}`
                              : "Cliente eliminado"}
                          </p>
                          {row.clients ? (
                            <p className="text-xs text-on-surface/55 mt-1">
                              DNI: {row.clients.dni}
                            </p>
                          ) : null}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ${state.className}`}
                          >
                            {state.label}
                          </span>
                        </td>
                        <td className="py-4 pl-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id)}
                            disabled={deletingId === row.id}
                            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-error hover:bg-error-container/50 transition-colors disabled:opacity-60"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete
                            </span>
                            {deletingId === row.id ? "Eliminando…" : "Eliminar"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
