import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BOE Inspector — el BOE, resumido cada día",
  description:
    "Resúmenes diarios de las disposiciones generales del BOE, generados por IA, con enlace al texto oficial. Servicio gratuito e independiente, no vinculado al BOE.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="site-header">
          <a href="/" className="site-title">
            BOE Inspector
          </a>
          {/* Aviso obligatorio: transparencia IA + no oficialidad (LEGAL.md §5.2) */}
          <p className="site-disclaimer">
            Proyecto independiente y gratuito. Los resúmenes los genera una IA y no sustituyen al
            texto oficial del BOE.
          </p>
        </header>
        <main className="site-main">{children}</main>
        <footer className="site-footer">
          <p>
            Basado en datos de la{" "}
            <a href="https://www.boe.es" rel="noopener noreferrer">
              Agencia Estatal Boletín Oficial del Estado
            </a>
            . Servicio no oficial: el BOE no participa, patrocina ni apoya esta actividad.
          </p>
          <nav>
            <a href="/legal">Aviso legal</a> · <a href="/privacidad">Privacidad</a>
          </nav>
        </footer>
      </body>
    </html>
  );
}
