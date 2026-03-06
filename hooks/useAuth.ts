"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  accessToken: string | null;
}

// Cache de sessão para evitar verificações desnecessárias
let sessionCache: Session | null = null;
let lastCheck = 0;
const CACHE_DURATION = 30000; // 30 segundos

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    // Usar cache se disponível e recente
    const now = Date.now();
    if (sessionCache && (now - lastCheck) < CACHE_DURATION) {
      setSession(sessionCache);
      setUser(sessionCache?.user ?? null);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mountedRef.current) return;
      
      sessionCache = s;
      lastCheck = now;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mountedRef.current) return;
      
      sessionCache = s;
      lastCheck = Date.now();
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    sessionCache = null;
    lastCheck = 0;
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return {
    user,
    session,
    loading,
    signOut,
    accessToken: session?.access_token ?? null,
  };
}
