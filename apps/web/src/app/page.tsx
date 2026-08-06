import { fetchDays } from "@/lib/api";

export default async function HomePage() {
  const days = await fetchDays();

  if (!days || days.length === 0) {
    return (
      <p className="empty-state">
        Todavía no hay boletines procesados. El servicio ingiere el BOE cada mañana (L–S).
      </p>
    );
  }

  return (
    <>
      {days.map((day) => (
        <section key={day.date}>
          <h2 className="day-heading">BOE del {formatDate(day.date)}</h2>
          {day.entries.map((entry) => (
            <article key={entry.id} className="entry-card">
              <h3 className="entry-title">
                <a href={`/d/${entry.id}`}>{entry.title}</a>
              </h3>
              <p className="entry-meta">
                {entry.department} · {entry.id}
              </p>
              {entry.shortPhrase && <p className="entry-phrase">{entry.shortPhrase}</p>}
            </article>
          ))}
        </section>
      ))}
    </>
  );
}

function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
