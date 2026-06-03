"use client";

import { useEffect, useRef } from "react";
import {
  trackLandingPageEnter,
  trackLandingSessionEnd,
} from "@/lib/trafficAnalytics";

/** Registra entrada e tempo na landing ao sair da página. */
export function useLandingTraffic(): void {
  const endedRef = useRef(false);

  useEffect(() => {
    trackLandingPageEnter();
    endedRef.current = false;

    const endOnce = () => {
      if (endedRef.current) {
        return;
      }
      endedRef.current = true;
      trackLandingSessionEnd();
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        endOnce();
      }
    };

    window.addEventListener("pagehide", endOnce);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pagehide", endOnce);
      document.removeEventListener("visibilitychange", onVisibility);
      endOnce();
    };
  }, []);
}
