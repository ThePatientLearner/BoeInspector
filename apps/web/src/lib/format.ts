/** "2026-08-01" → "1 de agosto de 2026". El mediodía evita saltos de zona horaria. */
export function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
