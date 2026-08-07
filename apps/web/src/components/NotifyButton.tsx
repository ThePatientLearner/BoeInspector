"use client";

import { useEffect, useRef, useState } from "react";

const TELEGRAM_URL = "https://t.me/EscudoFinanciero";
const DISCORD_URL = "https://discord.gg/EEq8CtKQqu";

/**
 * Botón "Notificar gratis" en la cabecera. Al pulsarlo abre una ventana con
 * dos accesos al canal de Telegram y al servidor de Discord donde se
 * publican los avisos.
 *
 * La modal se cierra con la tecla Escape, haciendo clic en el fondo o con el
 * botón de cierre. Al abrirse, el foco pasa al primer botón accionable para
 * que el lector de pantalla y el teclado no se queden en el disparador.
 */
export function NotifyButton() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="notify-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className="notify-icons" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="notify-icon notify-icon-tg">
            <path
              fill="currentColor"
              d="M21.5 3.4 2.7 10.6c-1.2.5-1.2 1.3-.2 1.6l4.8 1.5 1.9 5.6c.2.6.4.8.8.9.4 0 .7-.2 1-.4l2.4-2.3 4.9 3.6c.9.5 1.6.2 1.8-.8l3.3-15.5c.3-1.4-.5-2-1.9-1.4Z"
            />
          </svg>
          <svg viewBox="0 0 24 24" className="notify-icon notify-icon-dc">
            <path
              fill="currentColor"
              d="M19.3 5.3a16.4 16.4 0 0 0-4.1-1.3l-.2.4a14.4 14.4 0 0 1 3.7 1.1 13.5 13.5 0 0 0-12.4 0c1.1-.5 2.3-.9 3.7-1.1l-.2-.4a16.4 16.4 0 0 0-4.1 1.3 17 17 0 0 0-2.9 11c1.7 1.3 3.3 2 4.9 2.5l.6-1a11 11 0 0 1-2-1l.5-.4a12.2 12.2 0 0 0 10.4 0l.5.4-2 1 .6 1c1.6-.5 3.2-1.2 4.9-2.5.2-4.1-.7-7.9-2.9-11ZM9 14.3c-1 0-1.7-.9-1.7-1.9S8.1 10.5 9 10.5c1 0 1.8.9 1.7 1.9 0 1-.8 1.9-1.7 1.9Zm6 0c-1 0-1.7-.9-1.7-1.9s.8-1.9 1.7-1.9c1 0 1.8.9 1.7 1.9 0 1-.7 1.9-1.7 1.9Z"
            />
          </svg>
        </span>
        Notificar gratis
      </button>

      {open && (
        <div
          className="notify-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            className="notify-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="notify-title"
          >
            <button
              type="button"
              className="notify-close"
              aria-label="Cerrar"
              ref={closeRef}
              onClick={() => setOpen(false)}
            >
              ×
            </button>
            <h2 id="notify-title" className="notify-title">
              ¿Cómo te notificamos?
            </h2>
            <p className="notify-subtitle">
              Se notificarán comunicados de relevancia 3, 4 y 5, omitiendo las de 1 y 2 de menos
              relevancia.
            </p>
            <div className="notify-actions">
              <a
                className="notify-channel notify-channel-tg"
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M21.5 3.4 2.7 10.6c-1.2.5-1.2 1.3-.2 1.6l4.8 1.5 1.9 5.6c.2.6.4.8.8.9.4 0 .7-.2 1-.4l2.4-2.3 4.9 3.6c.9.5 1.6.2 1.8-.8l3.3-15.5c.3-1.4-.5-2-1.9-1.4Z"
                  />
                </svg>
                Telegram
              </a>
              <a
                className="notify-channel notify-channel-dc"
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M19.3 5.3a16.4 16.4 0 0 0-4.1-1.3l-.2.4a14.4 14.4 0 0 1 3.7 1.1 13.5 13.5 0 0 0-12.4 0c1.1-.5 2.3-.9 3.7-1.1l-.2-.4a16.4 16.4 0 0 0-4.1 1.3 17 17 0 0 0-2.9 11c1.7 1.3 3.3 2 4.9 2.5l.6-1a11 11 0 0 1-2-1l.5-.4a12.2 12.2 0 0 0 10.4 0l.5.4-2 1 .6 1c1.6-.5 3.2-1.2 4.9-2.5.2-4.1-.7-7.9-2.9-11ZM9 14.3c-1 0-1.7-.9-1.7-1.9S8.1 10.5 9 10.5c1 0 1.8.9 1.7 1.9 0 1-.8 1.9-1.7 1.9Zm6 0c-1 0-1.7-.9-1.7-1.9s.8-1.9 1.7-1.9c1 0 1.8.9 1.7 1.9 0 1-.7 1.9-1.7 1.9Z"
                  />
                </svg>
                Discord
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}