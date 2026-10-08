import Link from "next/link";
import { FileTextIcon } from "lucide-react";
import { PlanoEliminar } from "./plano-eliminar";
import { PlanoSubir } from "./plano-subir";
import { esImagen, type PlanoPedido } from "../types/plano-pedido.types";

const fecha = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" });

// Planos del pedido. Son pocos los pedidos / módulos que los llevan (por eso la
// sección no marca "falta"), pero cuando existen son críticos: se muestran con
// miniatura y el módulo al que corresponden.
export function PlanosPedido({
  pedidoId,
  planos,
  modulos,
  puedeGestionar,
}: {
  pedidoId: string;
  planos: PlanoPedido[];
  modulos: { id: string; idEscena: number; descripcion: string }[];
  /** Subir y eliminar planos (permiso documentacion.gestionar). */
  puedeGestionar: boolean;
}) {
  return (
    <section id="planos" className="flex scroll-mt-20 flex-col gap-4">
      <h2 className="text-lg font-semibold">Planos</h2>
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        {planos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este pedido no tiene planos cargados.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {planos.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 rounded-lg border bg-background p-3">
                <Link href={`/pedidos/${pedidoId}/planos/${p.id}`} className="block" aria-label={`Abrir ${p.nombre}`}>
                  <div className="flex h-40 items-center justify-center overflow-hidden rounded-md bg-muted">
                    {esImagen(p.mime) ? (
                      // eslint-disable-next-line @next/next/no-img-element -- archivo servido por un proxy propio
                      <img
                        src={`/planos-pedido/${p.id}/archivo`}
                        alt=""
                        loading="lazy"
                        className="size-full object-contain"
                      />
                    ) : (
                      <FileTextIcon className="size-10 text-muted-foreground" />
                    )}
                  </div>
                </Link>
                <div className="min-w-0">
                  <div className="truncate font-medium">{p.nombre}</div>
                  <div className="truncate text-sm text-muted-foreground">
                    {p.modulo ? `Módulo ${p.modulo.idEscena} — ${p.modulo.descripcion}` : "Todo el pedido"}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {p.nombre_archivo} · cargado {fecha.format(new Date(p.creado_en))}
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <Link
                    href={`/pedidos/${pedidoId}/planos/${p.id}`}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
                  >
                    Abrir
                  </Link>
                  {puedeGestionar && <PlanoEliminar plano={p} />}
                </div>
              </li>
            ))}
          </ul>
        )}
        {puedeGestionar && <PlanoSubir pedidoId={pedidoId} modulos={modulos} />}
      </div>
    </section>
  );
}
