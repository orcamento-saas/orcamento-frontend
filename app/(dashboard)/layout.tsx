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

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-zinc-50">
        {/* Sidebar lateral */}
        <aside
          className={`flex shrink-0 flex-col border-r border-zinc-200 bg-white transition-[width] duration-200 ${
            collapsed ? "w-16" : "w-56"
          }`}
        >
          <div className={`flex h-14 items-center border-b border-zinc-200 px-3 ${collapsed ? "justify-center" : "justify-between"}`}>
            {!collapsed && (
              <Link
                href="/dashboard"
                className="text-lg font-semibold tracking-tight text-zinc-900"
              >
                Orçamento
              </Link>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            >
              {collapsed ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              )}
            </button>
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
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-4 py-6 sm:px-6">{children}</main>
      </div>
    </AuthGuard>
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
      title={collapsed ? children : undefined}
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
