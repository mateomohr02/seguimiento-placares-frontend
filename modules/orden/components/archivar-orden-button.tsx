"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ArchiveIcon, ArchiveRestoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/loading-dots";
import { archivarOrdenAction } from "../actions/archivar-orden.action";

export function ArchivarOrdenButton({ ordenId, archivada }: { ordenId: string; archivada: boolean }) {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await archivarOrdenAction(ordenId, !archivada);
      if (!result.success) {
        toast.error("No se pudo actualizar la orden", { description: result.message });
        return;
      }
      toast.success(archivada ? "Orden desarchivada." : "Orden archivada.");
    });
  }

  return (
    <Button size="sm" variant="outline" disabled={isPending} onClick={onClick}>
      {isPending ? (
        <LoadingDots />
      ) : archivada ? (
        <>
          <ArchiveRestoreIcon /> Desarchivar
        </>
      ) : (
        <>
          <ArchiveIcon /> Archivar
        </>
      )}
    </Button>
  );
}
