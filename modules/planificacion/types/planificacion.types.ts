// Planificación semanal de Termolaminado cargada por sistema (diseño.md §14.4).
export type TipoPlanificacion = "PEDIDOS" | "RECLAMOS";

export const ETIQUETA_TIPO: Record<TipoPlanificacion, string> = {
  PEDIDOS: "Pedidos",
  RECLAMOS: "Reclamos",
};

export interface MarcaPlanificacion {
  estado_id: string;
  estado: string;
  color: string | null;
  marcado_por: string;
  marcado_en: string;
}

export interface ItemPlanificacion {
  id: string;
  tipo: TipoPlanificacion;
  /** Lunes de la semana (AAAA-MM-DD). */
  semana_inicio: string;
  cliente: string;
  n_tw: string;
  n_orden: string | null;
  modelo: string | null;
  color: string | null;
  fabrica: string | null;
  fecha_limite: string | null;
  distribuidor: string | null;
  ticket: string | null;
  tipo_reclamo: string | null;
  compromiso: string | null;
  finalizado_en: string | null;
  observaciones: string | null;
  marcas: MarcaPlanificacion[];
}

export interface EstadoBasico {
  id: string;
  nombre: string;
  color: string | null;
}

export interface SemanaPlanificacion {
  semana_inicio: string;
  semanas: string[];
  estados: EstadoBasico[];
  /** Estados de producción que el usuario puede marcar: los de sus estaciones de trabajo (vacío = no puede marcar). */
  mis_estados: EstadoBasico[];
  items: ItemPlanificacion[];
}

/** Lo que se manda al crear o editar una fila (los vacíos llegan como cadena vacía). */
export interface ItemInput {
  tipo: TipoPlanificacion;
  semana: string;
  cliente: string;
  n_tw: string;
  n_orden: string;
  modelo: string;
  color: string;
  fabrica: string;
  fecha_limite: string;
  distribuidor: string;
  ticket: string;
  tipo_reclamo: string;
  compromiso: string;
  finalizado_en: string;
  observaciones: string;
}
