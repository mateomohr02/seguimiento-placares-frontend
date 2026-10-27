// Planillas de producción de Termolaminado — diseño.md §14 (espejo de la salida del backend).
export type Estacion = "LIJADO" | "ENCOLADO" | "PVC";
export type EstadoPlanilla = "BORRADOR" | "GUARDADA";

export interface FotoFila {
  id: string;
  mime: string;
  tamano: number;
  creado_en: string;
}

export interface FilaPlanilla {
  id: string;
  orden: number;
  hora_inicio: string | null;
  hora_fin: string | null;
  pedido_codigo: string;
  pedido_id: string | null;
  cantidad_piezas: number | null;
  observaciones: string | null;
  colocacion_pvc: string | null;
  perfilado: string | null;
  colores: string | null;
  mesa_chica: number | null;
  mesa_grande: number | null;
  fotos: FotoFila[];
}

export interface VersionPlanilla {
  id: string;
  version: number;
  guardada_por: string;
  guardada_en: string;
  reemplazada_por: string;
  reemplazada_en: string;
}

/** Estación de trabajo (termolaminado1, mecanizado1…) a la que pertenece una planilla. */
export interface EstacionTrabajoRef {
  id: string;
  nombre: string;
}

/** Operario elegido en una planilla. `usuario_id` es null en las planillas viejas (solo el nombre, como historia). */
export interface OperarioPlanilla {
  usuario_id: string | null;
  nombre: string;
  /** Ya figura en la planilla y no se puede quitar (salvo que `puede_cambiar_bloqueados`). */
  bloqueado: boolean;
}

export interface OperarioDisponible {
  usuario_id: string;
  nombre: string;
}

export interface Planilla {
  /** Una planilla que todavía no se guardó llega «virtual»: sin id (o id vacío). */
  id: string | null;
  estacion: Estacion;
  estacion_trabajo: EstacionTrabajoRef;
  fecha: string;
  estado: EstadoPlanilla;
  operarios: OperarioPlanilla[];
  /** Personas activas de la estación + las ya incluidas en la planilla. */
  operarios_disponibles: OperarioDisponible[];
  /** true para quien tiene `planillas.configurar`: puede cambiar también los operarios bloqueados. */
  puede_cambiar_bloqueados: boolean;
  creado_por: string;
  modificado_por: string;
  creado_en: string;
  actualizado_en: string;
  guardada_en: string | null;
  filas: FilaPlanilla[];
  versiones: VersionPlanilla[];
}

export interface DatosVersion extends VersionPlanilla {
  planilla_id: string;
  datos: { estado: EstadoPlanilla; operarios: (string | { nombre: string })[]; filas: (Omit<FilaPlanilla, "fotos"> & { fotos: number; fotos_lista?: FotoFila[] })[] };
}

export interface RegistroPlanilla {
  id: string;
  planilla_id: string;
  estacion: Estacion;
  estacion_trabajo: EstacionTrabajoRef;
  fecha: string;
  estado: EstadoPlanilla;
  operarios: string[];
  orden: number;
  hora_inicio: string | null;
  hora_fin: string | null;
  pedido_codigo: string;
  pedido_id: string | null;
  cantidad_piezas: number | null;
  observaciones: string | null;
  colocacion_pvc: string | null;
  perfilado: string | null;
  colores: string | null;
  mesa_chica: number | null;
  mesa_grande: number | null;
  fotos: number;
  versiones: number;
}

export interface ResumenEstacion {
  registros: number;
  piezas: number;
  minutos: number;
  primera: string | null;
  ultima: string | null;
}

export interface ResumenPedido {
  pedido: string;
  estaciones: Record<Estacion, ResumenEstacion>;
  completo: boolean;
  siguiente: Estacion | null;
  diferencia: boolean;
}

export interface Indicadores {
  desde: string;
  hasta: string;
  porEstacion: {
    estacion: Estacion;
    dias: number;
    registros: number;
    pedidos: number;
    piezas: number;
    minutos: number;
    piezasPorHora: number | null;
  }[];
  porDia: { fecha: string; piezas: Record<Estacion, number> }[];
  pedidos: { total: number; completos: number; enProceso: number; conDiferencia: number; detalle: ResumenPedido[] };
}

export interface RegistroTraza {
  pedido_codigo: string;
  estacion: Estacion;
  estacion_trabajo: EstacionTrabajoRef;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  cantidad_piezas: number | null;
  fotos: number;
  estado: EstadoPlanilla;
  observaciones: string | null;
  planilla_id: string;
}

export interface Trazabilidad extends Omit<ResumenPedido, "estaciones"> {
  /** Solo las estaciones que el usuario puede ver. */
  estaciones: Partial<ResumenPedido["estaciones"]>;
  pedido_id: string | null;
  referencia: string | null;
  registros: RegistroTraza[];
}

/** Estado de producción del catálogo (con cuántas estaciones lo tienen y cuántas marcas hizo). */
export interface EstadoProduccion {
  id: string;
  nombre: string;
  /** #rrggbb con el que se ve el estado en la planificación. */
  color: string | null;
  estaciones: number;
  marcas: number;
}
