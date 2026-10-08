"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api/api-client";
import { CreateOrdenSchema } from "../schemas/create-orden.schema";
import type { Orden } from "../types/orden.types";

export type CreateOrdenActionResult =
  | { success: true; orden: Orden }
  | { success: false; message: string };

export async function createOrdenAction(input: unknown): Promise<CreateOrdenActionResult> {
  const parsed = CreateOrdenSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  try {
    const orden = await apiFetch<Orden>("/ordenes", {
      method: "POST",
      body: parsed.data,
    });
    // Los estados se propagan entre niveles (pieza/módulo/pedido/orden): se invalida todo
    // para que ninguna vista (incluida la de arriba, al volver) muestre estados viejos.
    revalidatePath("/", "layout");
    return { success: true, orden };
  } catch (err) {
    unstable_rethrow(err); // deja pasar el redirect al login (sesión vencida)
    const message = err instanceof ApiError ? err.message : "Error inesperado al agregar la orden.";
    return { success: false, message };
  }
}
