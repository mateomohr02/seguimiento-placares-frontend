"use client";

import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "cn";
import type { Partida } from "../types/modulo.types";
import { PartidaCard } from "./partida-card";

/**
 * Encabezado fijo del detalle del módulo, sobre el despiece. En celular la descripción (lo más largo) queda
 * colapsada hasta que se despliega; desde `sm` siempre se ve completa.
 */
export function PartidaEncabezado({ partida }: { partida: Partida | null }) {
  const [abierta, setAbierta] = useState(false);
  if (!partida) return null;

  return (
    <section aria-label="Partida del módulo" className="rounded-lg border bg-card p-4 text-card-foreground">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Partida</h2>
        <button
          type="button"
          onClick={() => setAbierta((v) => !v)}
          aria-expanded={abierta}
          className="-my-2 -mr-2 inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm text-muted-foreground hover:text-foreground sm:hidden"
        >
          {abierta ? "Ocultar descripción" : "Ver descripción"}
          <ChevronDownIcon className={cn("size-4 transition-transform", abierta && "rotate-180")} aria-hidden />
        </button>
      </div>
      <PartidaCard partida={partida} descripcionClassName={abierta ? undefined : "max-sm:hidden"} />
    </section>
  );
}
