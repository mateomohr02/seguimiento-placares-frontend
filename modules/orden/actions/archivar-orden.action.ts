"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api/api-client";
import type { Orden } from "../types/orden.types";

export type ArchivarOrdenActionResult =
  | { success: true; orden: Orden }
  | { success: false; message: string };

export async function archivarOrdenAction(
  ordenId: string,
  archivar: boolean,
): Promise<ArchivarOrdenActionResult> {
  try {
    const orden = await apiFetch<Orden>(`/ordenes/${ordenId}/${archivar ? "archivar" : "desarchivar"}`, {
      method: "PATCH",
    });
    // Los estados se propagan entre niveles (pieza/módulo/pedido/orden): se invalida todo
    // para que ninguna vista (incluida la de arriba, al volver) muestre estados viejos.
    revalidatePath("/", "layout");
    return { success: true, orden };
  } catch (err) {
    unstable_rethrow(err); // deja pasar el redirect al login (sesión vencida)
    const message = err instanceof ApiError ? err.message : "Error inesperado al archivar la orden.";
    return { success: false, message };
  }
}
