import Link from "next/link";
import { apiFetch } from "@/lib/api/api-client";
import { ModulosTable } from "@/modules/modulo/components/modulos-table";
import type { Modulo } from "@/modules/modulo/types/modulo.types";
import type { PedidoConOrden } from "@/modules/pedido/types/pedido.types";
import { EstadoBadge } from "@/components/estado-badge";
import { PedidoNav } from "@/modules/pedido/components/pedido-nav";
import { TIPOS_OBLIGATORIOS } from "@/modules/documento-pedido/types/documento-pedido.types";
import { DocumentacionPedido } from "@/modules/documento-pedido/components/documentacion-pedido";
import { PlanosPedido } from "@/modules/plano-pedido/components/planos-pedido";
import type { PlanoPedido } from "@/modules/plano-pedido/types/plano-pedido.types";
import type { DocumentoPedido } from "@/modules/documento-pedido/types/documento-pedido.types";

export default async function PedidoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [pedido, modulos, documentos, planos] = await Promise.all([
    apiFetch<PedidoConOrden>(`/pedidos/${id}`),
    apiFetch<Modulo[]>(`/pedidos/${id}/modulos`),
    apiFetch<DocumentoPedido[]>(`/pedidos/${id}/documentos`),
    apiFetch<PlanoPedido[]>(`/pedidos/${id}/planos`),
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

      <PedidoNav
        items={[
          { id: "modulacion", label: "Modulación", count: modulos.length },
          {
            id: "documentacion",
            label: "Documentación",
            count: documentos.length,
            alerta: TIPOS_OBLIGATORIOS.some((t) => !documentos.some((d) => d.tipo === t)),
          },
          { id: "planos", label: "Planos", count: planos.length },
        ]}
      />

      <section id="modulacion" className="flex scroll-mt-20 flex-col gap-4">
        <h2 className="text-lg font-semibold">Modulación</h2>
        <ModulosTable modulos={modulos} />
      </section>

      <DocumentacionPedido pedidoId={id} codigoPedido={pedido.codigo_pedido} documentos={documentos} />

      <PlanosPedido pedidoId={id} planos={planos} modulos={modulos} />
    </main>
  );
}
