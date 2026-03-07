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
  const router = useRouter();
  const pathname = usePathname();

  // Reseta o estado quando a rota muda
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const navigateWithSkeleton = useCallback((href: string, delay: number = 100) => {
    // Se já estivermos navegando, ignora
    if (isNavigating) return;
    
    // Se estivermos tentando navegar para a mesma rota, ignora
    if (pathname === href) return;

    setIsNavigating(true);
    
    // Pequeno delay para mostrar o skeleton antes da navegação
    setTimeout(() => {
      router.push(href);
    }, delay);
  }, [router, pathname, isNavigating]);

  const resetNavigation = useCallback(() => {
    setIsNavigating(false);
  }, []);

  return {
    isNavigating,
    navigateWithSkeleton,
    resetNavigation
  };
}