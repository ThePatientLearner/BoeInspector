import { fetchDays } from "@/lib/api";
import { formatDate } from "@/lib/format";

export default async function HomePage() {
  const days = await fetchDays();

  return (
    <>
      <section className="hero">
        {/* La imagen vive en public/ y pesa ~380 KB; el degradado del CSS la
            funde con el fondo para que el titular sea legible encima. */}
        <img
          src="/emblema.jpg"
          alt="Emblema de BOE Inspector: figura dorada con lupa y pluma sobre fondo azul marino"
          width={1920}
          height={1047}
        />
        <div className="hero-caption">
          <h1>El BOE, bajo la lupa cada mañana</h1>
          <p>
            Cada disposición general, resumida por IA en lenguaje claro — con el texto oficial
            siempre a un clic.
          </p>
        </div>
      </section>

      {!days || days.length === 0 ? (
        <p className="empty-state">
          Todavía no hay boletines procesados. El servicio ingiere el BOE cada mañana (L–S).
        </p>
      ) : (
        days.map((day) => (
          <section key={day.date}>
            <h2 className="day-heading">BOE del {formatDate(day.date)}</h2>
            {day.entries.map((entry) => (
              <article key={entry.id} className="entry-card">
                <p className="case-label">Expediente {entry.id}</p>
                <h3 className="entry-title">
                  <a href={`/d/${entry.id}`}>{entry.title}</a>
                </h3>
                <p className="entry-meta">{entry.department}</p>
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
