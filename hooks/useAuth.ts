"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { AccountSummary, UserPlan } from "@/types/account";
import type { ApiError } from "@/lib/api";
import { getCurrentAccount } from "@/services/account";
import { trackLoginEvent, trackLogoutEvent } from "@/services/authEvents";

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  accessToken: string | null;
  account: AccountSummary | null;
  isAdmin: boolean;
  plan: UserPlan | null;
  isSuspended: boolean;
}

// Cache de sessão para evitar verificações desnecessárias
let sessionCache: Session | null = null;
let lastCheck = 0;
let accountCache: AccountSummary | null = null;
let accountCacheToken: string | null = null;
let accountLastCheck = 0;
let accountRequest: Promise<AccountSummary | null> | null = null;
const CACHE_DURATION = 30000; // 30 segundos

function getAccountDisplayName(user: User | null): string | undefined {
  if (!user) {
    return undefined;
  }

  if (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()) {
    return user.user_metadata.name.trim();
  }

  if (
    typeof user.user_metadata?.full_name === "string" &&
    user.user_metadata.full_name.trim()
  ) {
    return user.user_metadata.full_name.trim();
  }

  return undefined;
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as { message?: unknown }).message === "string" &&
    typeof (error as { status?: unknown }).status === "number"
  );
}

function buildFallbackAccount(
  sessionUser: User | null,
  suspended: boolean
): AccountSummary | null {
  if (!sessionUser) {
    return null;
  }

  return {
    id: sessionUser.id,
    email: sessionUser.email ?? "",
    name: getAccountDisplayName(sessionUser),
    plan: "FREE",
    isAdmin: false,
    suspended,
  };
}

async function loadAccount(
  accessToken: string,
  sessionUser: User | null
): Promise<AccountSummary | null> {
  const now = Date.now();
  if (
    accountCache &&
    accountCacheToken === accessToken &&
    now - accountLastCheck < CACHE_DURATION
  ) {
    return accountCache;
  }

  if (accountRequest) {
    return accountRequest;
  }

  accountRequest = getCurrentAccount(accessToken)
    .then((account) => {
      accountCache = account;
      accountCacheToken = accessToken;
      accountLastCheck = Date.now();
      return account;
    })
    .catch((error: unknown) => {
      if (isApiError(error) && error.code === "ACCOUNT_SUSPENDED") {
        const fallback = buildFallbackAccount(sessionUser, true);
        accountCache = fallback;
        accountCacheToken = accessToken;
        accountLastCheck = Date.now();
        return fallback;
      }

      return null;
    })
    .finally(() => {
      accountRequest = null;
    });

  return accountRequest;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [accountLoading, setAccountLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const syncAccount = async (nextSession: Session | null): Promise<void> => {
      if (!mountedRef.current) {
        return;
      }

      if (!nextSession?.access_token) {
        setAccount(null);
        setAccountLoading(false);
        return;
      }

      setAccountLoading(true);
      const nextAccount = await loadAccount(nextSession.access_token, nextSession.user);
      if (!mountedRef.current) {
        return;
      }

      setAccount(nextAccount);
      setAccountLoading(false);
    };
    
    // Usar cache se disponível e recente
    const now = Date.now();
    if (sessionCache && (now - lastCheck) < CACHE_DURATION) {
      setSession(sessionCache);
      setUser(sessionCache?.user ?? null);
      setSessionLoading(false);
      void syncAccount(sessionCache);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mountedRef.current) return;
      
      sessionCache = s;
      lastCheck = Date.now();
      setSession(s);
      setUser(s?.user ?? null);
      setSessionLoading(false);
      void syncAccount(s);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mountedRef.current) return;
      
      sessionCache = s;
      lastCheck = Date.now();
      setSession(s);
      setUser(s?.user ?? null);
      setSessionLoading(false);
      void syncAccount(s);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    const token = session?.access_token ?? null;
    if (token) {
      try {
        await trackLogoutEvent(token);
      } catch {
        // Falha no rastreio de logout não deve impedir o signout do Supabase.
      }
    }

    sessionCache = null;
    lastCheck = 0;
    accountCache = null;
    accountCacheToken = null;
    accountLastCheck = 0;
    accountRequest = null;
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    const key = `login-event-${session.access_token.slice(0, 24)}`;
    if (typeof window !== "undefined" && window.sessionStorage.getItem(key)) {
      return;
    }

    trackLoginEvent(session.access_token)
      .then(() => {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(key, "1");
        }
      })
      .catch(() => {
        // Rastreamento é best effort para não degradar autenticação.
      });
  }, [session?.access_token]);

  const loading = sessionLoading || (session !== null && accountLoading);

  return {
    user,
    session,
    loading,
    signOut,
    accessToken: session?.access_token ?? null,
    account,
    isAdmin: account?.isAdmin ?? false,
    plan: account?.plan ?? null,
    isSuspended: account?.suspended ?? false,
  };
}
