"use client";

import { useState } from "react";
import { FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fechaCorta } from "@/modules/planilla/lib/estaciones";

/** Clave de las filas sin fecha de compromiso. */
export const SIN_FECHA = "";

export interface OpcionFecha {
  clave: string; // AAAA-MM-DD o SIN_FECHA
  cantidad: number;
}

/** Fechas distintas de una lista de filas, de menor a mayor (las vacías al final), con cuántas filas tiene cada una. */
export function opcionesDeFecha(fechas: (string | null)[]): OpcionFecha[] {
  const cuenta = new Map<string, number>();
  for (const f of fechas) cuenta.set(f ?? SIN_FECHA, (cuenta.get(f ?? SIN_FECHA) ?? 0) + 1);
  return [...cuenta.entries()]
    .map(([clave, cantidad]) => ({ clave, cantidad }))
    .sort((a, b) => (a.clave === SIN_FECHA ? 1 : b.clave === SIN_FECHA ? -1 : a.clave.localeCompare(b.clave)));
}

// Filtro por fecha de compromiso estilo Excel: lista de las fechas que hay, con tilde para mostrarlas u ocultarlas.
// `seleccion` null = sin filtro (se muestran todas).
export function FiltroCompromiso({
  opciones,
  seleccion,
  onChange,
}: {
  opciones: OpcionFecha[];
  seleccion: Set<string> | null;
  onChange: (s: Set<string> | null) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [borrador, setBorrador] = useState<Set<string>>(new Set());
  const activo = seleccion !== null;

  function abrir(o: boolean) {
    if (o) setBorrador(new Set(seleccion ?? opciones.map((x) => x.clave)));
    setAbierto(o);
  }

  function alternar(clave: string) {
    setBorrador((prev) => {
      const s = new Set(prev);
      if (s.has(clave)) s.delete(clave);
      else s.add(clave);
      return s;
    });
  }

  const todas = borrador.size === opciones.length;

  function aplicar() {
    // Todas tildadas = sin filtro.
    onChange(todas ? null : new Set(borrador));
    setAbierto(false);
  }

  return (
    <Dialog open={abierto} onOpenChange={abrir}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant={activo ? "default" : "ghost"}
            className="size-9"
            aria-label="Filtrar por fecha de compromiso"
            title={activo ? "Filtro de compromiso activo" : "Filtrar por fecha de compromiso"}
          >
            <FilterIcon />
          </Button>
        }
      />
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Filtrar por compromiso</DialogTitle>
          <DialogDescription>Tildá las fechas que querés ver.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 border-b px-1 font-medium">
            <input
              type="checkbox"
              className="size-5 accent-primary"
              checked={todas}
              onChange={() => setBorrador(todas ? new Set() : new Set(opciones.map((x) => x.clave)))}
            />
            (Seleccionar todo)
          </label>
          {opciones.map((o) => (
            <label key={o.clave || "sin-fecha"} className="flex min-h-11 cursor-pointer items-center gap-3 px-1">
              <input type="checkbox" className="size-5 accent-primary" checked={borrador.has(o.clave)} onChange={() => alternar(o.clave)} />
              <span className="flex-1">{o.clave === SIN_FECHA ? "(Vacías)" : fechaCorta(o.clave)}</span>
              <span className="text-xs text-muted-foreground">{o.cantidad}</span>
            </label>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" className="h-11 px-4" onClick={() => setAbierto(false)}>
            Cancelar
          </Button>
          <Button className="h-11 px-4" disabled={borrador.size === 0} onClick={aplicar}>
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
