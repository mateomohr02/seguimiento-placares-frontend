"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/loading-dots";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { actualizarItemAction, crearItemAction } from "../actions/planificacion.actions";
import { ETIQUETA_TIPO, type ItemInput, type ItemPlanificacion, type TipoPlanificacion } from "../types/planificacion.types";

const vacio = (tipo: TipoPlanificacion, semana: string): ItemInput => ({
  tipo,
  semana,
  cliente: "",
  n_tw: "",
  n_orden: "",
  modelo: "",
  color: "",
  fabrica: "",
  fecha_limite: "",
  distribuidor: "",
  ticket: "",
  tipo_reclamo: "",
  compromiso: "",
  finalizado_en: "",
  observaciones: "",
});

const desdeItem = (i: ItemPlanificacion): ItemInput => ({
  tipo: i.tipo,
  semana: i.semana_inicio,
  cliente: i.cliente,
  n_tw: i.n_tw,
  n_orden: i.n_orden ?? "",
  modelo: i.modelo ?? "",
  color: i.color ?? "",
  fabrica: i.fabrica ?? "",
  fecha_limite: i.fecha_limite ?? "",
  distribuidor: i.distribuidor ?? "",
  ticket: i.ticket ?? "",
  tipo_reclamo: i.tipo_reclamo ?? "",
  compromiso: i.compromiso ?? "",
  finalizado_en: i.finalizado_en ?? "",
  observaciones: i.observaciones ?? "",
});

function Campo({ etiqueta, className, children }: { etiqueta: string; className?: string; children: ReactNode }) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className ?? ""}`}>
      <span className="font-medium">{etiqueta}</span>
      {children}
    </label>
  );
}

// Alta y edición de una fila de la planificación (técnica). Los campos cambian según sea un pedido o un reclamo.
export function ItemDialog({
  tipo,
  semana,
  item,
  trigger,
}: {
  tipo: TipoPlanificacion;
  /** Lunes de la semana que se está viendo. */
  semana: string;
  /** Con `item` se edita; sin él, se agrega una fila nueva. */
  item?: ItemPlanificacion;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<ItemInput>(() => (item ? desdeItem(item) : vacio(tipo, semana)));
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const set = (campo: keyof ItemInput) => (e: React.ChangeEvent<HTMLInputElement>) => setV((p) => ({ ...p, [campo]: e.target.value }));
  const reclamo = v.tipo === "RECLAMOS";

  function abrir(next: boolean) {
    if (pendiente) return;
    setOpen(next);
    if (next) {
      setV(item ? desdeItem(item) : vacio(tipo, semana));
      setError(null);
    }
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = item ? await actualizarItemAction(item.id, v) : await crearItemAction(v);
      if (!r.success) return setError(r.message);
      toast.success(item ? "Fila guardada." : "Fila agregada.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={abrir}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent showCloseButton={false} className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={guardar} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{item ? "Editar fila" : `Agregar a ${ETIQUETA_TIPO[tipo].toLowerCase()}`}</DialogTitle>
            <DialogDescription>
              {reclamo ? "Datos del reclamo, como en la planilla de oficina técnica." : "Datos del pedido, como en la planilla de oficina técnica."}
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

            <Campo etiqueta="Cliente" className="col-span-2">
              <Input value={v.cliente} onChange={set("cliente")} maxLength={120} autoComplete="off" className="h-11" />
            </Campo>
            {reclamo && (
              <>
                <Campo etiqueta="Distribuidor">
                  <Input value={v.distribuidor} onChange={set("distribuidor")} maxLength={80} autoComplete="off" className="h-11" />
                </Campo>
                <Campo etiqueta="Ticket">
                  <Input value={v.ticket} onChange={set("ticket")} maxLength={40} autoComplete="off" className="h-11" />
                </Campo>
              </>
            )}
            <Campo etiqueta="N° TW">
              <Input value={v.n_tw} onChange={(e) => setV((p) => ({ ...p, n_tw: e.target.value.toUpperCase() }))} maxLength={40} autoComplete="off" autoCapitalize="characters" className="h-11" />
            </Campo>
            {!reclamo ? (
              <>
                <Campo etiqueta="N° Orden">
                  <Input value={v.n_orden} onChange={set("n_orden")} maxLength={40} autoComplete="off" className="h-11" />
                </Campo>
                <Campo etiqueta="Modelo">
                  <Input value={v.modelo} onChange={set("modelo")} maxLength={80} autoComplete="off" className="h-11" />
                </Campo>
                <Campo etiqueta="Color">
                  <Input value={v.color} onChange={set("color")} maxLength={80} autoComplete="off" className="h-11" />
                </Campo>
                <Campo etiqueta="Fábrica (fecha)">
                  <Input type="date" value={v.fabrica} onChange={set("fabrica")} className="h-11" />
                </Campo>
                <Campo etiqueta="Fecha límite">
                  <Input type="date" value={v.fecha_limite} onChange={set("fecha_limite")} className="h-11" />
                </Campo>
              </>
            ) : (
              <>
                <Campo etiqueta="Tipo de reclamo" className="col-span-2">
                  <Input value={v.tipo_reclamo} onChange={set("tipo_reclamo")} maxLength={200} placeholder="Ej. Relaminado / 23 placas" autoComplete="off" className="h-11" />
                </Campo>
                <Campo etiqueta="Color">
                  <Input value={v.color} onChange={set("color")} maxLength={80} autoComplete="off" className="h-11" />
                </Campo>
                <Campo etiqueta="Compromiso">
                  <Input type="date" value={v.compromiso} onChange={set("compromiso")} className="h-11" />
                </Campo>
                <Campo etiqueta="Finalizado (fecha)">
                  <Input type="date" value={v.finalizado_en} onChange={set("finalizado_en")} className="h-11" />
                </Campo>
              </>
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
