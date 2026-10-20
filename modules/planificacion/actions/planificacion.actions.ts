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

/** Marca o desmarca el estado de producción que técnica le asignó al usuario. */
export async function marcarEstadoAction(id: string, marcado: boolean): Promise<PlanificacionResult> {
  return ejecutar(() => apiFetch(`/planificacion/items/${id}/marca`, { method: "PUT", body: { marcado } }), "Error inesperado al marcar el estado.");
}
