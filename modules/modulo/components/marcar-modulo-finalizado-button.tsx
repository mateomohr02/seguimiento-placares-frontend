"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { marcarModuloFinalizadoAction } from "../actions/marcar-modulo-finalizado.action";

export function MarcarModuloFinalizadoButton({
  moduloId,
  pedidoId,
  disabled,
}: {
  moduloId: string;
  pedidoId: string;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await marcarModuloFinalizadoAction(moduloId, pedidoId);
      if (!result.success) {
        toast.error("No se pudo finalizar el módulo", { description: result.message });
        return;
      }
      toast.success(`Módulo ${result.modulo.idEscena} marcado como finalizado.`);
    });
  }

  return (
    <Button size="sm" variant="outline" disabled={disabled || isPending} onClick={onClick}>
      {isPending ? "Guardando..." : "Marcar finalizado"}
    </Button>
  );
}
