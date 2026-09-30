"use client";

import { ConfirmActionButton } from "@/components/confirm-action-button";
import { marcarPedidoFinalizadoAction } from "../actions/marcar-pedido-finalizado.action";
import { marcarPedidoPendienteAction } from "../actions/marcar-pedido-pendiente.action";
import type { Pedido } from "../types/pedido.types";

export function PedidoAcciones({ pedido, ordenId }: { pedido: Pedido; ordenId: string }) {
  return (
    <div className="flex justify-end gap-2">
      <ConfirmActionButton
        label="Finalizado"
        title="¿Marcar pedido como finalizado?"
        description={<>Pedido {pedido.codigo_pedido}.</>}
        successMessage={`Pedido ${pedido.codigo_pedido} marcado como finalizado.`}
        errorTitle="No se pudo finalizar el pedido"
        disabled={pedido.estado === "FINALIZADO"}
        run={async () => {
          const r = await marcarPedidoFinalizadoAction(pedido.id, ordenId);
          return r.success ? { success: true } : r;
        }}
      />
      <ConfirmActionButton
        label="Pendiente"
        title="¿Volver el pedido a Pendiente?"
        description={
          <>
            Pedido {pedido.codigo_pedido}. Solo es posible si todos sus módulos están en Pendiente.
          </>
        }
        successMessage={`Pedido ${pedido.codigo_pedido} vuelto a Pendiente.`}
        errorTitle="No se pudo pasar el pedido a Pendiente"
        disabled={pedido.estado === "PENDIENTE"}
        run={() => marcarPedidoPendienteAction(pedido.id, ordenId)}
      />
    </div>
  );
}
