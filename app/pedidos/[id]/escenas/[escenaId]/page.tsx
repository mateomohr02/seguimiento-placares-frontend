import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import { redirect } from "next/navigation";
import type { PedidoConOrden } from "@/modules/pedido/types/pedido.types";
import type { EscenaConNombre } from "@/modules/escena-pedido/types/escena-pedido.types";
import { EscenaVisor } from "@/modules/escena-pedido/components/escena-visor";

// Visor 3D de solo lectura de una escena del pedido (diseño.md §13).
export default async function EscenaPedidoVisorPage({
  params,
}: {
  params: Promise<{ id: string; escenaId: string }>;
}) {
  const { id, escenaId } = await params;
  if (!puede(await requireSesion(), PERMISOS.DOCUMENTACION_VER)) redirect(`/pedidos/${id}`);
  const [pedido, datos] = await Promise.all([
    apiFetch<PedidoConOrden>(`/pedidos/${id}`),
    apiFetch<EscenaConNombre>(`/escenas-pedido/${escenaId}/escena`),
  ]);

  return (
    <EscenaVisor
      escena={datos.escena}
      titulo={`Pedido ${pedido.codigo_pedido} — Escena 3D: ${datos.nombre}`}
      volverHref={`/pedidos/${id}#escenas`}
    />
  );
}
