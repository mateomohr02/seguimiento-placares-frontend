"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/loading-dots";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fechaCorta } from "@/modules/planilla/lib/estaciones";
import { actualizarItemAction, crearItemAction, type PlanificacionResult } from "../actions/planificacion.actions";
import type { ItemInput, ItemPlanificacion, PedidoElegible, PlantillaPlanificacion } from "../types/planificacion.types";

interface Valores {
  semana: string;
  n_tw: string;
  cliente: string;
  modelo: string;
  color: string;
  compromiso: string;
  modulos: string;
  observaciones: string;
}

const vacio = (semana: string): Valores => ({ semana, n_tw: "", cliente: "", modelo: "", color: "", compromiso: "", modulos: "", observaciones: "" });

const desdeItem = (i: ItemPlanificacion): Valores => ({
  semana: i.semana_inicio,
  n_tw: i.n_tw,
  cliente: i.cliente ?? "",
  modelo: i.modelo ?? "",
  color: i.color ?? "",
  compromiso: i.compromiso ?? "",
  modulos: i.modulos === null ? "" : String(i.modulos),
  observaciones: i.observaciones ?? "",
});

const pedidoDe = (i?: ItemPlanificacion): PedidoElegible | null =>
  i && i.pedido_id ? { pedido_id: i.pedido_id, codigo_pedido: i.n_tw, referencia: i.cliente, orden_id: i.orden_id, n_orden: i.n_orden } : null;

function Campo({ etiqueta, className, children }: { etiqueta: string; className?: string; children: ReactNode }) {
  return (
    <label className={`flex flex-col gap-1 text-sm ${className ?? ""}`}>
      <span className="font-medium">{etiqueta}</span>
      {children}
    </label>
  );
}

// Campo N° TW con buscador de pedidos ya cargados en la app. Se puede escribir un N° que no esté en la lista (la fila queda sin pedido
// asociado, previo aviso). La lista se muestra en línea, debajo del campo.
function CampoNTw({
  valor,
  elegido,
  onTexto,
  onElegir,
}: {
  valor: string;
  elegido: PedidoElegible | null;
  onTexto: (texto: string) => void;
  onElegir: (p: PedidoElegible) => void;
}) {
  const [lista, setLista] = useState<PedidoElegible[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/planificacion-api/pedidos?q=${encodeURIComponent(valor.trim())}`, { signal: ctl.signal });
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
  }, [valor, abierto]);

  return (
    <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
      <label htmlFor="n-tw-planificacion" className="text-sm font-medium">
        N° TW
      </label>
      <Input
        id="n-tw-planificacion"
        role="combobox"
        aria-expanded={abierto}
        aria-controls="lista-pedidos-planificacion"
        placeholder="Escribí o buscá el N° de pedido…"
        value={valor}
        onChange={(e) => {
          onTexto(e.target.value.replace(/\s/g, ""));
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        maxLength={60}
        autoComplete="off"
        className="h-11"
      />
      <span className="text-xs text-muted-foreground" aria-live="polite">
        {elegido ? `Pedido de la app: orden ${elegido.n_orden ?? "—"}.` : "Sin espacios. Si el N° existe en la app, la fila se asocia sola al pedido."}
      </span>
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

// Alta y edición de una fila de la planificación (técnica). El N° TW identifica el pedido: si existe en la app la fila se asocia; si no,
// se avisa y se pregunta si se corrige o se carga sin pedido asociado. Cliente es texto libre.
export function ItemDialog({
  plantilla,
  semana,
  dia,
  item,
  trigger,
}: {
  plantilla: PlantillaPlanificacion;
  /** Lunes de la semana que se está viendo. */
  semana: string;
  /** Calidad: día (AAAA-MM-DD) de la sección desde donde se abre; al editar se usa el de la fila. */
  dia?: string;
  /** Con `item` se edita; sin él, se agrega una fila nueva. */
  item?: ItemPlanificacion;
  trigger: ReactNode;
}) {
  const calidad = plantilla === "CALIDAD";
  const diaFila = item?.dia ?? dia;
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<Valores>(() => (item ? desdeItem(item) : vacio(semana)));
  const [pedido, setPedido] = useState<PedidoElegible | null>(() => pedidoDe(item));
  const [error, setError] = useState<string | null>(null);
  // N° TW que no existe en la app, pendiente de decidir (corregir o cargar sin pedido).
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const set = (campo: keyof Valores) => (e: React.ChangeEvent<HTMLInputElement>) => setV((p) => ({ ...p, [campo]: e.target.value }));

  function abrir(next: boolean) {
    if (pendiente) return;
    setOpen(next);
    if (next) {
      setV(item ? desdeItem(item) : vacio(semana));
      setPedido(pedidoDe(item));
      setError(null);
      setAviso(null);
    }
  }

  function cuerpo(pedidoId: string | null): ItemInput {
    const input: ItemInput = {
      plantilla,
      semana: v.semana,
      n_tw: v.n_tw.trim(),
      cliente: v.cliente.trim(),
      modelo: v.modelo.trim(),
      observaciones: v.observaciones.trim(),
    };
    if (pedidoId) input.pedido_id = pedidoId;
    if (calidad) {
      if (diaFila) input.dia = diaFila;
      if (v.modulos.trim() !== "") input.modulos = Number(v.modulos);
    } else {
      input.color = v.color.trim();
      input.compromiso = v.compromiso;
    }
    return input;
  }

  function enviar(pedidoId: string | null): Promise<PlanificacionResult> {
    const input = cuerpo(pedidoId);
    return item ? actualizarItemAction(item.id, input) : crearItemAction(input);
  }

  function validar(): string | null {
    if (!v.n_tw.trim()) return "Cargá el N° TW.";
    if (/\s/.test(v.n_tw)) return "El N° TW no puede tener espacios.";
    if (!calidad && !v.semana) return "Elegí la semana.";
    if (calidad) {
      if (!diaFila) return "Falta el día de la fila.";
      if (v.modulos.trim() !== "" && !/^\d+$/.test(v.modulos.trim())) return "Los módulos deben ser un número entero de 0 o más.";
    }
    return null;
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const invalido = validar();
    if (invalido) return setError(invalido);
    setError(null);
    startTransition(async () => {
      let pedidoId = pedido && pedido.codigo_pedido === v.n_tw.trim() ? pedido.pedido_id : null;
      if (!pedidoId) {
        // Se valida el N° TW tipeado contra los pedidos de la app (coincidencia exacta).
        try {
          const res = await fetch(`/planificacion-api/pedido?n_tw=${encodeURIComponent(v.n_tw.trim())}`);
          const json = (await res.json().catch(() => null)) as { data?: PedidoElegible | null; message?: string } | null;
          if (!res.ok) return setError(json?.message ?? "No se pudo verificar el N° TW.");
          const hallado = json?.data ?? null;
          if (hallado) {
            pedidoId = hallado.pedido_id;
          } else if (!(item && item.sin_pedido && item.n_tw === v.n_tw.trim())) {
            // Si se edita una fila que ya estaba sin pedido y el N° TW no cambió, no se vuelve a preguntar.
            return setAviso(v.n_tw.trim());
          }
        } catch {
          return setError("No se pudo comunicar con el servidor.");
        }
      }
      const r = await enviar(pedidoId);
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
            <DialogTitle>{item ? "Editar fila" : calidad ? "Agregar a Calidad" : "Agregar a la planificación"}</DialogTitle>
            <DialogDescription>
              El N° TW identifica el pedido: si existe en la app, la fila queda asociada a él (N° de orden y links). El cliente es texto libre.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            {calidad ? (
              <div className="col-span-2 rounded-lg border bg-muted/40 p-3 text-sm">
                <span className="block text-xs text-muted-foreground">Día</span>
                <strong>{diaFila ? fechaCorta(diaFila) : "—"}</strong>
              </div>
            ) : (
              <Campo etiqueta="Semana (cualquier día de la semana)" className="col-span-2">
                <Input type="date" value={v.semana} onChange={set("semana")} className="h-11" required />
              </Campo>
            )}

            <Campo etiqueta="Cliente" className="col-span-2 sm:col-span-1">
              <Input value={v.cliente} onChange={set("cliente")} maxLength={200} autoComplete="off" className="h-11" />
            </Campo>
            <CampoNTw
              valor={v.n_tw}
              elegido={pedido && pedido.codigo_pedido === v.n_tw.trim() ? pedido : null}
              onTexto={(texto) => {
                setV((p) => ({ ...p, n_tw: texto }));
                setAviso(null);
                setPedido((p) => (p && p.codigo_pedido === texto.trim() ? p : null));
              }}
              onElegir={(p) => {
                setPedido(p);
                setV((prev) => ({ ...prev, n_tw: p.codigo_pedido, cliente: prev.cliente.trim() === "" ? (p.referencia ?? "") : prev.cliente }));
              }}
            />

            <Campo etiqueta="Modelo">
              <Input value={v.modelo} onChange={set("modelo")} maxLength={80} autoComplete="off" className="h-11" />
            </Campo>
            {calidad ? (
              <Campo etiqueta="Cantidad de módulos">
                <Input type="number" inputMode="numeric" min={0} step={1} value={v.modulos} onChange={set("modulos")} className="h-11" />
              </Campo>
            ) : (
              <>
                <Campo etiqueta="Color">
                  <Input value={v.color} onChange={set("color")} maxLength={80} autoComplete="off" className="h-11" />
                </Campo>
                <Campo etiqueta="Fecha compromiso">
                  <Input type="date" value={v.compromiso} onChange={set("compromiso")} className="h-11" />
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

          {aviso !== null && (
            <div role="alert" className="flex flex-col gap-3 rounded-lg border border-amber-500/60 bg-amber-500/10 p-3 text-sm">
              <p className="flex items-start gap-2">
                <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <span>
                  El N° TW <strong>{aviso}</strong> no existe en la app. Podés corregirlo, o cargar la fila igual sin pedido asociado (se verá con el aviso «Pedido no
                  encontrado», sin links, y la podés editar después para asociarla).
                </span>
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" className="h-11 px-4" onClick={() => setAviso(null)}>
                  Corregir
                </Button>
                <ConfirmActionButton
                  variant="default"
                  className="h-11 px-4"
                  label="Cargar sin pedido asociado"
                  title="¿Cargar sin pedido asociado?"
                  description={<>La fila con N° TW «{aviso}» se guarda sin pedido: no tendrá links ni N° de orden.</>}
                  successMessage={item ? "Fila guardada sin pedido asociado." : "Fila agregada sin pedido asociado."}
                  errorTitle="No se pudo guardar la fila"
                  run={async () => {
                    const r = await enviar(null);
                    if (r.success) setOpen(false);
                    return r;
                  }}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" disabled={pendiente} onClick={() => abrir(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pendiente || aviso !== null}>
              {pendiente ? <LoadingDots /> : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
