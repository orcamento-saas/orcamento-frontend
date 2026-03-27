"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * Hook personalizado para navegação com skeleton loading
 * Implementa uma experiência de navegação mais suave mostrando skeleton
 * antes da mudança de rota
 */
export function useSkeletonNavigation() {
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Reseta o estado quando a rota muda
  useEffect(() => {
    setIsNavigating(false);
    setPendingHref(null);
  }, [pathname]);

  const navigateWithSkeleton = useCallback((href: string) => {
    // Se já estivermos navegando, ignora
    if (isNavigating) return;

    // Se estivermos tentando navegar para a mesma rota, ignora
    if (pathname === href) return;

    setIsNavigating(true);
    setPendingHref(href);
    router.push(href);
  }, [router, pathname, isNavigating]);

  const resetNavigation = useCallback(() => {
    setIsNavigating(false);
    setPendingHref(null);
  }, []);

  return {
    isNavigating,
    pendingHref,
    navigateWithSkeleton,
    resetNavigation
  };
}