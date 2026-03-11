"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { useSkeletonNavigation } from "@/hooks/useSkeletonNavigation";
import { MyBudgetsSkeleton, CreateBudgetSkeleton } from "@/components/Skeleton";
import {
  getNotificationsSummary,
  markNotificationsSeen,
} from "@/services/budgets";
import type { NotificationItem } from "@/types/budget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [bellAnimate, setBellAnimate] = useState(false);
  const previousUnseenCountRef = useRef(0);
  const { isNavigating } = useSkeletonNavigation();
  const { user, accessToken, account, isAdmin, plan } = useAuth();
  const pathname = usePathname();

  const userDisplayName =
    account?.name ||
    (typeof user?.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
    (typeof user?.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    user?.email ||
    "Usuário";

  const userEmail = account?.email ?? user?.email ?? "usuario@email.com";
  const planLabel = plan === "PRO" ? "Pro" : "Free";

  const userInitials = userDisplayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";

  const loadNotifications = useCallback(async () => {
    if (!accessToken) return;
    try {
      setNotificationsLoading(true);
      const summary = await getNotificationsSummary(accessToken);
      setNotificationItems(summary.items);
      setUnseenCount(summary.unseenCount);
    } catch {
      // Falha de notificação não deve bloquear o layout.
    } finally {
      setNotificationsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(timer);
  }, [accessToken, loadNotifications]);

  useEffect(() => {
    if (unseenCount > previousUnseenCountRef.current) {
      setBellAnimate(true);
      const timer = window.setTimeout(() => setBellAnimate(false), 900);
      previousUnseenCountRef.current = unseenCount;
      return () => window.clearTimeout(timer);
    }

    previousUnseenCountRef.current = unseenCount;
  }, [unseenCount]);

  const handleOpenNotifications = async () => {
    if (!accessToken) {
      setNotificationsOpen(true);
      return;
    }

    let currentUnseenCount = unseenCount;
    try {
      setNotificationsLoading(true);
      const summary = await getNotificationsSummary(accessToken);
      setNotificationItems(summary.items);
      setUnseenCount(summary.unseenCount);
      currentUnseenCount = summary.unseenCount;
    } catch {
      // Se falhar, abre com o estado atual.
    } finally {
      setNotificationsLoading(false);
    }

    setNotificationsOpen(true);
    if (currentUnseenCount === 0) return;

    try {
      await markNotificationsSeen(accessToken);
      setUnseenCount(0);
    } catch {
      // Se falhar, mantém contador para nova tentativa.
    }
  };

  // Renderiza skeleton baseado na rota que está sendo navegada
  const renderSkeletonForRoute = () => {
    if (!isNavigating) return children;
    
    // Como não temos acesso direto à próxima rota durante navegação,
    // vamos usar um skeleton genérico que funciona bem para ambas as páginas
    if (pathname.includes('/my-budgets') || pathname.includes('/create-budget')) {
      return pathname.includes('/create-budget') ? 
        <CreateBudgetSkeleton /> : 
        <MyBudgetsSkeleton />;
    }
    
    return <MyBudgetsSkeleton />;
  };

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar lateral - apenas desktop */}
        <aside
          className={`hidden lg:flex shrink-0 flex-col border-r border-teal-600 bg-gradient-to-br from-teal-600 via-teal-700 to-green-800 transition-[width] duration-200 ${
            collapsed ? "w-16" : "w-56"
          }`}
        >
          <div className={`flex h-14 items-center border-b border-white/20 px-3 ${collapsed ? "justify-center" : "flex justify-between"}`}>
            {!collapsed ? (
              <>
                <div className="min-w-0 flex-1" />
                <Link
                  href="/dashboard"
                  className="shrink-0 text-lg font-semibold tracking-tight text-white"
                >
                  Orçamento já
                </Link>
                <div className="flex min-w-0 flex-1 justify-end">
                  <button
                    type="button"
                    onClick={() => setCollapsed((c) => !c)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/80 hover:bg-white/20 hover:text-white"
                    aria-label="Recolher menu"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setCollapsed((c) => !c)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/80 hover:bg-white/20 hover:text-white"
                aria-label="Expandir menu"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            )}
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            <NavLink href="/dashboard" collapsed={collapsed} icon="dashboard">
              Dashboard
            </NavLink>
            <NavLink href="/my-budgets" collapsed={collapsed} icon="list">
              Meus orçamentos
            </NavLink>
            <NavLink href="/create-budget" collapsed={collapsed} icon="document">
              Novo orçamento
            </NavLink>
            {isAdmin && (
              <NavLink href="/admin" collapsed={collapsed} icon="shield">
                Administração
              </NavLink>
            )}
          </nav>
          <div className="border-t border-white/20 p-3">
            <div className={`mb-3 flex items-center ${collapsed ? "justify-center" : "gap-2"}`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                {userInitials}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-white/90">{userEmail}</p>
                  <p className="mt-1 inline-flex rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
                    {planLabel}
                  </p>
                </div>
              )}
            </div>
            <LogoutButton collapsed={collapsed} />
          </div>
        </aside>

        {/* Container principal com header mobile */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Header mobile - apenas mobile */}
          <header className="relative flex lg:hidden shrink-0 items-center justify-between border-b border-white/20 bg-gradient-to-br from-teal-600 via-teal-700 to-green-800 px-4 py-3 z-50">
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-white">
              Orçamento já
            </Link>
            <div className="flex items-center gap-1">
              <NotificationButton unseenCount={unseenCount} onClick={handleOpenNotifications} animate={bellAnimate} />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200"
                aria-label="Menu"
              >
                <svg className={`h-6 w-6 transition-transform duration-200 ${mobileMenuOpen ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Menu mobile dropdown - overlay */}
            <div className={`absolute top-full left-0 right-0 bg-gradient-to-br from-teal-600 via-teal-700 to-green-800 border-b border-white/20 shadow-lg transition-all duration-200 ease-in-out origin-top z-40 ${
              mobileMenuOpen 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}>
              <nav className="flex flex-col p-4">
                <MobileNavLink 
                  href="/dashboard" 
                  icon="dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </MobileNavLink>
                <MobileNavLink 
                  href="/my-budgets" 
                  icon="list"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Meus orçamentos
                </MobileNavLink>
                <MobileNavLink 
                  href="/create-budget" 
                  icon="document"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Novo orçamento
                </MobileNavLink>
                {isAdmin && (
                  <MobileNavLink 
                    href="/admin" 
                    icon="shield"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Administração
                  </MobileNavLink>
                )}
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="mb-3 flex items-center gap-3 px-3 py-1">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                      {userInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-white/90">{userEmail}</p>
                      <p className="mt-1 inline-flex rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">
                        {planLabel}
                      </p>
                    </div>
                  </div>
                  <MobileLogoutButton onClick={() => setMobileMenuOpen(false)} />
                </div>
              </nav>
            </div>
          </header>

          <div className="hidden lg:flex shrink-0 items-center justify-end gap-3 border-b border-zinc-200 bg-white px-6 py-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${plan === "PRO" ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-700"}`}>
              Plano {planLabel}
            </span>
            <p className="text-sm font-medium text-zinc-700">
              Bem-vindo, <span className="text-zinc-900">{userDisplayName}</span>
            </p>
            <NotificationButton unseenCount={unseenCount} onClick={handleOpenNotifications} dark animate={bellAnimate} />
          </div>

          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 py-0 lg:py-6 sm:px-6">{renderSkeletonForRoute()}</main>
        </div>
      </div>

      <Modal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Assinaturas recentes"
      >
        <div className="space-y-3">
          {notificationsLoading && notificationItems.length === 0 && (
            <p className="text-sm text-zinc-500">Carregando notificações...</p>
          )}

          {!notificationsLoading && notificationItems.length === 0 && (
            <p className="text-sm text-zinc-500">Nenhuma assinatura encontrada.</p>
          )}

          {notificationItems.length > 0 && (
            <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {notificationItems.map((item) => (
                <li key={`${item.budgetId}-${item.signedAt}`} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-sm font-semibold text-zinc-900">{item.clientName ?? "Cliente não informado"}</p>
                  <p className="mt-1 text-sm text-zinc-700">{item.title}</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {formatCurrency(item.value)} • {formatDateTime(item.signedAt)}
                  </p>
                  <Link
                    href={`/dashboard/budget/${item.budgetId}`}
                    onClick={() => setNotificationsOpen(false)}
                    className="mt-2 inline-block text-xs font-medium text-teal-700 hover:text-teal-800"
                  >
                    Abrir orçamento
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </AuthGuard>
  );
}

function NotificationButton({
  unseenCount,
  onClick,
  dark = false,
  animate = false,
}: {
  unseenCount: number;
  onClick: () => void;
  dark?: boolean;
  animate?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Notificações"
      className={`relative isolate flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
        dark
          ? "text-amber-500 hover:bg-zinc-100 hover:text-amber-600"
          : "text-amber-300 hover:bg-white/20 hover:text-amber-200"
      }`}
    >
      {unseenCount > 0 && (
        <span className="absolute inset-2 rounded-full bg-amber-300/45 animate-pulse" aria-hidden />
      )}
      <svg
        className={`relative z-10 h-5 w-5 transition-transform duration-200 ${animate && unseenCount > 0 ? "scale-110" : unseenCount > 0 ? "animate-pulse" : "scale-100"}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      >
        <path d="M12 3a4 4 0 0 0-4 4v2.1c0 .9-.3 1.8-.9 2.5L5.5 14c-.6.7-.1 1.8.9 1.8h11.2c1 0 1.5-1.1.9-1.8l-1.6-2.4c-.6-.8-.9-1.6-.9-2.5V7a4 4 0 0 0-4-4Z" />
        <path d="M9.8 18a2.2 2.2 0 0 0 4.4 0" />
      </svg>
      {unseenCount > 0 && (
        <span className="pointer-events-none absolute right-0 top-0 z-20 inline-flex min-w-[1.25rem] -translate-y-1/4 translate-x-1/2 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white ring-2 ring-white">
          {unseenCount > 99 ? "99+" : unseenCount}
        </span>
      )}
    </button>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MobileNavLink({
  href,
  children,
  onClick,
  icon = "document",
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
  icon?: "dashboard" | "list" | "document" | "shield";
}) {
  const pathname = usePathname();
  const { navigateWithSkeleton } = useSkeletonNavigation();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  
  const handleClick = () => {
    onClick();
    navigateWithSkeleton(href);
  };
  
  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all duration-150 hover:scale-[1.02] w-full ${
        isActive
          ? "bg-white/20 text-white"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      {icon === "dashboard" ? (
        <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ) : icon === "list" ? (
        <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" x2="21" y1="6" y2="6" />
          <line x1="8" x2="21" y1="12" y2="12" />
          <line x1="8" x2="21" y1="18" y2="18" />
          <line x1="3" x2="3.01" y1="6" y2="6" />
          <line x1="3" x2="3.01" y1="12" y2="12" />
          <line x1="3" x2="3.01" y1="18" y2="18" />
        </svg>
      ) : icon === "shield" ? (
        <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3l7 3v6c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V6l7-3Z" />
          <path d="m9.5 12 1.8 1.8 3.2-3.6" />
        </svg>
      ) : (
        <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" x2="12" y1="18" y2="12" />
          <line x1="9" x2="15" y1="15" y2="15" />
        </svg>
      )}
      <span>{children}</span>
    </button>
  );
}

function MobileLogoutButton({ onClick }: { onClick: () => void }) {
  const { signOut } = useAuth();
  
  const handleLogout = () => {
    onClick();
    signOut();
  };
  
  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all duration-150 hover:scale-[1.02] text-white/80 hover:bg-white/10 hover:text-white w-full"
    >
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" x2="9" y1="12" y2="12" />
      </svg>
      <span>Sair</span>
    </button>
  );
}

function NavLink({
  href,
  children,
  collapsed,
  icon = "document",
}: {
  href: string;
  children: React.ReactNode;
  collapsed: boolean;
  icon?: "dashboard" | "list" | "document" | "shield";
}) {
  const pathname = usePathname();
  const { navigateWithSkeleton } = useSkeletonNavigation();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  
  return (
    <button
      onClick={() => navigateWithSkeleton(href)}
      title={collapsed ? (typeof children === "string" ? children : undefined) : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full ${
        collapsed ? "justify-center px-0" : ""
      } ${
        isActive
          ? "bg-white/20 text-white"
          : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      {icon === "dashboard" ? (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ) : icon === "list" ? (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" x2="21" y1="6" y2="6" />
          <line x1="8" x2="21" y1="12" y2="12" />
          <line x1="8" x2="21" y1="18" y2="18" />
          <line x1="3" x2="3.01" y1="6" y2="6" />
          <line x1="3" x2="3.01" y1="12" y2="12" />
          <line x1="3" x2="3.01" y1="18" y2="18" />
        </svg>
      ) : icon === "shield" ? (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3l7 3v6c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V6l7-3Z" />
          <path d="m9.5 12 1.8 1.8 3.2-3.6" />
        </svg>
      ) : (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" x2="12" y1="18" y2="12" />
          <line x1="9" x2="15" y1="15" y2="15" />
        </svg>
      )}
      {!collapsed && <span>{children}</span>}
    </button>
  );
}

function LogoutButton({ collapsed }: { collapsed: boolean }) {
  const { signOut } = useAuth();
  return (
    <button
      onClick={() => signOut()}
      title={collapsed ? "Sair" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-white/80 hover:bg-white/10 hover:text-white w-full ${
        collapsed ? "justify-center px-0" : "justify-start"
      }`}
    >
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" x2="9" y1="12" y2="12" />
      </svg>
      {!collapsed && <span>Sair</span>}
    </button>
  );
}
