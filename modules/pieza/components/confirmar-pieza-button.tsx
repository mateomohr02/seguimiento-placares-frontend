"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { confirmarPiezaAction } from "../actions/confirmar-pieza.action";

export function ConfirmarPiezaButton({ piezaId, disabled }: { piezaId: string; disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await confirmarPiezaAction(piezaId);
      if (!result.success) {
        toast.error("No se pudo confirmar la pieza", { description: result.message });
        return;
      }
      toast.success("Pieza marcada como cortada.");
    });
  }

  return (
    <Button size="sm" variant="outline" disabled={disabled || isPending} onClick={onClick}>
      {isPending ? "Guardando..." : "Marcar finalizado"}
    </Button>
  );
}
