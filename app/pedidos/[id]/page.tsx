import Link from "next/link";
import { apiFetch } from "@/lib/api/api-client";
import { ModulosTable } from "@/modules/modulo/components/modulos-table";
import type { Modulo } from "@/modules/modulo/types/modulo.types";
import type { PedidoConOrden } from "@/modules/pedido/types/pedido.types";
import { EstadoBadge } from "@/components/estado-badge";
import { DocumentacionPedido } from "@/modules/documento-pedido/components/documentacion-pedido";
import type { DocumentoPedido } from "@/modules/documento-pedido/types/documento-pedido.types";

export default async function PedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pedido, modulos, documentos] = await Promise.all([
    apiFetch<PedidoConOrden>(`/pedidos/${id}`),
    apiFetch<Modulo[]>(`/pedidos/${id}/modulos`),
    apiFetch<DocumentoPedido[]>(`/pedidos/${id}/documentos`),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <div>
        <Link href={`/ordenes/${pedido.orden.id}`} className="text-sm text-muted-foreground hover:underline">
          ← Orden {pedido.orden.numeroOrdenCustom}
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-xl font-semibold">
            Pedido {pedido.codigo_pedido} — {pedido.referencia}
          </h1>
          <EstadoBadge estado={pedido.estado} />
        </div>
      </div>

      <ModulosTable modulos={modulos} />

      <DocumentacionPedido pedidoId={id} codigoPedido={pedido.codigo_pedido} documentos={documentos} />
    </main>
  );
}
