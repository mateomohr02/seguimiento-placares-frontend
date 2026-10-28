"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/loading-dots";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { actualizarItemAction, crearItemAction } from "../actions/planificacion.actions";
import { ETIQUETA_TIPO, type ItemInput, type ItemPlanificacion, type PedidoElegible, type TipoPlanificacion } from "../types/planificacion.types";

const vacio = (estacionId: string, tipo: TipoPlanificacion, semana: string): ItemInput => ({
  estacion_id: estacionId,
  tipo,
  semana,
  pedido_id: "",
  modelo: "",
  color: "",
  compromiso: "",
  finalizado_en: "",
  distribuidor: "",
  ticket: "",
  tipo_reclamo: "",
  observaciones: "",
});

const desdeItem = (estacionId: string, i: ItemPlanificacion): ItemInput => ({
  estacion_id: estacionId,
  tipo: i.tipo,
  semana: i.semana_inicio,
  pedido_id: i.pedido_id ?? "",
  modelo: i.modelo ?? "",
  color: i.color ?? "",
  compromiso: i.compromiso ?? "",
  finalizado_en: i.finalizado_en ?? "",
  distribuidor: i.distribuidor ?? "",
  ticket: i.ticket ?? "",
  tipo_reclamo: i.tipo_reclamo ?? "",
  observaciones: i.observaciones ?? "",
});

const pedidoDe = (i?: ItemPlanificacion): PedidoElegible | null =>
  i && i.pedido_id ? { pedido_id: i.pedido_id, codigo_pedido: i.codigo_pedido, referencia: i.cliente, orden_id: i.orden_id, n_orden: i.n_orden } : null;

function Campo({ etiqueta, className, children }: { etiqueta: string; className?: string; children: ReactNode }) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className ?? ""}`}>
      <span className="font-medium">{etiqueta}</span>
      {children}
    </label>
  );
}

// Buscador de pedidos ya cargados en la app (por N° de pedido). La lista se muestra en línea, debajo del campo.
function SelectorPedido({ elegido, onElegir }: { elegido: PedidoElegible | null; onElegir: (p: PedidoElegible) => void }) {
  const [q, setQ] = useState("");
  const [lista, setLista] = useState<PedidoElegible[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/planificacion-api/pedidos?q=${encodeURIComponent(q.trim())}`, { signal: ctl.signal });
        const json = (await res.json().catch(() => null)) as { data?: PedidoElegible[]; message?: string } | null;
        if (!res.ok) {
          setError(json?.message ?? "No se pudo buscar.");
          setLista([]);
          return;
        }
        setError(null);
        setLista(json?.data ?? []);
      } catch {
        /* cancelado */
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q, abierto]);

  return (
    <div className="col-span-2 flex flex-col gap-1.5">
      <span className="text-sm font-medium">Pedido (cargado en la app)</span>
      <Input
        role="combobox"
        aria-expanded={abierto}
        aria-controls="lista-pedidos-planificacion"
        aria-label="Buscar pedido por número"
        placeholder={elegido ? `${elegido.codigo_pedido} — escribí para cambiarlo` : "Escribí el N° de pedido…"}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        autoComplete="off"
        className="h-11"
      />
      {abierto && (
        <ul id="lista-pedidos-planificacion" role="listbox" className="max-h-48 overflow-auto rounded-lg border p-1">
          {error && <li className="px-3 py-2 text-sm text-destructive">{error}</li>}
          {!error && lista === null && <li className="px-3 py-2 text-sm text-muted-foreground">Buscando…</li>}
          {!error && lista !== null && lista.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">Ningún pedido cargado coincide.</li>}
          {lista?.map((p) => (
            <li key={p.pedido_id} role="option" aria-selected={elegido?.pedido_id === p.pedido_id}>
              <button
                type="button"
                onClick={() => {
                  onElegir(p);
                  setAbierto(false);
                  setQ("");
                }}
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <span className="font-medium">{p.codigo_pedido}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {p.referencia ?? "sin cliente"} · orden {p.n_orden ?? "—"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Alta y edición de una fila de la planificación (técnica): se elige un pedido ya cargado; N° TW, N° orden y cliente se derivan de él.
export function ItemDialog({
  estacionId,
  tipo,
  semana,
  item,
  trigger,
}: {
  estacionId: string;
  tipo: TipoPlanificacion;
  /** Lunes de la semana que se está viendo. */
  semana: string;
  /** Con `item` se edita; sin él, se agrega una fila nueva. */
  item?: ItemPlanificacion;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<ItemInput>(() => (item ? desdeItem(estacionId, item) : vacio(estacionId, tipo, semana)));
  const [pedido, setPedido] = useState<PedidoElegible | null>(() => pedidoDe(item));
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const set = (campo: keyof ItemInput) => (e: React.ChangeEvent<HTMLInputElement>) => setV((p) => ({ ...p, [campo]: e.target.value }));
  const reclamo = v.tipo === "RECLAMOS";

  function abrir(next: boolean) {
    if (pendiente) return;
    setOpen(next);
    if (next) {
      setV(item ? desdeItem(estacionId, item) : vacio(estacionId, tipo, semana));
      setPedido(pedidoDe(item));
      setError(null);
    }
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!pedido) return setError("Elegí un pedido de la lista.");
    setError(null);
    startTransition(async () => {
      const input = { ...v, pedido_id: pedido.pedido_id };
      const r = item ? await actualizarItemAction(item.id, input) : await crearItemAction(input);
      if (!r.success) return setError(r.message);
      toast.success(item ? "Fila guardada." : "Fila agregada.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={abrir}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent showCloseButton={false} className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={guardar} className="flex flex-col gap-4" noValidate>
          <DialogHeader>
            <DialogTitle>{item ? "Editar fila" : `Agregar a ${ETIQUETA_TIPO[tipo].toLowerCase()}`}</DialogTitle>
            <DialogDescription>
              {reclamo ? "Datos del reclamo." : "Datos del pedido."} Se elige un pedido ya cargado en la app; el N° TW, el N° de orden y el cliente salen de él.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <Campo etiqueta="Semana (cualquier día de la semana)">
              <Input type="date" value={v.semana} onChange={set("semana")} className="h-11" required />
            </Campo>
            <Campo etiqueta="Tipo">
              <select
                value={v.tipo}
                onChange={(e) => setV((p) => ({ ...p, tipo: e.target.value as TipoPlanificacion }))}
                className="h-11 rounded-lg border border-input bg-background px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              >
                <option value="PEDIDOS">Pedidos</option>
                <option value="RECLAMOS">Reclamos</option>
              </select>
            </Campo>

            <SelectorPedido elegido={pedido} onElegir={setPedido} />

            <div className="col-span-2 grid grid-cols-3 gap-3 rounded-lg border bg-muted/40 p-3 text-sm" aria-live="polite">
              <div>
                <span className="block text-xs text-muted-foreground">N° TW</span>
                <strong>{pedido?.codigo_pedido ?? "—"}</strong>
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">N° Orden</span>
                <strong>{pedido?.n_orden ?? "—"}</strong>
              </div>
              <div className="min-w-0">
                <span className="block text-xs text-muted-foreground">Cliente</span>
                <strong className="block truncate">{pedido?.referencia ?? "—"}</strong>
              </div>
            </div>

            {reclamo && (
              <>
                <Campo etiqueta="Distribuidor">
                  <Input value={v.distribuidor} onChange={set("distribuidor")} maxLength={80} autoComplete="off" className="h-11" />
                </Campo>
                <Campo etiqueta="Ticket">
                  <Input value={v.ticket} onChange={set("ticket")} maxLength={40} autoComplete="off" className="h-11" />
                </Campo>
                <Campo etiqueta="Tipo de reclamo" className="col-span-2">
                  <Input value={v.tipo_reclamo} onChange={set("tipo_reclamo")} maxLength={200} placeholder="Ej. Relaminado / 23 placas" autoComplete="off" className="h-11" />
                </Campo>
              </>
            )}
            {!reclamo && (
              <Campo etiqueta="Modelo">
                <Input value={v.modelo} onChange={set("modelo")} maxLength={80} autoComplete="off" className="h-11" />
              </Campo>
            )}
            <Campo etiqueta="Color">
              <Input value={v.color} onChange={set("color")} maxLength={80} autoComplete="off" className="h-11" />
            </Campo>
            <Campo etiqueta="Fecha compromiso">
              <Input type="date" value={v.compromiso} onChange={set("compromiso")} className="h-11" />
            </Campo>
            {reclamo && (
              <Campo etiqueta="Finalizado (fecha)">
                <Input type="date" value={v.finalizado_en} onChange={set("finalizado_en")} className="h-11" />
              </Campo>
            )}
            <Campo etiqueta="Observaciones" className="col-span-2">
              <Input value={v.observaciones} onChange={set("observaciones")} maxLength={500} autoComplete="off" className="h-11" />
            </Campo>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={pendiente} onClick={() => abrir(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pendiente}>
              {pendiente ? <LoadingDots /> : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
