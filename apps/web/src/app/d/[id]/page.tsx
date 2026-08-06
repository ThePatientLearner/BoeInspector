import { notFound } from "next/navigation";
import { fetchEntry } from "@/lib/api";
import { formatDate } from "@/lib/format";

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await fetchEntry(id);
  if (!entry) notFound();

  return (
    <article className="dossier">
      <p className="case-label">
        Expediente {entry.id} · {entry.department}
      </p>
      <h1 className="dossier-title">{entry.title}</h1>
      <p className="entry-meta">
        Publicado el {formatDate(entry.publicationDate)} · Última actualización del texto oficial:{" "}
        {formatDate(entry.lastOfficialUpdateAt)}
      </p>

      {/* El enlace oficial va SIEMPRE por encima del resumen (LEGAL.md) */}
      <div className="official-links">
        <a className="btn-official" href={entry.officialHtmlUrl} rel="noopener noreferrer">
          Leer el texto oficial en boe.es
        </a>
        <a className="btn-secondary" href={entry.officialPdfUrl} rel="noopener noreferrer">
          PDF oficial
        </a>
      </div>

      {entry.bulletPoints ? (
        <section className="summary">
          <div className="summary-head">
            <h2>Resumen del caso</h2>
            <span className="stamp">Resumen IA · No oficial</span>
          </div>
          {entry.shortPhrase && <p className="summary-lead">{entry.shortPhrase}</p>}
          <ul>
            {entry.bulletPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="empty-state">El resumen de esta disposición aún se está generando.</p>
      )}

      <footer className="legal-note">
        <p>
          Resumen generado por inteligencia artificial{entry.model ? ` (${entry.model})` : ""}.
          Puede contener errores. El único texto con valor oficial es el publicado en el BOE.
        </p>
        <p>
          Basado en datos de la Agencia Estatal Boletín Oficial del Estado (www.boe.es). Última
          actualización del documento oficial: {formatDate(entry.lastOfficialUpdateAt)}. Este
          servicio es independiente y no está vinculado al BOE.
        </p>
      </footer>
    </article>
  );
}
