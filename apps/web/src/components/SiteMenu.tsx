"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Menú de la cabecera. Por ahora solo enlaces externos, así que es un
 * desplegable simple y no navegación interna.
 *
 * Se cierra con Escape, al hacer clic fuera y al pulsar cualquier enlace.
 * Los tres comportamientos son necesarios: sin ellos el panel se queda
 * abierto tapando contenido cuando alguien lo abre por error.
 */
const LINKS = [
  {
    href: "https://www.boe.es",
    label: "Boletín Oficial del Estado",
    note: "La fuente oficial",
  },
  {
    href: "https://finanfocus.com",
    label: "Gestión de finanzas personales",
    note: "finanfocus.com",
  },
  {
    href: "https://x.com/ValueAcademia",
    label: "Síguenos en X",
    note: "@ValueAcademia",
  },
  {
    href: "https://www.youtube.com/@valueacademia7329/videos",
    label: "Aprende sobre mercados",
    note: "YouTube · gratis",
  },
] as const;

export function SiteMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // `mousedown` y no `click`: si el enlace de destino quita el elemento del
    // DOM, un `click` posterior ya no encuentra dónde comprobar el "fuera".
    const onOutside = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onOutside);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onOutside);
    };
  }, [open]);

  return (
    <div className="site-menu" ref={wrapRef}>
      <button
        type="button"
        className="menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="menu-bars" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="menu-word">Menú</span>
      </button>

      {open && (
        <div className="menu-panel" role="menu">
          {LINKS.map((link) => (
            <a
              key={link.href}
              className="menu-link"
              role="menuitem"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              <span className="menu-link-label">{link.label}</span>
              <span className="menu-link-note">{link.note}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
