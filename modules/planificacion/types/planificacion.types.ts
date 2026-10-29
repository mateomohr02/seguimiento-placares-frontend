// Planificaciones cargadas por sistema (diseño.md §14.4, §19.5): son independientes de las estaciones de trabajo. Catálogo fijo:
// Termolaminado (por semana, lunes a viernes) y Calidad (por día, lunes a sábado). Una estación solo tiene «asignada» una planificación.
// Para agregar otra: sumar su clave acá, en ETIQUETA_PLANTILLA y en el backend (enum PlantillaPlanificacion).

/** Planificaciones del catálogo (clave). */
export type PlantillaPlanificacion = "TERMOLAMINADO" | "CALIDAD";
export const ETIQUETA_PLANTILLA: Record<PlantillaPlanificacion, string> = { TERMOLAMINADO: "Termolaminado", CALIDAD: "Calidad" };

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
  /** Lunes de la semana (AAAA-MM-DD). */
  semana_inicio: string;
  /** Día de la fila (AAAA-MM-DD, lunes a sábado): solo en la plantilla Calidad. */
  dia: string | null;
  /** Pedido cargado en la app al que está asociada la fila (null = «pedido no encontrado»). */
  pedido_id: string | null;
  orden_id: string | null;
  sin_pedido: boolean;
  /** N° TW tal cual (con pedido asociado es el código del pedido). */
  n_tw: string;
  /** Con pedido sale de la orden; sin pedido es el texto guardado. */
  n_orden: string | null;
  /** Cliente: texto libre. */
  cliente: string | null;
  modelo: string | null;
  /** Solo Termolaminado. */
  color: string | null;
  compromiso: string | null;
  /** Cantidad de módulos: solo Calidad. */
  modulos: number | null;
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

/** Planificación del catálogo, tal como la devuelve GET /planificacion/planificaciones. */
export interface PlanificacionCatalogo {
  clave: PlantillaPlanificacion;
  nombre: string;
}

export interface SemanaPlanificacion {
  planificacion: PlanificacionCatalogo;
  semana_inicio: string;
  semanas: string[];
  estados: EstadoBasico[];
  /** Estados de producción que el usuario puede marcar: los de sus estaciones activas (vacío = no puede marcar). */
  mis_estados: EstadoBasico[];
  items: ItemPlanificacion[];
}

/**
 * Cuerpo de POST/PUT /planificacion/items. `dia` y `modulos` solo en Calidad; `color` y `compromiso` solo en Termolaminado.
 * `pedido_id` solo si el usuario eligió un pedido de la lista; si no, el backend busca el N° TW exacto.
 */
export interface ItemInput {
  plantilla: PlantillaPlanificacion;
  semana: string;
  dia?: string;
  n_tw: string;
  pedido_id?: string;
  cliente: string;
  modelo: string;
  color?: string;
  compromiso?: string;
  modulos?: number;
  observaciones: string;
}

/** Resultado de GET /planificacion/pedidos y GET /planificacion/pedido (lista y validación del N° TW del diálogo de fila). */
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
  dia: string | null;
  n_tw: string;
  cliente: string | null;
  sin_pedido: boolean;
}

// ---- Importador de planificación desde Excel (POST /planificacion/importar/previsualizar y /confirmar) ----

export type EstadoFilaImportada = "OK" | "SIN_PEDIDO" | "DUPLICADA" | "INVALIDA";

export interface FilaImportada {
  /** Id estable de la fila dentro de la respuesta. */
  clave: string;
  fila_excel: number;
  /** Calidad: día de la fila (AAAA-MM-DD). */
  dia: string | null;
  cliente: string;
  n_tw: string;
  modelo: string;
  color: string;
  /** AAAA-MM-DD o null. */
  compromiso: string | null;
  modulos: number | null;
  observaciones: string;
  pedido: { pedido_id: string; n_orden: string | null } | null;
  estado: EstadoFilaImportada;
  avisos: string[];
  /** Ya está vigente en esa semana/día de la planificación (para «agregar solo las nuevas»). */
  ya_existe: boolean;
}

export interface HojaImportada {
  nombre_hoja: string;
  /** Planificación de destino (por el nombre de la hoja); null = no hay una planificación con ese nombre. */
  planificacion: PlanificacionCatalogo | null;
  omitida: boolean;
  motivo?: string;
  /** Lo que la planificación ya tiene vigente en esa semana. */
  existente: { filas: number; marcas: number; observaciones: number };
  filas: FilaImportada[];
}

export interface Previsualizacion {
  archivo: string;
  semana_inicio: string;
  hojas: HojaImportada[];
  avisos: string[];
}

export type ModoImportacion = "pisar" | "agregar";

export interface ConfirmarImportacionInput {
  semana: string;
  sin_pedido: "cargar" | "excluir";
  hojas: {
    plantilla: PlantillaPlanificacion;
    modo: ModoImportacion;
    filas: {
      dia?: string;
      cliente: string;
      n_tw: string;
      modelo?: string;
      color?: string;
      compromiso?: string;
      modulos?: number;
      observaciones?: string;
    }[];
  }[];
}

export interface ResultadoImportacion {
  semana_inicio: string;
  planificaciones: {
    clave: PlantillaPlanificacion;
    nombre: string;
    cargadas: number;
    sin_pedido: number;
    excluidas: number;
    ya_existentes_omitidas: number;
    quitadas: number;
    avisos: string[];
  }[];
}
