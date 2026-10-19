// Planificación semanal del área (diseño.md §14.4): archivo PDF o imagen que baja la oficina técnica.
export type TipoPlanificacion = "PEDIDOS" | "RECLAMOS";

export const ETIQUETA_TIPO: Record<TipoPlanificacion, string> = {
  PEDIDOS: "Planificación de pedidos",
  RECLAMOS: "Reclamos",
};

export interface PlanificacionDoc {
  id: string;
  tipo: TipoPlanificacion;
  /** Lunes de la semana (AAAA-MM-DD). */
  semana_inicio: string;
  nombre: string;
  nombre_archivo: string;
  mime: string;
  tamano: number;
  creado_en: string;
}

export const esImagen = (mime: string) => mime.startsWith("image/");
