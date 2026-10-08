import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/api-client";
import { requireSesion } from "@/lib/auth/sesion";
import { PERMISOS, puede } from "@/lib/auth/permisos";
import type { PedidoConOrden } from "@/modules/pedido/types/pedido.types";
import { esImagen, type PlanoPedido } from "@/modules/plano-pedido/types/plano-pedido.types";
import { HojaCorteVisor } from "@/modules/hoja-corte/components/hoja-corte-visor";

export default async function PlanoPedidoVisorPage({
  params,
}: {
  params: Promise<{ id: string; planoId: string }>;
}) {
  const { id, planoId } = await params;
  const sesion = await requireSesion();
  const [pedido, planos] = await Promise.all([
    apiFetch<PedidoConOrden>(`/pedidos/${id}`),
    apiFetch<PlanoPedido[]>(`/pedidos/${id}/planos`),
  ]);
  const plano = planos.find((p) => p.id === planoId);
  if (!plano) notFound();

  return (
    <HojaCorteVisor
      anotacionesUrl={`/planos-pedido/${plano.id}/anotaciones`}
      src={`/planos-pedido/${plano.id}/archivo`}
      tipoArchivo={esImagen(plano.mime) ? "imagen" : "pdf"}
      titulo={`Pedido ${pedido.codigo_pedido} — Plano: ${plano.nombre}`}
      volverHref={`/pedidos/${id}`}
      puedeAnotar={puede(sesion, PERMISOS.DOCUMENTACION_ANOTAR)}
      puedeEliminarAnotaciones={puede(sesion, PERMISOS.ANOTACIONES_ELIMINAR)}
    />
  );
}
