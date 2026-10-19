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

export interface Planilla {
  id: string;
  estacion: Estacion;
  fecha: string;
  estado: EstadoPlanilla;
  operarios: string[];
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
  datos: { estado: EstadoPlanilla; operarios: string[]; filas: (Omit<FilaPlanilla, "fotos"> & { fotos: number })[] };
}

export interface RegistroPlanilla {
  id: string;
  planilla_id: string;
  estacion: Estacion;
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
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  cantidad_piezas: number | null;
  fotos: number;
  estado: EstadoPlanilla;
  observaciones: string | null;
  planilla_id: string;
}

export interface Trazabilidad extends ResumenPedido {
  pedido_id: string | null;
  referencia: string | null;
  registros: RegistroTraza[];
}

/** Operarios entre los que elige el usuario al completar sus planillas (los configura técnica). */
export interface OperariosArea {
  operarios: string[];
}

/** Estado de producción del catálogo (con cuántos usuarios lo tienen y cuántas marcas hizo). */
export interface EstadoProduccion {
  id: string;
  nombre: string;
  usuarios: number;
  marcas: number;
}

/** Configuración de un usuario de fábrica: planillas que completa, estado que marca y operarios de su estación. */
export interface AccesoUsuario {
  id: string;
  nombre: string;
  rol: string;
  estaciones: Estacion[];
  estado_id: string | null;
  operarios: string[];
}
