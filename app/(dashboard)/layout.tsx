"use client";

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
  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-50">
        <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link
              href="/dashboard"
              className="text-lg font-semibold tracking-tight text-zinc-900"
            >
              Orçamento SaaS
            </Link>
            <nav className="flex items-center gap-2">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/create-budget">Novo orçamento</NavLink>
              <LogoutButton />
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </AuthGuard>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary-100 text-primary-700"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      {children}
    </Link>
  );
}

function LogoutButton() {
  const { signOut } = useAuth();
  return (
    <Button variant="ghost" size="sm" onClick={() => signOut()}>
      Sair
    </Button>
  );
}
