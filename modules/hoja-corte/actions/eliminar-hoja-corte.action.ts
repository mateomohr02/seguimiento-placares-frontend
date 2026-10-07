"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api/api-client";

export type EliminarHojaCorteResult = { success: true } | { success: false; message: string };

// Borrado lógico en la base propia (eliminado_en); el PDF queda en la tabla.
export async function eliminarHojaCorteAction(hojaId: string): Promise<EliminarHojaCorteResult> {
  try {
    await apiFetch(`/hojas-corte/${hojaId}`, { method: "DELETE" });
    revalidatePath("/ordenes/[id]/hojas-corte", "page");
    return { success: true };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Error inesperado al eliminar la hoja de corte.";
    return { success: false, message };
  }
}
