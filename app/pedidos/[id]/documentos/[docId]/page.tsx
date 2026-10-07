import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api/api-client";
import type { PedidoConOrden } from "@/modules/pedido/types/pedido.types";
import type { DocumentoPedido } from "@/modules/documento-pedido/types/documento-pedido.types";
import { ETIQUETA_TIPO } from "@/modules/documento-pedido/types/documento-pedido.types";
import { HojaCorteVisor } from "@/modules/hoja-corte/components/hoja-corte-visor";

export default async function DocumentoPedidoVisorPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const { id, docId } = await params;
  const [pedido, documentos] = await Promise.all([
    apiFetch<PedidoConOrden>(`/pedidos/${id}`),
    apiFetch<DocumentoPedido[]>(`/pedidos/${id}/documentos`),
  ]);
  const doc = documentos.find((d) => d.id === docId);
  if (!doc) notFound();

  const titulo =
    doc.nombre === ETIQUETA_TIPO[doc.tipo] ? doc.nombre : `${ETIQUETA_TIPO[doc.tipo]} — ${doc.nombre}`;

  return (
    <HojaCorteVisor
      anotacionesUrl={`/documentos-pedido/${doc.id}/anotaciones`}
      src={`/documentos-pedido/${doc.id}/archivo`}
      titulo={`Pedido ${pedido.codigo_pedido} — ${titulo}`}
      volverHref={`/pedidos/${id}`}
    />
  );
}
