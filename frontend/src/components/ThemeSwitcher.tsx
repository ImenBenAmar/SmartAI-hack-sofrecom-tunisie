"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "auto";

const STORAGE_KEY = "theme";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("auto");

  // Initialize theme from DOM/localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
      } else {
        setTheme("auto");
      }
    } catch {}
  }, []);

  useEffect(() => {
    const apply = (t: Theme) => {
      if (t === "auto") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-bs-theme", prefersDark ? "dark" : "light");
      } else {
        document.documentElement.setAttribute("data-bs-theme", t);
      }
    };
    apply(theme);
  }, [theme]);

  const choose = (t: Theme) => {
    setTheme(t);
    try {
      if (t === "auto") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, t);
    } catch {}
  };

  return (
    <div className="dropdown">
      <button
        className="btn btn-outline-light dropdown-toggle"
        type="button"
        id="themeDropdown"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        Theme: {theme}
      </button>
      <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="themeDropdown">
        <li>
          <button className="dropdown-item" onClick={() => choose("light")}>Light</button>
        </li>
        <li>
          <button className="dropdown-item" onClick={() => choose("dark")}>Dark</button>
        </li>
        <li>
          <button className="dropdown-item" onClick={() => choose("auto")}>Auto</button>
        </li>
      </ul>
    </div>
  );
}
