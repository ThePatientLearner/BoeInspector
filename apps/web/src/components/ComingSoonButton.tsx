"use client";

import { useEffect, useState } from "react";

/**
 * Botón para una función que todavía no existe.
 *
 * Si recibe `href` se comporta como un enlace normal; si no, avisa de que la
 * función está en camino. Esa bifurcación deja el aviso como un estado del
 * botón y no como un botón distinto, así que activar la función el día de
 * mañana es pasarle un destino, no reescribir la cabecera.
 */
export function ComingSoonButton({
  label,
  message,
  className,
  href,
}: {
  label: string;
  message: string;
  className: string;
  href?: string;
}) {
  const [notice, setNotice] = useState(false);

  // El aviso se retira solo: obligar a cerrarlo sería más fricción que la
  // propia información que da.
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(false), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  if (href) {
    return (
      <a className={className} href={href} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    );
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setNotice(true)}>
        {label}
      </button>
      {/* role="status" hace que el lector de pantalla lo anuncie sin robar el
          foco, que sigue en el botón que acaba de pulsarse. */}
      {notice && (
        <div className="toast" role="status">
          {message}
        </div>
      )}
    </>
  );
}
