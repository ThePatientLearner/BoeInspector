"use client";

import { useMemo, useState } from "react";
import type { CatalogDay, CatalogEntry } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { ComingSoonButton } from "./ComingSoonButton";
import { ImpactMeter } from "./ImpactMeter";

/**
 * Portada con buscador.
 *
 * El filtrado ocurre en el navegador, no en el servidor, y eso es una decisión
 * consciente: la API sirve como mucho 15 días (`catalog.listDays(15)`), o sea
 * unas decenas de disposiciones y ~12 KB de JSON. Filtrar eso en local es
 * instantáneo y no cuesta ni una petición. Si algún día la portada pasara a
 * mostrar el archivo completo, este componente deja de ser la respuesta
 * correcta y habría que filtrar en la consulta SQL.
 */

/** Umbral mínimo, no selección suelta: se navega buscando "lo importante". */
const IMPACT_FILTERS = [
  { value: 1, label: "Todas" },
  { value: 2, label: "2+" },
  { value: 3, label: "3+" },
  { value: 4, label: "4+" },
  { value: 5, label: "Solo 5" },
] as const;

/** "canarias" debe encontrar "Canarias", y "aereo" debe encontrar "aéreo". */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Todo el texto visible de una ficha, en un solo campo buscable. */
function haystack(entry: CatalogEntry): string {
  return [
    entry.id,
    entry.title,
    entry.plainTitle ?? "",
    entry.department,
    entry.shortPhrase ?? "",
    ...(entry.bulletPoints ?? []),
  ].join(" ");
}

export function EntryBrowser({ days }: { days: CatalogDay[] }) {
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [minImpact, setMinImpact] = useState(1);

  // El texto normalizado se calcula una vez, no en cada pulsación de tecla.
  const index = useMemo(() => {
    const map = new Map<string, string>();
    for (const day of days) {
      for (const entry of day.entries) map.set(entry.id, normalize(haystack(entry)));
    }
    return map;
  }, [days]);

  const dates = days.map((day) => day.date).sort();
  const earliest = dates[0] ?? "";
  const latest = dates[dates.length - 1] ?? "";

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());

    return (
      days
        // Las fechas ISO se comparan como texto sin pasar por `Date`: el
        // formato YYYY-MM-DD ya ordena alfabéticamente igual que en el tiempo.
        .filter((day) => (!from || day.date >= from) && (!to || day.date <= to))
        .map((day) => ({
          ...day,
          entries: day.entries.filter((entry) => {
            // Sin resumen todavía no hay impacto: esas fichas solo aparecen
            // en "Todas", para que un filtro alto no prometa lo que no sabe.
            if ((entry.impact ?? 1) < minImpact) return false;
            if (!needle) return true;
            return (index.get(entry.id) ?? "").includes(needle);
          }),
        }))
        .filter((day) => day.entries.length > 0)
    );
  }, [days, query, from, to, minImpact, index]);

  const total = days.reduce((sum, day) => sum + day.entries.length, 0);
  const shown = filtered.reduce((sum, day) => sum + day.entries.length, 0);
  const filtering = query !== "" || from !== "" || to !== "" || minImpact !== 1;

  function reset() {
    setQuery("");
    setFrom("");
    setTo("");
    setMinImpact(1);
  }

  return (
    <>
      <section className="filters" aria-label="Filtros de búsqueda">
        <div className="filter-row">
          <label className="field field-search">
            <span>Buscar</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Palabra, ministerio, expediente…"
            />
          </label>

          <ComingSoonButton
            className="btn-download"
            label="⤓ Descargar resúmenes"
            message="La descarga de resúmenes estará disponible próximamente."
          />
        </div>

        <div className="filter-row">
          <label className="field field-date">
            <span>Desde</span>
            <input
              type="date"
              value={from}
              min={earliest}
              max={latest}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>

          <label className="field field-date">
            <span>Hasta</span>
            <input
              type="date"
              value={to}
              min={earliest}
              max={latest}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>

          <fieldset className="field field-impact">
            <legend>Impacto mínimo</legend>
            <div className="impact-filter">
              {IMPACT_FILTERS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`chip chip-${option.value}${
                    minImpact === option.value ? " on" : ""
                  }`}
                  aria-pressed={minImpact === option.value}
                  onClick={() => setMinImpact(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <p className="filter-summary" role="status">
          {filtering ? (
            <>
              <strong>{shown}</strong> de {total} disposiciones{" "}
              <button type="button" className="link-reset" onClick={reset}>
                Quitar filtros
              </button>
            </>
          ) : (
            <>
              {total} disposiciones · del {formatDate(earliest)} al {formatDate(latest)}
            </>
          )}
        </p>
      </section>

      {shown === 0 ? (
        <p className="empty-state">
          Ninguna disposición coincide con la búsqueda. Recuerda que la portada solo cubre los
          últimos días publicados.
        </p>
      ) : (
        filtered.map((day) => (
          <section key={day.date}>
            <h2 className="day-heading">BOE del {formatDate(day.date)}</h2>
            {day.entries.map((entry) => (
              <article key={entry.id} className="entry-card">
                <div className="entry-head">
                  <p className="case-label">Expediente {entry.id}</p>
                  {entry.impact !== null && <ImpactMeter impact={entry.impact} />}
                </div>
                {/* El titular es el título llano de la IA; si aún no existe,
                    se cae al oficial para no dejar la ficha sin encabezado. */}
                <h3 className="entry-title">
                  <a href={`/d/${entry.id}`}>{entry.plainTitle ?? entry.title}</a>
                </h3>
                <p className="entry-department">{entry.department}</p>
                {entry.shortPhrase ? (
                  <p className="entry-phrase">{entry.shortPhrase}</p>
                ) : (
                  <p className="entry-phrase">
                    <span className="badge-pending">Resumen en curso</span>
                  </p>
                )}
              </article>
            ))}
          </section>
        ))
      )}
    </>
  );
}
