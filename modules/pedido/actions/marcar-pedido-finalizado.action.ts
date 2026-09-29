"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api/api-client";
import type { Pedido } from "../types/pedido.types";

export type MarcarPedidoFinalizadoResult =
  | { success: true; pedido: Pedido }
  | { success: false; message: string };

export async function marcarPedidoFinalizadoAction(
  pedidoId: string,
  ordenId: string,
): Promise<MarcarPedidoFinalizadoResult> {
  try {
    const pedido = await apiFetch<Pedido>(`/pedidos/${pedidoId}/finalizar`, { method: "PATCH" });
    revalidatePath(`/ordenes/${ordenId}`);
    revalidatePath(`/pedidos/${pedidoId}`);
    return { success: true, pedido };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : "Error inesperado al finalizar el pedido.";
    return { success: false, message };
  }
}
