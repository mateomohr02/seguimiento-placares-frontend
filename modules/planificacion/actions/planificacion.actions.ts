"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api/api-client";
import type { ItemInput } from "../types/planificacion.types";

export type PlanificacionResult = { success: true } | { success: false; message: string };

async function ejecutar(fn: () => Promise<unknown>, falla: string): Promise<PlanificacionResult> {
  try {
    await fn();
    revalidatePath("/planificacion");
    return { success: true };
  } catch (err) {
    unstable_rethrow(err); // deja pasar el redirect al login (sesión vencida)
    return { success: false, message: err instanceof ApiError ? err.message : falla };
  }
}

export async function crearItemAction(input: ItemInput): Promise<PlanificacionResult> {
  return ejecutar(() => apiFetch("/planificacion/items", { method: "POST", body: input }), "Error inesperado al cargar la fila.");
}

export async function actualizarItemAction(id: string, input: ItemInput): Promise<PlanificacionResult> {
  return ejecutar(() => apiFetch(`/planificacion/items/${id}`, { method: "PUT", body: input }), "Error inesperado al guardar la fila.");
}

// Borrado lógico en la base propia (eliminado_en).
export async function eliminarItemAction(id: string): Promise<PlanificacionResult> {
  return ejecutar(() => apiFetch(`/planificacion/items/${id}`, { method: "DELETE" }), "Error inesperado al quitar la fila.");
}

/** Marca o desmarca un estado de producción de las estaciones de trabajo del usuario (`estadoId` es obligatorio con más de uno). */
export async function marcarEstadoAction(id: string, marcado: boolean, estadoId: string): Promise<PlanificacionResult> {
  return ejecutar(() => apiFetch(`/planificacion/items/${id}/marca`, { method: "PUT", body: { marcado, estado_id: estadoId } }), "Error inesperado al marcar el estado.");
}

/** Agrega una observación del usuario a una fila; queda firmada con su nombre. */
export async function agregarObservacionAction(itemId: string, texto: string): Promise<PlanificacionResult> {
  return ejecutar(() => apiFetch(`/planificacion/items/${itemId}/observaciones`, { method: "POST", body: { texto } }), "Error inesperado al agregar la observación.");
}

/** Edita una observación propia (el backend rechaza las ajenas con 403); el historial guarda cada versión. */
export async function editarObservacionAction(id: string, texto: string): Promise<PlanificacionResult> {
  return ejecutar(() => apiFetch(`/planificacion/observaciones/${id}`, { method: "PUT", body: { texto } }), "Error inesperado al guardar la observación.");
}

/** Borrado lógico: el autor borra la suya; técnica puede borrar cualquiera. Queda en el historial. */
export async function eliminarObservacionAction(id: string): Promise<PlanificacionResult> {
  return ejecutar(() => apiFetch(`/planificacion/observaciones/${id}`, { method: "DELETE" }), "Error inesperado al borrar la observación.");
}
