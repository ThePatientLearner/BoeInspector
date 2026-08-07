import type { MetadataRoute } from "next";

/**
 * Todo indexable salvo la API, que devuelve JSON y no aporta nada en un
 * resultado de búsqueda. El sitemap se declara aquí para que los buscadores
 * lo encuentren sin tener que darlo de alta a mano en cada uno.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: "https://agenteboe.com/sitemap.xml",
  };
}
