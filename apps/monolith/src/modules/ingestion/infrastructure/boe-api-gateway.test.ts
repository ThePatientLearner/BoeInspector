/**
 * El sumario del BOE anida los ítems de forma distinta según el día. Este
 * test fija las tres formas vistas en sumarios reales.
 *
 * Motivo: el 7 de agosto de 2026 el BOE envolvió las disposiciones en un
 * nivel `texto` que el parser no contemplaba. No falló nada — la ingesta
 * terminó con "0 nuevas, 0 errores" y tres leyes se perdieron en silencio.
 */
import { describe, expect, it } from "vitest";
import { parseSummaryItemsForTest } from "./boe-api-gateway.js";

function sumario(departamento: unknown) {
  return {
    data: {
      sumario: {
        diario: {
          seccion: { codigo: "1", nombre: "I. Disposiciones generales", departamento },
        },
      },
    },
  };
}

const item = (id: string) => ({
  identificador: id,
  titulo: `Título de ${id}`,
  url_html: `https://www.boe.es/diario_boe/txt.php?id=${id}`,
  url_pdf: { texto: `https://www.boe.es/boe/dias/2026/08/07/pdfs/${id}.pdf` },
  url_xml: `https://www.boe.es/diario_boe/xml.php?id=${id}`,
});

describe("parseSummaryItems · formas de anidamiento del sumario", () => {
  it("departamento → item (una sola norma, sin epígrafe)", () => {
    const items = parseSummaryItemsForTest(
      sumario({ nombre: "MINISTERIO DE HACIENDA", item: item("BOE-A-2026-00001") }),
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe("BOE-A-2026-00001");
    expect(items[0]?.section).toBe("1");
    expect(items[0]?.department).toBe("MINISTERIO DE HACIENDA");
  });

  it("departamento → epigrafe → item (la forma habitual)", () => {
    const items = parseSummaryItemsForTest(
      sumario({
        nombre: "MINISTERIO DE HACIENDA",
        epigrafe: { nombre: "Tabaco", item: item("BOE-A-2026-00002") },
      }),
    );

    expect(items.map((i) => i.id)).toEqual(["BOE-A-2026-00002"]);
  });

  it("departamento → texto → epigrafe → item (BOE del 2026-08-07)", () => {
    const items = parseSummaryItemsForTest(
      sumario({
        nombre: "COMUNIDAD AUTÓNOMA DE CANARIAS",
        texto: {
          epigrafe: [
            { nombre: "Turismo", item: item("BOE-A-2026-17187") },
            { nombre: "Himno de Canarias", item: item("BOE-A-2026-17188") },
            { nombre: "Cabildos insulares", item: item("BOE-A-2026-17189") },
          ],
        },
      }),
    );

    expect(items.map((i) => i.id)).toEqual([
      "BOE-A-2026-17187",
      "BOE-A-2026-17188",
      "BOE-A-2026-17189",
    ]);
    expect(items[0]?.department).toBe("COMUNIDAD AUTÓNOMA DE CANARIAS");
  });

  it("varios departamentos con formas distintas en el mismo día", () => {
    const items = parseSummaryItemsForTest(
      sumario([
        { nombre: "A", epigrafe: { item: item("BOE-A-2026-00010") } },
        { nombre: "B", texto: { epigrafe: { item: item("BOE-A-2026-00011") } } },
        { nombre: "C", item: item("BOE-A-2026-00012") },
      ]),
    );

    expect(items.map((i) => i.id)).toEqual([
      "BOE-A-2026-00010",
      "BOE-A-2026-00011",
      "BOE-A-2026-00012",
    ]);
  });

  it("descarta ítems sin identificador válido en lugar de reventar", () => {
    const items = parseSummaryItemsForTest(
      sumario({ nombre: "A", epigrafe: { item: [{ titulo: "sin identificador" }] } }),
    );

    expect(items).toHaveLength(0);
  });
});
