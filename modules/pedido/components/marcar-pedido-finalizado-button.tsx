"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { marcarPedidoFinalizadoAction } from "../actions/marcar-pedido-finalizado.action";

export function MarcarPedidoFinalizadoButton({
  pedidoId,
  ordenId,
  disabled,
}: {
  pedidoId: string;
  ordenId: string;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await marcarPedidoFinalizadoAction(pedidoId, ordenId);
      if (!result.success) {
        toast.error("No se pudo finalizar el pedido", { description: result.message });
        return;
      }
      toast.success(`Pedido ${result.pedido.codigo_pedido} marcado como finalizado.`);
    });
  }

  return (
    <Button size="sm" variant="outline" disabled={disabled || isPending} onClick={onClick}>
      {isPending ? "Guardando..." : "Marcar finalizado"}
    </Button>
  );
}
