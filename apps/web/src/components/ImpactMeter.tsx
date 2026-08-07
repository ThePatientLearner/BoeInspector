/**
 * Indicador de impacto (1-5) que decide la IA.
 *
 * Cinco barras en vez de un número suelto: se lee de un vistazo al hojear la
 * portada y permite comparar disposiciones entre sí. El color va del verde
 * (trámite interno) al rojo (afecta a casi todo el mundo).
 */
const LABELS: Record<number, string> = {
  1: "Trámite interno",
  2: "Colectivo reducido",
  3: "Colectivo amplio",
  4: "Impacto alto",
  5: "Impacto muy alto",
};

export function ImpactMeter({ impact }: { impact: number }) {
  const level = Math.min(5, Math.max(1, Math.round(impact)));
  const label = LABELS[level] ?? "";

  return (
    <span
      className={`impact impact-${level}`}
      /* El lector de pantalla oye la frase; las barras son decorativas. */
      title={`Impacto ${level} de 5 · ${label}`}
    >
      <span className="impact-bars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((step) => (
          <i key={step} className={step <= level ? "on" : ""} />
        ))}
      </span>
      <span className="impact-label">{label}</span>
      <span className="sr-only">Impacto {level} de 5</span>
    </span>
  );
}
