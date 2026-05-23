"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import {
  getActiveCashSession,
  openCashSession,
  closeCashSession,
  CashSession,
} from "@/lib/api/cash-sessions.api";

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  role: "administrator" | "receptionist";
}

interface CashSessionContextType {
  activeSession: CashSession | null;
  userProfile: UserProfile | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
  openSession: (initialAmount: number) => Promise<CashSession>;
  closeSession: () => Promise<CashSession>;
}

const CashSessionContext = createContext<CashSessionContextType | undefined>(
  undefined
);

const AUTH_EVENTS_WITH_SESSION = new Set([
  "INITIAL_SESSION",
  "SIGNED_IN",
  "TOKEN_REFRESHED",
  "USER_UPDATED",
]);

export function CashSessionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const syncGeneration = useRef(0);
  const syncInFlight = useRef(0);
  const lastSyncedUserId = useRef<string | null>(null);
  const prevPathname = useRef(pathname);

  const endSync = useCallback(() => {
    syncInFlight.current = Math.max(0, syncInFlight.current - 1);
    if (syncInFlight.current === 0) {
      setLoading(false);
    }
  }, []);

  const clearAuthState = useCallback(() => {
    syncGeneration.current += 1;
    syncInFlight.current = 0;
    lastSyncedUserId.current = null;
    setUserProfile(null);
    setActiveSession(null);
    setLoading(false);
  }, []);

  const syncFromSession = useCallback(
    async (session: Session | null) => {
      if (!session?.user) {
        clearAuthState();
        return;
      }

      const generation = ++syncGeneration.current;
      syncInFlight.current += 1;

      const userId = session.user.id;
      const isUserSwitch =
        lastSyncedUserId.current !== null &&
        lastSyncedUserId.current !== userId;
      const isFirstLoad = lastSyncedUserId.current === null;

      // Solo bloquear toda la UI en carga inicial o cambio de usuario (no en TOKEN_REFRESHED al volver a la pestaña)
      if (isFirstLoad || isUserSwitch) {
        if (isUserSwitch) {
          setActiveSession(null);
          setUserProfile(null);
        }
        setLoading(true);
      }

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, role")
          .eq("id", userId)
          .single();

        if (generation !== syncGeneration.current) return;

        if (error || !profile) {
          console.error("[CashSessionContext] Perfil no encontrado:", error);
          setUserProfile(null);
          setActiveSession(null);
          return;
        }

        const typedProfile = profile as UserProfile;
        setUserProfile(typedProfile);
        lastSyncedUserId.current = userId;

        if (typedProfile.role === "receptionist") {
          const cashSession = await getActiveCashSession(userId);
          if (generation !== syncGeneration.current) return;
          setActiveSession(cashSession);
        } else {
          setActiveSession(null);
        }
      } catch (err) {
        if (generation !== syncGeneration.current) return;
        console.error("[CashSessionContext] Error sincronizando sesión:", err);
        if (isFirstLoad || isUserSwitch) {
          setUserProfile(null);
          setActiveSession(null);
        }
      } finally {
        if (generation === syncGeneration.current) {
          endSync();
        } else {
          // Sync obsoleta: solo bajar el contador; la sync activa controla loading
          syncInFlight.current = Math.max(0, syncInFlight.current - 1);
          if (syncInFlight.current === 0) {
            setLoading(false);
          }
        }
      }
    },
    [clearAuthState, endSync, supabase]
  );

  const refreshSession = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    await syncFromSession(session);
  }, [supabase, syncFromSession]);

  const openSession = async (initialAmount: number) => {
    if (!userProfile) throw new Error("No authenticated user.");
    const session = await openCashSession(userProfile.id, initialAmount);
    setActiveSession(session);
    return session;
  };

  const closeSession = async () => {
    if (!activeSession) throw new Error("No active cash session to close.");
    const session = await closeCashSession(activeSession.id);
    setActiveSession(null);
    return session;
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        clearAuthState();
        return;
      }

      if (AUTH_EVENTS_WITH_SESSION.has(event)) {
        await syncFromSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, syncFromSession, clearAuthState]);

  useEffect(() => {
    const cameFromLogin =
      prevPathname.current.startsWith("/login") &&
      pathname.startsWith("/pages");
    prevPathname.current = pathname;

    if (cameFromLogin) {
      void refreshSession();
    }
  }, [pathname, refreshSession]);

  return (
    <CashSessionContext.Provider
      value={{
        activeSession,
        userProfile,
        loading,
        refreshSession,
        openSession,
        closeSession,
      }}
    >
      {children}
    </CashSessionContext.Provider>
  );
}

export function useCashSession() {
  const context = useContext(CashSessionContext);
  if (context === undefined) {
    throw new Error("useCashSession must be used within a CashSessionProvider");
  }
  return context;
}
