"use client";

import { useEffect } from "react";

export default function BoostedClientInit() {
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Dynamically import Boosted JS on the client only
        await import("boosted/dist/js/boosted.min.js");
        // Optionally initialize tooltips if used
        // const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        // tooltipTriggerList.forEach((el) => new (window as any).bootstrap.Tooltip(el));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("Failed to load Boosted JS:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  return null;
}
