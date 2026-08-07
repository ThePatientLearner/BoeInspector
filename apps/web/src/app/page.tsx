import { Countdown } from "@/components/Countdown";
import { EntryBrowser } from "@/components/EntryBrowser";
import { NotifyButton } from "@/components/NotifyButton";
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
        {/* Cuenta atrás a la izquierda del emblema, simétrica al botón de
            la derecha. En móvil pasa a quedar debajo del caption (ver CSS). */}
        <Countdown />
        {/* Botón sobre el emblema: anclado a la esquina superior derecha del
            hero en escritorio y, en móvil, a la de la pantalla (ver CSS). */}
        <NotifyButton />
        <div className="hero-caption">
          <h1>Resumen Diario y filtrado del BOE</h1>
          {/* La cita sustituye al subtítulo descriptivo: lo que motiva el
              servicio ya no necesita explicarse, basta con declararlo. */}
          <blockquote className="hero-quote">
            <p>«La información es la moneda de la democracia»</p>
            <cite>Thomas Jefferson</cite>
          </blockquote>
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
