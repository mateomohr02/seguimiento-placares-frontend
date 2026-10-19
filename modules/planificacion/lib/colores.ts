// Colores de los estados de producción (los elige técnica; #rrggbb). Sin color se usa el negro de la paleta.
export const COLOR_ESTADO_DEFECTO = "#1a1a1a";

export const PALETA_ESTADOS = ["#16a34a", "#2563eb", "#9c7a4c", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#475569", "#1a1a1a"];

export const colorDe = (color: string | null | undefined) => color ?? COLOR_ESTADO_DEFECTO;

/** Texto blanco u oscuro, el que más contraste da sobre ese fondo. */
export function textoSobre(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111111" : "#ffffff";
}
