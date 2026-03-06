"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-zinc-50">
        {/* Sidebar lateral - apenas desktop */}
        <aside
          className={`hidden lg:flex shrink-0 flex-col border-r border-zinc-200 bg-white transition-[width] duration-200 ${
            collapsed ? "w-16" : "w-56"
          }`}
        >
          <div className={`flex h-14 items-center border-b border-zinc-200 px-3 ${collapsed ? "justify-center" : "flex justify-between"}`}>
            {!collapsed ? (
              <>
                <div className="min-w-0 flex-1" />
                <Link
                  href="/dashboard"
                  className="shrink-0 text-lg font-semibold tracking-tight text-zinc-900"
                >
                  Orçamento
                </Link>
                <div className="flex min-w-0 flex-1 justify-end">
                  <button
                    type="button"
                    onClick={() => setCollapsed((c) => !c)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
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
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
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
          </nav>
          <div className="border-t border-zinc-200 p-3">
            <LogoutButton collapsed={collapsed} />
          </div>
        </aside>

        {/* Container principal com header mobile */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Header mobile - apenas mobile */}
          <header className="flex lg:hidden shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-zinc-900">
              Orçamento
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-all duration-200"
              aria-label="Menu"
            >
              <svg className={`h-6 w-6 transition-transform duration-200 ${mobileMenuOpen ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </button>
          </header>

          {/* Dropdown mobile menu */}
          <div className={`lg:hidden fixed inset-0 z-50 transition-all duration-200 ease-in-out ${
            mobileMenuOpen 
              ? 'opacity-100 pointer-events-auto' 
              : 'opacity-0 pointer-events-none'
          }`}>
            <div
              className="absolute inset-0 bg-zinc-900/20 backdrop-blur-sm transition-opacity duration-200"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className={`absolute top-[73px] left-0 right-0 border-b border-zinc-200 bg-white shadow-lg transition-all duration-200 ease-in-out origin-top ${
              mobileMenuOpen 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-95 -translate-y-4'
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
                <div className="mt-4 pt-4 border-t border-zinc-200">
                  <MobileLogoutButton onClick={() => setMobileMenuOpen(false)} />
                </div>
              </nav>
            </div>
          </div>

          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 py-0 lg:py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
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
  icon?: "dashboard" | "list" | "document";
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all duration-150 hover:scale-[1.02] ${
        isActive
          ? "bg-primary-100 text-primary-700"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
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
      ) : (
        <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" x2="12" y1="18" y2="12" />
          <line x1="9" x2="15" y1="15" y2="15" />
        </svg>
      )}
      <span>{children}</span>
    </Link>
  );
}

function MobileLogoutButton({ onClick }: { onClick: () => void }) {
  const { signOut } = useAuth();
  
  const handleLogout = () => {
    onClick();
    signOut();
  };
  
  return (
    <Button
      variant="ghost"
      size="md"
      onClick={handleLogout}
      className="w-full justify-start text-base"
    >
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" x2="9" y1="12" y2="12" />
      </svg>
      <span>Sair</span>
    </Button>
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
  icon?: "dashboard" | "list" | "document";
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      title={collapsed ? (typeof children === "string" ? children : undefined) : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        collapsed ? "justify-center px-0" : ""
      } ${
        isActive
          ? "bg-primary-100 text-primary-700"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
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
      ) : (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" x2="12" y1="18" y2="12" />
          <line x1="9" x2="15" y1="15" y2="15" />
        </svg>
      )}
      {!collapsed && <span>{children}</span>}
    </Link>
  );
}

function LogoutButton({ collapsed }: { collapsed: boolean }) {
  const { signOut } = useAuth();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => signOut()}
      title={collapsed ? "Sair" : undefined}
      className={`w-full ${collapsed ? "justify-center px-0" : "justify-start"}`}
    >
      <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" x2="9" y1="12" y2="12" />
      </svg>
      {!collapsed && <span>Sair</span>}
    </Button>
  );
}
