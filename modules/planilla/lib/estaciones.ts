import type { Estacion, MesaTamano } from "../types/planilla.types";

export const ESTACIONES: Estacion[] = ["LIJADO", "ENCOLADO", "PVC"];

// El orden del proceso productivo: Lijado → Encolado → PVC.
export const ETIQUETA_ESTACION: Record<Estacion, string> = { LIJADO: "Lijado", ENCOLADO: "Encolado", PVC: "PVC" };

export const slugEstacion = (e: Estacion) => e.toLowerCase();

export function estacionDeSlug(slug: string): Estacion | null {
  const e = slug.toUpperCase();
  return (ESTACIONES as string[]).includes(e) ? (e as Estacion) : null;
}

/** Ruta de la planilla de un tipo en una estación de trabajo (y, opcionalmente, de un día). */
export const rutaPlanilla = (tipo: Estacion, estacionTrabajoId: string, fecha?: string) =>
  `/planillas/${slugEstacion(tipo)}/${encodeURIComponent(estacionTrabajoId)}${fecha ? `?fecha=${fecha}` : ""}`;

const pad = (n: number) => String(n).padStart(2, "0");

/** Fecha de hoy (AAAA-MM-DD) según el reloj del equipo donde corre. */
export function hoyLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

/** "2026-10-15" → "15/10/2026". */
export function fechaCorta(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** "Grande ×3" / "Chica ×1"; "—" si falta el tamaño. */
export function etiquetaMesa(tamano: MesaTamano | null | undefined, cantidad: number | null | undefined): string {
  if (!tamano) return "—";
  const t = tamano === "CHICA" ? "Chica" : "Grande";
  return cantidad ? `${t} ×${cantidad}` : t;
}

export function formatoMinutos(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h} h ${pad(m)} min` : `${m} min`;
}
