"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { getActiveCashSession, openCashSession, closeCashSession, CashSession } from "@/lib/api/cash-sessions.api";

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

const CashSessionContext = createContext<CashSessionContextType | undefined>(undefined);

export function CashSessionProvider({ children }: { children: React.ReactNode }) {
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, role")
          .eq("id", user.id)
          .single();

        if (!error && profile) {
          setUserProfile(profile as UserProfile);
          
          // La sesión de caja es solo para recepcionistas
          if (profile.role === "receptionist") {
            const session = await getActiveCashSession(user.id);
            setActiveSession(session);
          } else {
            setActiveSession(null);
          }
        }
      } else {
        setUserProfile(null);
        setActiveSession(null);
      }
    } catch (error) {
      console.error("[CashSessionProvider] Error refreshing session:", error);
    } finally {
      setLoading(false);
    }
  };

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
    refreshSession();
  }, []);

  return (
    <CashSessionContext.Provider value={{
      activeSession,
      userProfile,
      loading,
      refreshSession,
      openSession,
      closeSession
    }}>
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
