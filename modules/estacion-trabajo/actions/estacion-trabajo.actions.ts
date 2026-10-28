"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api/api-client";
import type { EstacionTrabajo, EstacionTrabajoCambios, EstacionTrabajoInput } from "../types/estacion-trabajo.types";

export type EstacionTrabajoActionResult = { success: true } | { success: false; message: string };

async function ejecutar(fn: () => Promise<unknown>, falla: string): Promise<EstacionTrabajoActionResult> {
  try {
    await fn();
    // Cambia la barra (planillas de la sesión), Configurar y Usuarios.
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    unstable_rethrow(err); // deja pasar el redirect al login (sesión vencida)
    return { success: false, message: err instanceof ApiError ? err.message : falla };
  }
}

/** El alta no recibe usuarios: si se eligieron, se asignan después con un PATCH sobre la estación recién creada. */
export async function crearEstacionAction(input: EstacionTrabajoInput, usuariosIds: string[] = []): Promise<EstacionTrabajoActionResult> {
  let creada: EstacionTrabajo;
  try {
    creada = await apiFetch<EstacionTrabajo>("/estaciones-trabajo", { method: "POST", body: input });
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, message: err instanceof ApiError ? err.message : "Error inesperado al crear la estación." };
  }
  if (usuariosIds.length === 0) return ejecutar(async () => undefined, "");
  const r = await actualizarEstacionAction(creada.id, { usuarios_ids: usuariosIds });
  return r.success ? r : { success: false, message: `La estación se creó, pero no se pudieron asignar los usuarios: ${r.message}` };
}

/** Edición, usuarios asignados, desactivar y reactivar (activa). */
export async function actualizarEstacionAction(id: string, cambios: EstacionTrabajoCambios): Promise<EstacionTrabajoActionResult> {
  return ejecutar(
    () => apiFetch(`/estaciones-trabajo/${encodeURIComponent(id)}`, { method: "PATCH", body: cambios }),
    "Error inesperado al guardar la estación.",
  );
}
