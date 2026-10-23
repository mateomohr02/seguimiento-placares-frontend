"use client";

import type { RefObject } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import type { Modulo } from "../types/modulo.types";
import { PartidaCard } from "./partida-card";

/**
 * Popup con la partida de un módulo. Fondo blureado y oscurecido que cubre también la barra de navegación (z-50
 * contra el z-40 de la barra); se cierra con clic/toque fuera de la card, con Escape o con el botón de cerrar.
 * Base UI aporta role="dialog", aria-modal, foco atrapado y lo devuelve a `volverFoco` al cerrar.
 */
export function PartidaPopup({
  modulo,
  onClose,
  volverFoco,
}: {
  modulo: Modulo | null;
  onClose: () => void;
  volverFoco: RefObject<HTMLElement | null>;
}) {
  const partida = modulo?.partida ?? null;
  return (
    <Dialog open={!!partida} onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-black/60 supports-backdrop-filter:backdrop-blur-md" />
        <DialogPrimitive.Popup
          finalFocus={volverFoco}
          className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-xl bg-popover p-4 text-popover-foreground shadow-xl ring-1 ring-foreground/10 outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <DialogTitle className="text-sm font-semibold">Partida del módulo {modulo?.idEscena}</DialogTitle>
            <DialogPrimitive.Close
              aria-label="Cerrar"
              className="-m-2 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <XIcon className="size-5" aria-hidden />
            </DialogPrimitive.Close>
          </div>
          {partida && <PartidaCard partida={partida} />}
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
