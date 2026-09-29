"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api/api-client";
import type { Modulo } from "../types/modulo.types";

export type MarcarModuloFinalizadoResult =
  | { success: true; modulo: Modulo }
  | { success: false; message: string };

export async function marcarModuloFinalizadoAction(
  moduloId: string,
  pedidoId: string,
): Promise<MarcarModuloFinalizadoResult> {
  try {
    const modulo = await apiFetch<Modulo>(`/modulos/${moduloId}/finalizar`, { method: "PATCH" });
    revalidatePath(`/pedidos/${pedidoId}`);
    revalidatePath(`/modulos/${moduloId}`);
    return { success: true, modulo };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Error inesperado al finalizar el módulo.";
    return { success: false, message };
  }
}
