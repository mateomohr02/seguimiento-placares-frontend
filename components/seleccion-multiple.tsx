"use client";

import { cn } from "cn";

export interface OpcionSeleccion {
  id: string;
  etiqueta: string;
  /** Texto chico al lado (ej. «inactivo»). */
  detalle?: string;
}

// Lista de casillas para elegir varios (estaciones de un usuario, usuarios de una estación…).
// Cada opción ocupa al menos 44 px de alto para usarla con el dedo.
export function SeleccionMultiple({
  opciones,
  seleccion,
  onChange,
  disabled,
  vacio = "No hay opciones.",
  className,
}: {
  opciones: OpcionSeleccion[];
  seleccion: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  vacio?: string;
  className?: string;
}) {
  if (opciones.length === 0) return <p className="text-sm text-muted-foreground">{vacio}</p>;
  return (
    <div className={cn("grid gap-1.5 sm:grid-cols-2", className)}>
      {opciones.map((o) => {
        const marcada = seleccion.includes(o.id);
        return (
          <label
            key={o.id}
            className={cn(
              "flex min-h-11 items-center gap-2.5 rounded-lg border px-3 py-1.5 text-sm",
              marcada ? "border-primary/40 bg-primary/5" : "bg-background",
              disabled && "opacity-60",
            )}
          >
            <input
              type="checkbox"
              className="size-5 shrink-0 accent-(--primary)"
              checked={marcada}
              disabled={disabled}
              onChange={(e) => onChange(e.target.checked ? [...seleccion, o.id] : seleccion.filter((x) => x !== o.id))}
            />
            <span className="min-w-0 flex-1 truncate">{o.etiqueta}</span>
            {o.detalle && <span className="shrink-0 text-xs text-muted-foreground">{o.detalle}</span>}
          </label>
        );
      })}
    </div>
  );
}
