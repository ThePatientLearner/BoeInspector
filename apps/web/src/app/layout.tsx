import type { Metadata } from "next";
import { SiteMenu } from "@/components/SiteMenu";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agente BOE — el BOE, resumido cada día",
  description:
    "Resúmenes diarios de las disposiciones generales del BOE, generados por IA, con enlace al texto oficial. Servicio gratuito e independiente, no vinculado al BOE.",
};

/**
 * Olas del fondo. Tres capas del mismo trazo periódico (período 300 en un
 * viewBox de 1200) desplazándose en bucle: al trasladar el 50% exacto la
 * onda encaja consigo misma y el bucle es invisible. Los colores y
 * velocidades los pone el CSS (.waves).
 */
const WAVE_PATH =
  "M0,100 Q75,60 150,100 T300,100 T450,100 T600,100 T750,100 T900,100 T1050,100 T1200,100 V200 H0 Z";

function WaveBackground() {
  return (
    <div className="waves" aria-hidden="true">
      <svg viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d={WAVE_PATH} fill="#142238" />
      </svg>
      <svg viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d={WAVE_PATH} fill="#1b2f4d" />
      </svg>
      <svg viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d={WAVE_PATH} fill="rgba(201, 168, 106, 0.08)" />
      </svg>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <WaveBackground />
        <header className="site-header">
          {/* Aquí vivió un botón de donar. Se retiró a propósito: la gratuidad
              es un pilar de LEGAL.md (identificación reducida del art. 10 LSSI,
              límites de responsabilidad, marco de reutilización), y cobrar
              obligaría a rehacer las tres cosas. Está en el commit 4a68870 por
              si algún día se retoma. */}
          <div className="header-inner">
            <SiteMenu />
            <a href="/" className="site-title">
              Agente<span>BOE</span>.com
            </a>
            {/* Aviso obligatorio: transparencia IA + no oficialidad (LEGAL.md §5.2) */}
            <p className="site-disclaimer">
              Proyecto independiente y <strong className="disclaimer-highlight">gratuito</strong>.
              Los resúmenes los genera una IA y no sustituyen al texto oficial del BOE.
            </p>
          </div>
          <div className="flag-ribbon" aria-hidden="true" />
        </header>
        <main className="site-main">{children}</main>
        <footer className="site-footer">
          {/* El lema del proyecto vivía aquí; se subió al hero para que la
              portada llevase el peso simbólico y el pie solo informase. */}
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
