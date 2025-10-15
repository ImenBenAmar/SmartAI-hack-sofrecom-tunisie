"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type Theme = "light" | "dark" | "auto";

const STORAGE_KEY = "theme";

export default function ThemeSwitcherFloating() {
  const [theme, setTheme] = useState<Theme>("auto");
  const [prefersDark, setPrefersDark] = useState(false);

  // Read stored theme and system preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === "light" || stored === "dark") setTheme(stored);
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      setPrefersDark(media.matches);
      const handler = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
      media.addEventListener?.("change", handler);
      return () => media.removeEventListener?.("change", handler);
    } catch {
      // no-op
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const target = theme === "auto" ? (prefersDark ? "dark" : "light") : theme;
    document.documentElement.setAttribute("data-bs-theme", target);
  }, [theme, prefersDark]);

  const effectiveTheme = useMemo<Exclude<Theme, "auto">>(() => (theme === "auto" ? (prefersDark ? "dark" : "light") : theme), [theme, prefersDark]);

  const choose = (t: Theme) => {
    setTheme(t);
    try {
      if (t === "auto") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // no-op
    }
  };

  const iconSrc = (t: "light" | "dark" | "auto") =>
    t === "light" ? "/icons/ui-light-mode.svg" : t === "dark" ? "/icons/ui-dark-mode.svg" : "/icons/ui-auto-mode.svg";
  const isDark = effectiveTheme === "dark";
  // Light mode: white bg + grey border | Dark mode: black bg + grey border
  const btnClass = isDark
    ? "btn dropdown-toggle d-flex align-items-center justify-content-center theme-switcher-btn"
    : "btn dropdown-toggle d-flex align-items-center justify-content-center theme-switcher-btn";
  const btnStyle = isDark
    ? { width: 64, height: 44, backgroundColor: '#000', borderColor: '#6c757d', color: '#fff', borderWidth: 2 }
    : { width: 64, height: 44, backgroundColor: '#fff', borderColor: '#6c757d', color: '#000', borderWidth: 2 };
  const menuClass = `dropdown-menu dropdown-menu-end shadow border border-1 ${isDark ? "border-white" : "border-dark"}`;

  return (
  <div className="dropdown dropup position-fixed bottom-0 end-0 mb-3 me-3 z-3 bd-mode-toggle" data-bs-theme={isDark ? "dark" : "light"}>
      {/* Let control follow effective theme (light/dark) like in Boosted example */}
      <div>
        <button
          className={btnClass}
          type="button"
          id="bd-theme"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          title="Toggle mode"
          aria-label={`Toggle mode (${effectiveTheme})`}
          style={btnStyle}
        >
          <Image
            src={iconSrc(theme)}
            alt={theme === "auto" ? "Auto" : theme === "dark" ? "Dark" : "Light"}
            width={18}
            height={18}
            priority
            style={isDark ? { filter: 'invert(1) brightness(1.2)' } : {}}
          />
          <span className="visually-hidden" id="bd-theme-text">Toggle mode</span>
        </button>
        <ul className={menuClass} aria-labelledby="bd-theme-text">
          <li>
            <button
              className={`dropdown-item d-flex align-items-center gap-2${theme === "light" ? " active" : ""}`}
              onClick={() => choose("light")}
              aria-pressed={theme === "light"}
              data-bs-theme-value="light"
            >
              <Image src={iconSrc("light")} alt="Light" width={16} height={16} className="theme-icon" />
              <span>Light</span>
              {theme === "light" && <span className="ms-auto">✓</span>}
            </button>
          </li>
          <li>
            <button
              className={`dropdown-item d-flex align-items-center gap-2${theme === "dark" ? " active" : ""}`}
              onClick={() => choose("dark")}
              aria-pressed={theme === "dark"}
              data-bs-theme-value="dark"
            >
              <Image src={iconSrc("dark")} alt="Dark" width={16} height={16} className="theme-icon" />
              <span>Dark</span>
              {theme === "dark" && <span className="ms-auto">✓</span>}
            </button>
          </li>
          <li>
            <button
              className={`dropdown-item d-flex align-items-center gap-2${theme === "auto" ? " active" : ""}`}
              onClick={() => choose("auto")}
              aria-pressed={theme === "auto"}
              data-bs-theme-value="auto"
            >
              <Image src={iconSrc("auto")} alt="Auto" width={16} height={16} className="theme-icon" />
              <span>Auto</span>
              {theme === "auto" && <span className="ms-auto">✓</span>}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
