"use client";

import { useState } from "react";
import { PlusIcon, StickyNoteIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AnotacionNota } from "../types/anotacion.types";

// Notas que aplican a toda la hoja (ej. "Págs. 77 a 80: MDF, bajan aparte").
// Se muestran siempre, arriba, para que el operario no las pase por alto.
export function NotasDocumento({
  notas,
  edicion,
  puedeBorrar,
  onCrear,
  onBorrar,
}: {
  notas: AnotacionNota[];
  edicion: boolean;
  /** Borrar notas (permiso documentacion.anotaciones.eliminar). */
  puedeBorrar: boolean;
  onCrear: (texto: string) => void;
  onBorrar: (id: string) => void;
}) {
  const [texto, setTexto] = useState("");
  if (notas.length === 0 && !edicion) return null;

  function agregar() {
    const t = texto.trim();
    if (!t) return;
    onCrear(t);
    setTexto("");
  }

  return (
    <div className="flex flex-col gap-2 border-b bg-amber-50 px-3 py-2 text-amber-950">
      {notas.length > 0 && (
        <ul className="flex flex-col gap-1">
          {notas.map((n) => (
            <li key={n.id} className="flex items-start gap-2">
              <StickyNoteIcon className="mt-1 size-4 shrink-0" />
              <span className="min-w-0 flex-1 break-words font-medium">{n.datos.texto}</span>
              {edicion && puedeBorrar && (
                <button
                  type="button"
                  aria-label="Borrar nota"
                  className="rounded p-1 hover:bg-amber-100"
                  onClick={() => onBorrar(n.id)}
                >
                  <XIcon className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {edicion && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            agregar();
          }}
        >
          <Input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Nota para todo el documento…"
            maxLength={500}
            enterKeyHint="done"
            className="h-11 bg-white"
          />
          <Button type="submit" className="h-11 px-3" disabled={!texto.trim()}>
            <PlusIcon /> Agregar nota
          </Button>
        </form>
      )}
    </div>
  );
}
