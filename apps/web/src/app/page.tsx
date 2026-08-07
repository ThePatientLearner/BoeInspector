import { EntryBrowser } from "@/components/EntryBrowser";
import { fetchDays } from "@/lib/api";

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

      {/* Los datos se piden en el servidor y el buscador vive en el cliente:
          la portada sigue llegando renderizada, con contenido para Google. */}
      {!days || days.length === 0 ? (
        <p className="empty-state">
          Todavía no hay boletines procesados. El servicio ingiere el BOE cada mañana (L–S).
        </p>
      ) : (
        <EntryBrowser days={days} />
      )}
    </>
  );
}
