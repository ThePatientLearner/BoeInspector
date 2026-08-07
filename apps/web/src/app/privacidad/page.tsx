import type { Metadata } from "next";
import { formatDate } from "@/lib/format";
import { ACTUALIZADO, EMAIL_PRIVACIDAD, TITULAR } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de privacidad — BOE Inspector",
  description:
    "Qué datos trata BOE Inspector, con qué base jurídica, qué proveedores intervienen, y cómo solicitar la supresión o desindexación de contenidos.",
};

export default function PrivacidadPage() {
  return (
    <article className="legal-page">
      <h1>Política de privacidad</h1>

      <div className="legal-warning">
        <p>
          <strong>Este sitio no utiliza cookies, ni analítica, ni recursos de terceros.</strong> No
          hay publicidad, ni perfilado, ni venta o cesión de datos. No existe lista de correo: la
          distribución se hace por canales públicos de Telegram y Discord.
        </p>
      </div>

      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li>
          <strong>Responsable:</strong> {TITULAR}
        </li>
        <li>
          <strong>Contacto en materia de protección de datos:</strong>{" "}
          <a href={`mailto:${EMAIL_PRIVACIDAD}`}>{EMAIL_PRIVACIDAD}</a>
        </li>
      </ul>

      <h2>2. Qué datos tratamos y con qué finalidad</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Tratamiento</th>
              <th>Datos</th>
              <th>Finalidad</th>
              <th>Base jurídica</th>
              <th>Conservación</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Navegación web</td>
              <td>Dirección IP y datos técnicos del navegador, en los registros del servidor</td>
              <td>Prestar el servicio y garantizar su seguridad</td>
              <td>Interés legítimo (art. 6.1.f RGPD)</td>
              <td>El plazo del proveedor de alojamiento, en ningún caso más de 12 meses</td>
            </tr>
            <tr>
              <td>Consultas y solicitudes</td>
              <td>Los que la persona facilite en su mensaje</td>
              <td>Atender la consulta o la solicitud de derechos</td>
              <td>Consentimiento (art. 6.1.a RGPD)</td>
              <td>1 año desde su resolución</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        No se realiza ningún otro tratamiento. En particular,{" "}
        <strong>no se toman decisiones automatizadas con efectos jurídicos</strong> sobre las
        personas usuarias.
      </p>

      <h2>3. Datos personales contenidos en el BOE</h2>
      <p>
        El Boletín Oficial del Estado contiene, en determinadas secciones, datos personales de
        terceros (nombramientos, procesos selectivos, sanciones, notificaciones edictales). Nuestra
        política al respecto:
      </p>
      <ol>
        <li>
          <strong>Publicamos únicamente la Sección I (Disposiciones generales)</strong>, que por su
          naturaleza normativa no contiene datos personales identificativos de forma sistemática.
        </li>
        <li>
          El buscador del sitio opera sobre títulos, ministerios y resúmenes de esas disposiciones.{" "}
          <strong>No ofrecemos búsqueda por nombre de persona</strong> ni ninguna funcionalidad
          orientada a construir el perfil de un individuo a partir de publicaciones oficiales.
        </li>
        <li>
          Cualquier persona puede solicitar la supresión o desindexación de contenidos que le
          afecten, conforme al procedimiento del apartado 6.
        </li>
      </ol>

      <h2>4. Proveedores</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Servicio</th>
              <th>¿Trata datos de usuarios?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Vercel Inc.</td>
              <td>Alojamiento de la web</td>
              <td>Sí, registros de acceso — encargado del tratamiento</td>
            </tr>
            <tr>
              <td>Cloudflare, Inc.</td>
              <td>DNS y transporte del tráfico hacia la API</td>
              <td>Sí, registros de acceso — encargado del tratamiento</td>
            </tr>
            <tr>
              <td>MiniMax</td>
              <td>Generación de los resúmenes</td>
              <td>
                <strong>No</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        {/* Esta separación es de diseño, no una casualidad: es lo que permite
            usar cualquier proveedor de IA sin arrastrar obligaciones de
            transferencia internacional de datos (LEGAL.md §2.4). */}
        Al servicio de inteligencia artificial se le envía{" "}
        <strong>exclusivamente el texto público de las disposiciones del BOE</strong>, que ya es
        información pública oficial. <strong>Nunca se le envían datos de las personas usuarias</strong>
        , por lo que no actúa como encargado del tratamiento y su ubicación no plantea un problema
        de transferencia internacional de datos personales.
      </p>
      <p>
        La base de datos del servicio se aloja en equipamiento propio del titular, no en un
        proveedor externo.
      </p>

      <h2>5. Derechos de las personas interesadas</h2>
      <p>
        Puedes ejercer en cualquier momento tus derechos de <strong>acceso, rectificación,
        supresión, limitación, portabilidad y oposición</strong>, así como retirar el consentimiento
        prestado —sin que ello afecte a la licitud del tratamiento previo—, escribiendo a{" "}
        <a href={`mailto:${EMAIL_PRIVACIDAD}`}>{EMAIL_PRIVACIDAD}</a>.
      </p>
      <p>
        Si consideras que el tratamiento no se ajusta a la normativa, puedes presentar una
        reclamación ante la{" "}
        <a href="https://www.aepd.es" rel="noopener noreferrer">
          Agencia Española de Protección de Datos
        </a>
        .
      </p>
      <p>
        Para dejar de recibir los avisos basta con abandonar el canal de Telegram o de Discord. No
        tratamos ningún dato identificativo de sus miembros: esas listas las gestiona cada
        plataforma bajo su propia política de privacidad.
      </p>

      <h2>6. Supresión y desindexación de contenidos</h2>
      <p>
        Si eres una persona física cuyos datos aparecen en una disposición publicada en este sitio y
        consideras que su difusión perjudica tus derechos, puedes solicitar su supresión o
        desindexación escribiendo a{" "}
        <a href={`mailto:${EMAIL_PRIVACIDAD}`}>{EMAIL_PRIVACIDAD}</a> e indicando la URL concreta y
        el motivo. No es necesario que aportes documentación identificativa en la primera
        comunicación.
      </p>
      <p>Nuestro compromiso:</p>
      <ol>
        <li>Acusamos recibo en 48 horas.</li>
        <li>Resolvemos en un plazo máximo de 30 días (art. 12 RGPD).</li>
        <li>
          Si la solicitud es estimada, la página se elimina o se marca como no indexable y se
          solicita a los motores de búsqueda su desindexación.
        </li>
        <li>Te informamos por escrito de la decisión y, si es denegatoria, del motivo.</li>
      </ol>
      <p>
        La supresión afecta a este sitio, no al Boletín Oficial del Estado: el texto oficial seguirá
        publicado en{" "}
        <a href="https://www.boe.es" rel="noopener noreferrer">
          boe.es
        </a>
        , cuya gestión no nos corresponde.
      </p>

      <h2>7. Cookies</h2>
      <p>
        <strong>Este sitio no instala ninguna cookie</strong>, ni propia ni de terceros, ni utiliza
        almacenamiento local del navegador. Tampoco carga fuentes, scripts ni imágenes alojadas en
        servidores ajenos. Por eso no se muestra ningún banner de cookies: no hay nada que
        consentir.
      </p>

      <p className="legal-updated">
        Última actualización: {formatDate(ACTUALIZADO)} · <a href="/legal">Aviso legal</a>
      </p>
    </article>
  );
}
