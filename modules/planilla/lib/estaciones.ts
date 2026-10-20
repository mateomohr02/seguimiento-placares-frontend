import type { Estacion } from "../types/planilla.types";

export const ESTACIONES: Estacion[] = ["LIJADO", "ENCOLADO", "PVC"];

// El orden del proceso productivo: Lijado → Encolado → PVC.
export const ETIQUETA_ESTACION: Record<Estacion, string> = { LIJADO: "Lijado", ENCOLADO: "Encolado", PVC: "PVC" };

export const slugEstacion = (e: Estacion) => e.toLowerCase();

export function estacionDeSlug(slug: string): Estacion | null {
  const e = slug.toUpperCase();
  return (ESTACIONES as string[]).includes(e) ? (e as Estacion) : null;
}

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

export function formatoMinutos(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h} h ${pad(m)} min` : `${m} min`;
}
