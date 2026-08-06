import { notFound } from "next/navigation";
import { fetchEntry } from "@/lib/api";

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await fetchEntry(id);
  if (!entry) notFound();

  return (
    <article>
      <h1 className="entry-title">{entry.title}</h1>
      <p className="entry-meta">
        {entry.department} · {entry.id} · Publicado el {entry.publicationDate}
      </p>

      {/* El enlace oficial va SIEMPRE por encima del resumen (LEGAL.md) */}
      <p>
        📄{" "}
        <a href={entry.officialHtmlUrl} rel="noopener noreferrer">
          Leer el texto oficial completo en boe.es
        </a>{" "}
        (
        <a href={entry.officialPdfUrl} rel="noopener noreferrer">
          PDF
        </a>
        )
      </p>

      {entry.bulletPoints ? (
        <>
          <h2>Resumen por puntos</h2>
          {entry.shortPhrase && <p>{entry.shortPhrase}</p>}
          <ul>
            {entry.bulletPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </>
      ) : (
        <p className="empty-state">El resumen de esta disposición aún se está generando.</p>
      )}

      <footer className="site-disclaimer">
        <p>
          ⚖️ Resumen generado por inteligencia artificial{entry.model ? ` (${entry.model})` : ""}.
          Puede contener errores. El único texto con valor oficial es el publicado en el BOE.
        </p>
        <p>
          Basado en datos de la Agencia Estatal Boletín Oficial del Estado (www.boe.es). Última
          actualización del documento oficial: {entry.lastOfficialUpdateAt}. Este servicio es
          independiente y no está vinculado al BOE.
        </p>
      </footer>
    </article>
  );
}
