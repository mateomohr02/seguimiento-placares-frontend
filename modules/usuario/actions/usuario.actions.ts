"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api/api-client";
import type { UsuarioCambios, UsuarioInput } from "../types/usuario.types";

export type UsuarioActionResult = { success: true } | { success: false; message: string };

// Los mensajes del backend (PIN en uso, nombre repetido, sin permiso…) llegan tal cual a la pantalla.
async function ejecutar(fn: () => Promise<unknown>, falla: string): Promise<UsuarioActionResult> {
  try {
    await fn();
    // Usuarios y estaciones se muestran en las dos pantallas (y el propio usuario puede cambiar su nombre).
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    unstable_rethrow(err); // deja pasar el redirect al login (sesión vencida)
    return { success: false, message: err instanceof ApiError ? err.message : falla };
  }
}

export async function crearUsuarioAction(input: UsuarioInput): Promise<UsuarioActionResult> {
  return ejecutar(() => apiFetch("/usuarios", { method: "POST", body: input }), "Error inesperado al crear el usuario.");
}

/** Edición, cambio de PIN, baja y reactivación (activo). */
export async function actualizarUsuarioAction(id: string, cambios: UsuarioCambios): Promise<UsuarioActionResult> {
  return ejecutar(
    () => apiFetch(`/usuarios/${encodeURIComponent(id)}`, { method: "PATCH", body: cambios }),
    "Error inesperado al guardar el usuario.",
  );
}
