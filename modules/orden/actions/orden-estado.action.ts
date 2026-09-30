"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api/api-client";

export type OrdenEstadoActionResult = { success: true } | { success: false; message: string };

// Soft delete en la base propia; TeoWin no se toca (diseño.md §5.2).
export async function eliminarOrdenAction(ordenId: string): Promise<OrdenEstadoActionResult> {
  try {
    await apiFetch(`/ordenes/${ordenId}`, { method: "DELETE" });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Error inesperado al eliminar la orden.";
    return { success: false, message };
  }
}
