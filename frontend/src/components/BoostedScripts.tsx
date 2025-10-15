"use client";

import { useEffect } from "react";

export default function BoostedScripts() {
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await import("boosted/dist/js/boosted.min.js");
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
