// Claves de permiso (las mismas que la tabla `permiso` del backend, diseño.md §12).
// Qué rol tiene cuál lo decide la tabla `rol_permiso`; acá solo se nombran.
export const PERMISOS = {
  PRODUCCION_VER: "produccion.ver",
  PIEZAS_MARCAR: "piezas.marcar",
  DOCUMENTACION_VER: "documentacion.ver",
  DOCUMENTACION_ANOTAR: "documentacion.anotar",
  ANOTACIONES_ELIMINAR: "documentacion.anotaciones.eliminar",
  DOCUMENTACION_GESTIONAR: "documentacion.gestionar",
  ORDENES_GESTIONAR: "ordenes.gestionar",
  USUARIOS_GESTIONAR: "usuarios.gestionar",
  PLANILLAS_COMPLETAR: "planillas.completar",
  PLANILLAS_VER: "planillas.ver",
  PLANILLAS_INDICADORES: "planillas.indicadores",
  PLANILLAS_CONFIGURAR: "planillas.configurar",
} as const;

export type Permiso = (typeof PERMISOS)[keyof typeof PERMISOS];

export interface Sesion {
  nombre: string;
  rol: string;
  permisos: string[];
  /** Planillas de Termolaminado que puede completar (las asigna técnica): LIJADO, ENCOLADO, PVC. */
  planillas: string[];
}

export const puede = (sesion: Sesion, permiso: Permiso) => sesion.permisos.includes(permiso);

/** ¿Puede completar la planilla de esa estación? Exige el permiso y tenerla asignada. */
export const puedeCompletarPlanilla = (sesion: Sesion, estacion: string) =>
  puede(sesion, PERMISOS.PLANILLAS_COMPLETAR) && sesion.planillas.includes(estacion);

const ESTACIONES_PLANILLA = ["LIJADO", "ENCOLADO", "PVC"];

/**
 * Estaciones cuyos registros puede ver el usuario: los de fábrica, solo las planillas que tienen asignadas
 * (si técnica no le asignó ninguna, no ve ninguna); el resto de los roles, todas. El backend lo valida igual.
 */
export const estacionesVisibles = (sesion: Sesion) =>
  sesion.rol === "fabrica" ? ESTACIONES_PLANILLA.filter((e) => sesion.planillas.includes(e)) : ESTACIONES_PLANILLA;
