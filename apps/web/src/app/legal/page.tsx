import type { Metadata } from "next";
import { formatDate } from "@/lib/format";
import { ACTUALIZADO, EMAIL_CONTACTO, REPO_URL, SITIO_WEB, TITULAR } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Aviso legal — BOE Inspector",
  description:
    "Titular del servicio, independencia respecto del BOE, condiciones de reutilización, transparencia sobre el uso de IA y exención de responsabilidad.",
};

export default function LegalPage() {
  return (
    <article className="legal-page">
      <h1>Aviso legal</h1>

      {/* La cláusula de independencia no es opcional ni puede ir enterrada:
          es una obligación expresa de las condiciones de reutilización del
          BOE (LEGAL.md §1.3). Por eso abre la página, antes que nada. */}
      <div className="legal-warning">
        <p>
          <strong>
            BOE Inspector es un servicio privado e independiente. No es un servicio oficial, no está
            vinculado a la Agencia Estatal Boletín Oficial del Estado, y esta no participa,
            patrocina ni apoya en modo alguno esta actividad.
          </strong>
        </p>
        <p>
          El único texto con valor oficial es el publicado en{" "}
          <a href="https://www.boe.es" rel="noopener noreferrer">
            boe.es
          </a>
          . Ante cualquier discrepancia entre un resumen publicado aquí y el texto oficial,
          prevalece siempre el texto oficial.
        </p>
      </div>

      <h2>1. Titular del servicio</h2>
      <ul>
        <li>
          <strong>Titular:</strong> {TITULAR}
        </li>
        <li>
          <strong>Correo de contacto:</strong> <a href={`mailto:${EMAIL_CONTACTO}`}>{EMAIL_CONTACTO}</a>
        </li>
        <li>
          <strong>Sitio web:</strong> {SITIO_WEB}
        </li>
      </ul>
      <p>
        BOE Inspector es un servicio gratuito, sin publicidad, sin patrocinadores y sin ánimo de
        lucro. No se solicitan ni se aceptan donaciones ni pagos de ningún tipo.
      </p>

      <h2>2. Objeto del servicio</h2>
      <p>
        BOE Inspector publica resúmenes generados mediante inteligencia artificial de las
        disposiciones de la <strong>Sección I (Disposiciones generales)</strong> del Boletín Oficial
        del Estado, junto con el enlace al documento oficial correspondiente, que se muestra siempre
        por encima del resumen.
      </p>

      <h2>3. Reutilización de la información del BOE</h2>
      <p>
        Este servicio reutiliza información del sector público al amparo de la Ley 37/2007, de 16 de
        noviembre, sobre reutilización de la información del sector público, y del Real Decreto
        1495/2011, que la desarrolla para el ámbito estatal, conforme a las condiciones generales de
        reutilización publicadas por el BOE. En cumplimiento de dichas condiciones:
      </p>
      <ul>
        <li>
          <strong>Fuente:</strong> basado en datos de la Agencia Estatal Boletín Oficial del Estado
          (
          <a href="https://www.boe.es" rel="noopener noreferrer">
            www.boe.es
          </a>
          ).
        </li>
        <li>
          Cada disposición indica su fecha de publicación y la fecha de última actualización del
          texto oficial.
        </li>
        <li>
          Los resúmenes son <strong>obra derivada</strong> elaborada por BOE Inspector, se
          identifican como tales y no constituyen el texto oficial.
        </li>
        <li>No se altera ni desnaturaliza el sentido de la información original.</li>
      </ul>

      <h2>4. Contenido generado por inteligencia artificial</h2>
      <p>
        Conforme al artículo 50 del Reglamento (UE) 2024/1689 (Reglamento de Inteligencia
        Artificial), se informa de que{" "}
        <strong>
          los resúmenes publicados en este sitio han sido generados automáticamente mediante un
          sistema de inteligencia artificial
        </strong>
        . No han sido revisados individualmente por una persona antes de su publicación y pueden
        contener errores, omisiones o imprecisiones.
      </p>
      <p>
        Cada resumen indica el modelo que lo ha generado. El sistema aplica una segunda pasada
        automática de revisión contra el texto oficial, pero esa revisión también es automática y no
        sustituye a la lectura del original.
      </p>

      <h2>5. Exención de responsabilidad</h2>
      <p>Los resúmenes tienen carácter meramente informativo y divulgativo. En particular:</p>
      <ul>
        <li>
          <strong>No constituyen asesoramiento jurídico</strong> de ningún tipo, ni crean relación
          profesional alguna entre el usuario y el titular.
        </li>
        <li>
          <strong>No sustituyen a la lectura del texto oficial</strong> ni al asesoramiento de un
          profesional cualificado.
        </li>
        <li>
          El titular no responde de las decisiones adoptadas por el usuario sobre la base de estos
          resúmenes, ni de los daños derivados de errores, omisiones, retrasos o interrupciones del
          servicio.
        </li>
        <li>
          El servicio se presta de forma gratuita y{" "}
          <strong>sin garantía de disponibilidad, continuidad ni exhaustividad</strong>, y puede
          interrumpirse o cesar en cualquier momento sin previo aviso.
        </li>
      </ul>
      <p>Nada de lo anterior excluye la responsabilidad del titular por dolo o culpa grave.</p>

      <h2>6. Propiedad intelectual</h2>
      <p>
        Conforme al artículo 13 del Texto Refundido de la Ley de Propiedad Intelectual, las
        disposiciones legales y sus correspondientes textos oficiales no son objeto de propiedad
        intelectual.
      </p>
      <p>
        Los resúmenes, la selección, la estructura y el diseño del sitio son obra de BOE Inspector.
        Se permite su cita y enlace con indicación de la fuente. El código fuente del servicio es
        público y está disponible en{" "}
        <a href={REPO_URL} rel="noopener noreferrer">
          GitHub
        </a>
        .
      </p>

      <h2>7. Legislación aplicable</h2>
      <p>Las presentes condiciones se rigen por la legislación española.</p>

      <p className="legal-updated">
        Última actualización: {formatDate(ACTUALIZADO)} ·{" "}
        <a href="/privacidad">Política de privacidad</a>
      </p>
    </article>
  );
}
