// Planificación semanal por estación de trabajo (plantilla TERMOLAMINADO) cargada por sistema (diseño.md §14.4).
export type TipoPlanificacion = "PEDIDOS" | "RECLAMOS";

/** Plantillas de planificación que puede elegir una estación de trabajo (hoy solo una). */
export type PlantillaPlanificacion = "TERMOLAMINADO";
export const ETIQUETA_PLANTILLA: Record<PlantillaPlanificacion, string> = { TERMOLAMINADO: "Termolaminado" };

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

export interface HistorialObservacion {
  id: string;
  accion: "CREADA" | "EDITADA" | "ELIMINADA" | string;
  texto: string;
  por: string;
  en: string;
}

/** Observación de un usuario en una fila (incluye las borradas, con `eliminado_en`, solo para el historial). */
export interface ObservacionPlanificacion {
  id: string;
  usuario_id: string | null;
  autor: string;
  texto: string;
  creado_en: string;
  editado_en: string | null;
  eliminado_en: string | null;
  eliminado_por: string | null;
  /** Calculados por el backend para quien mira: editar solo las propias; borrar las propias o, con gestión, cualquiera. */
  puede_editar: boolean;
  puede_borrar: boolean;
  historial: HistorialObservacion[];
}

export interface ItemPlanificacion {
  id: string;
  tipo: TipoPlanificacion;
  /** Lunes de la semana (AAAA-MM-DD). */
  semana_inicio: string;
  /** Pedido cargado en la app al que apunta la fila (de ahí salen N° TW, N° orden y cliente). */
  pedido_id: string | null;
  orden_id: string | null;
  /** N° TW = código del pedido. */
  codigo_pedido: string;
  n_orden: string | null;
  /** Cliente = referencia del pedido. */
  cliente: string | null;
  modelo: string | null;
  color: string | null;
  compromiso: string | null;
  finalizado_en: string | null;
  distribuidor: string | null;
  ticket: string | null;
  tipo_reclamo: string | null;
  observaciones: string | null;
  orden: number;
  marcas: MarcaPlanificacion[];
  comentarios: ObservacionPlanificacion[];
}

export interface EstadoBasico {
  id: string;
  nombre: string;
  color: string | null;
}

export interface EstacionPlanificacion {
  id: string;
  nombre: string;
  plantilla: PlantillaPlanificacion;
}

export interface SemanaPlanificacion {
  estacion: EstacionPlanificacion;
  semana_inicio: string;
  semanas: string[];
  estados: EstadoBasico[];
  /** Estados de producción que el usuario puede marcar: los de sus estaciones de trabajo (vacío = no puede marcar). */
  mis_estados: EstadoBasico[];
  items: ItemPlanificacion[];
}

/** Lo que se manda al crear o editar una fila (los vacíos llegan como cadena vacía). El resto se deriva del pedido. */
export interface ItemInput {
  estacion_id: string;
  tipo: TipoPlanificacion;
  semana: string;
  pedido_id: string;
  modelo: string;
  color: string;
  compromiso: string;
  finalizado_en: string;
  distribuidor: string;
  ticket: string;
  tipo_reclamo: string;
  observaciones: string;
}

/** Resultado de GET /planificacion/pedidos (lista del diálogo de fila). */
export interface PedidoElegible {
  pedido_id: string;
  codigo_pedido: string;
  referencia: string | null;
  orden_id: string | null;
  n_orden: string | null;
}

/** Resultado de GET /planificacion/buscar (buscador de la planificación). */
export interface ResultadoBusqueda {
  item_id: string;
  semana_inicio: string;
  tipo: TipoPlanificacion;
  codigo_pedido: string;
}
