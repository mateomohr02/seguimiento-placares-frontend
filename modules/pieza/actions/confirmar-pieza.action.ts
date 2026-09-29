"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api/api-client";
import type { EscaneoResumen } from "../types/pieza.types";

export type ConfirmarPiezaResult =
  | { success: true; resumen: EscaneoResumen }
  | { success: false; message: string };

// Vista 4 — botón "Marcar finalizado" por pieza. Usa el mismo camino que el
// escaneo (marca CORTADA), ver diseño.md §6.
export async function confirmarPiezaAction(piezaId: string): Promise<ConfirmarPiezaResult> {
  try {
    const resumen = await apiFetch<EscaneoResumen>(`/piezas/${piezaId}/confirmar`, {
      method: "PATCH",
    });
    revalidatePath(`/modulos/${resumen.modulo.id}`);
    return { success: true, resumen };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Error inesperado al confirmar la pieza.";
    return { success: false, message };
  }
}
