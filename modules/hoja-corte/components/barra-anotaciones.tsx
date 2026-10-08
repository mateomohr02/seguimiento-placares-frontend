"use client";

import { EraserIcon, HandIcon, HighlighterIcon, PencilIcon, TypeIcon, Undo2Icon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import type { Herramienta } from "../types/anotacion.types";

export const PALETA_LAPIZ = ["#d92b2b", "#1d4ed8", "#1a1a1a", "#15803d"];
export const PALETA_RESALTADOR = ["#facc15", "#4ade80", "#f472b6", "#fb923c"];

const HERRAMIENTAS: { id: Herramienta; label: string; icon: React.ReactNode }[] = [
  { id: "mover", label: "Mover", icon: <HandIcon /> },
  { id: "lapiz", label: "Lápiz", icon: <PencilIcon /> },
  { id: "resaltador", label: "Resaltador", icon: <HighlighterIcon /> },
  { id: "texto", label: "Texto", icon: <TypeIcon /> },
  { id: "borrador", label: "Borrar", icon: <EraserIcon /> },
];

export const paletaDe = (h: Herramienta) => (h === "resaltador" ? PALETA_RESALTADOR : PALETA_LAPIZ);

export function BarraAnotaciones({
  herramienta,
  onHerramienta,
  color,
  onColor,
  nivel,
  onNivel,
  puedeDeshacer,
  onDeshacer,
  puedeEliminar,
}: {
  herramienta: Herramienta;
  onHerramienta: (h: Herramienta) => void;
  color: string;
  onColor: (c: string) => void;
  nivel: number;
  onNivel: (n: number) => void;
  puedeDeshacer: boolean;
  onDeshacer: () => void;
  /** Sin permiso de eliminar anotaciones no hay Borrar ni Deshacer. */
  puedeEliminar: boolean;
}) {
  const usaColor = herramienta === "lapiz" || herramienta === "resaltador" || herramienta === "texto";

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-background px-3 py-2">
      <div className="flex items-center gap-1" role="toolbar" aria-label="Herramientas">
        {HERRAMIENTAS.filter((h) => puedeEliminar || h.id !== "borrador").map((h) => (
          <Button
            key={h.id}
            variant={herramienta === h.id ? "default" : "outline"}
            className="h-11 px-3"
            aria-pressed={herramienta === h.id}
            onClick={() => onHerramienta(h.id)}
          >
            {h.icon}
            <span className="hidden sm:inline">{h.label}</span>
          </Button>
        ))}
      </div>

      {usaColor && (
        <>
          <div className="flex items-center gap-2" role="radiogroup" aria-label="Color">
            {paletaDe(herramienta).map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={`Color ${c}`}
                onClick={() => onColor(c)}
                className={cn(
                  "size-9 rounded-full border-2 border-white shadow ring-1 ring-black/30",
                  color === c && "ring-2 ring-primary ring-offset-2",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Grosor">
            {(herramienta === "texto" ? ["Chico", "Medio", "Grande"] : ["Fino", "Medio", "Grueso"]).map((l, i) => (
              <Button
                key={l}
                variant={nivel === i ? "default" : "outline"}
                className="h-11 px-3"
                role="radio"
                aria-checked={nivel === i}
                onClick={() => onNivel(i)}
              >
                {l}
              </Button>
            ))}
          </div>
        </>
      )}

      {puedeEliminar && (
        <Button variant="outline" className="ml-auto h-11 px-3" disabled={!puedeDeshacer} onClick={onDeshacer}>
          <Undo2Icon /> Deshacer
        </Button>
      )}
    </div>
  );
}
