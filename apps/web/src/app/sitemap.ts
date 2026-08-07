import type { MetadataRoute } from "next";
import { fetchAllReferences } from "@/lib/api";

const SITE = "https://agenteboe.com";

/**
 * Sitemap con el archivo completo.
 *
 * Es necesario, no decorativo: la portada solo enseña los últimos 15 días
 * (`catalog.listDays(15)`), así que a partir de ahí las disposiciones dejan
 * de tener ningún enlace que las alcance desde el sitio. Sin sitemap, un
 * buscador no tiene forma de llegar a ellas ni sabiendo que existen.
 *
 * `lastModified` usa la fecha de última actualización del texto oficial, no
 * la de publicación: si el BOE corrige una disposición, eso es exactamente
 * lo que hay que volver a rastrear.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await fetchAllReferences();

  return [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/legal`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
    ...entries.map((entry) => ({
      url: `${SITE}/d/${entry.id}`,
      lastModified: new Date(`${entry.lastOfficialUpdateAt}T12:00:00`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
