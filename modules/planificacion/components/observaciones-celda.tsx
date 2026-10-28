"use client";

import { useState, useTransition, type ReactNode } from "react";
import { HistoryIcon, MessageSquarePlusIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { LoadingDots } from "@/components/loading-dots";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { agregarObservacionAction, editarObservacionAction, eliminarObservacionAction } from "../actions/planificacion.actions";
import type { ItemPlanificacion, ObservacionPlanificacion } from "../types/planificacion.types";

const MAX = 500;
const fechaHora = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" });
const cuando = (iso: string) => fechaHora.format(new Date(iso));
const ACCION: Record<string, string> = { CREADA: "Agregó", EDITADA: "Editó", ELIMINADA: "Borró" };

// Alta o edición del texto de una observación (la edición solo es posible sobre las propias).
function ObservacionDialog({ item, observacion, trigger }: { item: ItemPlanificacion; observacion?: ObservacionPlanificacion; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  function abrir(next: boolean) {
    if (pendiente) return;
    setOpen(next);
    if (next) {
      setTexto(observacion?.texto ?? "");
      setError(null);
    }
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = observacion ? await editarObservacionAction(observacion.id, texto) : await agregarObservacionAction(item.id, texto);
      if (!r.success) return setError(r.message);
      toast.success(observacion ? "Observación guardada." : "Observación agregada.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={abrir}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <form onSubmit={guardar} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{observacion ? "Editar observación" : "Agregar observación"}</DialogTitle>
            <DialogDescription>
              {item.codigo_pedido}. Queda firmada con tu nombre y se guarda el historial de cambios.
            </DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Observación</span>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={MAX}
              rows={4}
              required
              autoFocus
              className="min-h-28 rounded-lg border border-input bg-background px-2.5 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            />
            <span className="text-xs text-muted-foreground">
              {texto.length} / {MAX}
            </span>
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={pendiente} onClick={() => abrir(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pendiente || texto.trim() === ""}>
              {pendiente ? <LoadingDots /> : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Historial de la fila: cada alta, edición y baja de observaciones, con quién y cuándo (incluye las borradas).
function HistorialDialog({ item }: { item: ItemPlanificacion }) {
  const eventos = item.comentarios
    .flatMap((c) => c.historial.map((h) => ({ ...h, autor: c.autor })))
    .sort((a, b) => a.en.localeCompare(b.en));

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline" className="h-11 gap-1.5 px-3" aria-label="Historial de observaciones" title="Historial de observaciones">
            <HistoryIcon /> Historial
          </Button>
        }
      />
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Historial de observaciones</DialogTitle>
          <DialogDescription>{item.codigo_pedido}. Incluye las observaciones editadas y borradas.</DialogDescription>
        </DialogHeader>
        {eventos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay observaciones.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {eventos.map((e) => (
              <li key={e.id} className="rounded-lg border p-3 text-sm">
                <p className="text-xs text-muted-foreground">
                  {cuando(e.en)} · <strong className="text-foreground">{e.por}</strong> {ACCION[e.accion]?.toLowerCase() ?? e.accion.toLowerCase()}
                  {e.por !== e.autor && <> una observación de {e.autor}</>}
                </p>
                <p className={`pt-1 whitespace-pre-wrap ${e.accion === "ELIMINADA" ? "text-muted-foreground line-through" : ""}`}>{e.texto}</p>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Columna «Observaciones»: la de técnica (cargada con la fila) y, debajo, las de los usuarios, cada una con su autor.
export function ObservacionesCelda({ item }: { item: ItemPlanificacion }) {
  const vigentes = item.comentarios.filter((c) => c.eliminado_en === null);

  return (
    <div className="flex flex-col items-start gap-2">
      {item.observaciones && (
        <p className="text-sm">
          <span className="block text-xs font-medium text-muted-foreground">Técnica</span>
          {item.observaciones}
        </p>
      )}
      {vigentes.map((c) => (
        <div key={c.id} className="w-full rounded-lg border bg-muted/40 p-2 text-sm">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">{c.autor}</strong> · {cuando(c.creado_en)}
            {c.editado_en && <> · editada</>}
          </p>
          <p className="whitespace-pre-wrap">{c.texto}</p>
          {(c.puede_editar || c.puede_borrar) && (
            <div className="flex gap-1 pt-1.5">
              {c.puede_editar && (
                <ObservacionDialog
                  item={item}
                  observacion={c}
                  trigger={
                    <Button size="sm" variant="outline" className="size-11" aria-label="Editar observación" title="Editar observación">
                      <PencilIcon />
                    </Button>
                  }
                />
              )}
              {c.puede_borrar && (
                <ConfirmActionButton
                  variant="destructive"
                  className="size-11"
                  ariaLabel="Borrar observación"
                  label={<Trash2Icon />}
                  title="¿Borrar la observación?"
                  description={
                    <>
                      Se borra la observación de {c.autor}. Queda registrada en el historial de la fila.
                    </>
                  }
                  confirmLabel="Borrar"
                  successMessage="Observación borrada."
                  errorTitle="No se pudo borrar la observación"
                  run={() => eliminarObservacionAction(c.id)}
                />
              )}
            </div>
          )}
        </div>
      ))}
      {!item.observaciones && vigentes.length === 0 && <span>—</span>}
      <div className="flex flex-wrap gap-1">
        <ObservacionDialog
          item={item}
          trigger={
            <Button size="sm" variant="outline" className="h-11 gap-1.5 px-3">
              <MessageSquarePlusIcon /> Observación
            </Button>
          }
        />
        {item.comentarios.length > 0 && <HistorialDialog item={item} />}
      </div>
    </div>
  );
}
