"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api/api-client";

export type OrdenEstadoActionResult = { success: true } | { success: false; message: string };

export async function marcarOrdenPendienteAction(ordenId: string): Promise<OrdenEstadoActionResult> {
  try {
    await apiFetch(`/ordenes/${ordenId}/pendiente`, { method: "PATCH" });
    revalidatePath("/");
    revalidatePath(`/ordenes/${ordenId}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Error inesperado al pasar la orden a Pendiente.";
    return { success: false, message };
  }
}

// Soft delete en la base propia; TeoWin no se toca (diseño.md §5.2).
export async function eliminarOrdenAction(ordenId: string): Promise<OrdenEstadoActionResult> {
  try {
    await apiFetch(`/ordenes/${ordenId}`, { method: "DELETE" });
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Error inesperado al eliminar la orden.";
    return { success: false, message };
  }
}
