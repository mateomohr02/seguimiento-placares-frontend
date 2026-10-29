// Estaciones de trabajo (termolaminado1, mecanizado1, cortadora1…) — espejo de GET /estaciones-trabajo del backend.
// No tienen login: las crea técnica, les asigna planillas, estado de producción y operarios. No se borran, se desactivan.
import type { Estacion } from "@/modules/planilla/types/planilla.types";
import type { PlantillaPlanificacion } from "@/modules/planificacion/types/planificacion.types";

export interface UsuarioDeEstacion {
  id: string;
  nombre: string;
  apellido: string;
  rol: string;
  activo: boolean;
}

export interface EstacionTrabajo {
  id: string;
  nombre: string;
  activa: boolean;
  /** Planillas que completan sus operarios. */
  planillas: Estacion[];
  /** Estado de producción que marca en la planificación (null = ninguno). */
  estado_id: string | null;
  /** Planificación asignada a la estación (null = ninguna). Varias estaciones pueden tener la misma. */
  plantilla_planificacion: PlantillaPlanificacion | null;
  usuarios: UsuarioDeEstacion[];
}

/** Alta (POST /estaciones-trabajo). */
export interface EstacionTrabajoInput {
  nombre: string;
  planillas: Estacion[];
  estado_id: string | null;
  plantilla_planificacion: PlantillaPlanificacion | null;
}

/** Edición (PATCH /estaciones-trabajo/:id); `usuarios_ids` reemplaza a los asignados. */
export type EstacionTrabajoCambios = Partial<EstacionTrabajoInput & { activa: boolean; usuarios_ids: string[] }>;
