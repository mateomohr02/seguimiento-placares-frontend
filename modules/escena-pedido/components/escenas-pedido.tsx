import Link from "next/link";
import { BoxIcon } from "lucide-react";
import { EscenaEliminar } from "./escena-eliminar";
import { EscenaSubir } from "./escena-subir";
import type { EscenaPedido } from "../types/escena-pedido.types";

const fecha = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" });

// Escenas 3D del pedido (archivos .3d de TeoWin), solo para ver: no se anotan.
// No es obligatoria (no marca "falta").
export function EscenasPedido({
  pedidoId,
  escenas,
  puedeGestionar,
}: {
  pedidoId: string;
  escenas: EscenaPedido[];
  /** Subir y eliminar escenas (permiso documentacion.gestionar). */
  puedeGestionar: boolean;
}) {
  return (
    <section id="escenas" className="flex scroll-mt-20 flex-col gap-4">
      <h2 className="text-lg font-semibold">Escenas 3D</h2>
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        {escenas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este pedido no tiene escenas 3D cargadas.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {escenas.map((e) => (
              <li key={e.id} className="flex flex-col gap-2 rounded-lg border bg-background p-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
                    <BoxIcon className="size-6 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{e.nombre}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {e.nombre_archivo} · cargada {fecha.format(new Date(e.creado_en))}
                    </div>
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <Link
                    href={`/pedidos/${pedidoId}/escenas/${e.id}`}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
                  >
                    Abrir
                  </Link>
                  {puedeGestionar && <EscenaEliminar escena={e} />}
                </div>
              </li>
            ))}
          </ul>
        )}
        {puedeGestionar && <EscenaSubir pedidoId={pedidoId} />}
      </div>
    </section>
  );
}
