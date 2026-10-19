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
}

export const puede = (sesion: Sesion, permiso: Permiso) => sesion.permisos.includes(permiso);
