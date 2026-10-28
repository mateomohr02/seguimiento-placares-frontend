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

/** Estación de trabajo activa a la que pertenece el usuario de la sesión (termolaminado1, mecanizado1…). */
export interface EstacionSesion {
  id: string;
  nombre: string;
  /** Planillas que se completan en la estación: LIJADO, ENCOLADO, PVC. */
  planillas: string[];
  /** Estado de producción que marca la estación en la planificación (null = ninguno). */
  estado_id: string | null;
}

export interface Sesion {
  id: string;
  nombre: string;
  apellido: string;
  rol: string;
  permisos: string[];
  /** Planillas de Termolaminado que puede completar: los tipos distintos de sus estaciones activas. */
  planillas: string[];
  /** Estaciones de trabajo activas del usuario (puede no tener ninguna: técnica, gerencia, admin). */
  estaciones: EstacionSesion[];
}

/** «Nombre Apellido» de una persona (el apellido puede faltar en datos viejos). */
export const nombreCompleto = (p: { nombre: string; apellido?: string | null }) => [p.nombre, p.apellido].filter((x) => x?.trim()).join(" ");

export const puede = (sesion: Sesion, permiso: Permiso) => sesion.permisos.includes(permiso);

/**
 * ¿Puede completar ese tipo de planilla (LIJADO, ENCOLADO, PVC)? Exige el permiso y que alguna de sus estaciones la tenga;
 * quien tiene `planillas.configurar` (técnica, admin) puede abrir y corregir las de cualquier estación.
 */
export const puedeCompletarPlanilla = (sesion: Sesion, tipo: string) =>
  puede(sesion, PERMISOS.PLANILLAS_COMPLETAR) && (sesion.planillas.includes(tipo) || puede(sesion, PERMISOS.PLANILLAS_CONFIGURAR));

/** Estaciones de trabajo del usuario que tienen ese tipo de planilla (las que puede elegir al completarla). */
export const estacionesConPlanilla = (sesion: Sesion, tipo: string) => sesion.estaciones.filter((e) => e.planillas.includes(tipo));

/** ¿Puede abrir la planilla `tipo` de esa estación de trabajo en particular? */
export const puedeAbrirPlanillaDe = (sesion: Sesion, tipo: string, estacionTrabajoId: string) =>
  puede(sesion, PERMISOS.PLANILLAS_COMPLETAR) &&
  (puede(sesion, PERMISOS.PLANILLAS_CONFIGURAR) || estacionesConPlanilla(sesion, tipo).some((e) => e.id === estacionTrabajoId));

const ESTACIONES_PLANILLA = ["LIJADO", "ENCOLADO", "PVC"];

/**
 * Planillas cuyos registros puede ver el usuario: los de fábrica, solo las de sus estaciones de trabajo
 * (sin estación, ninguna); el resto de los roles, todas. El backend lo valida igual.
 */
export const estacionesVisibles = (sesion: Sesion) =>
  sesion.rol === "fabrica" ? ESTACIONES_PLANILLA.filter((e) => sesion.planillas.includes(e)) : ESTACIONES_PLANILLA;
