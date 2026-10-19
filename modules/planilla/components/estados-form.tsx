"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/loading-dots";
import { COLOR_ESTADO_DEFECTO, PALETA_ESTADOS } from "@/modules/planificacion/lib/colores";
import type { EstadoProduccion } from "../types/planilla.types";

interface Fila {
  id?: string;
  nombre: string;
  color: string | null;
  usuarios: number;
  marcas: number;
}

// Catálogo de estados de producción (ej. "Listo Termolaminado"). Se asignan a cada usuario más abajo; un estado
// puede tener varios usuarios. No se puede quitar uno que ya está asignado o que ya se marcó en la planificación.
export function EstadosForm({ inicial }: { inicial: EstadoProduccion[] }) {
  const router = useRouter();
  const [filas, setFilas] = useState<Fila[]>(inicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const res = await fetch("/planillas-api/estados", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estados: filas.filter((f) => f.nombre.trim()).map((f) => ({ id: f.id, nombre: f.nombre, color: f.color })) }),
      });
      const body = (await res.json().catch(() => null)) as { data?: EstadoProduccion[]; message?: string } | null;
      if (!res.ok || !body?.data) return setError(body?.message ?? "No se pudo guardar.");
      setFilas(body.data);
      toast.success("Estados guardados.");
      router.refresh();
    } catch {
      setError("No se pudo comunicar con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {filas.map((f, i) => (
          <li key={f.id ?? `n${i}`} className="flex flex-wrap items-center gap-2">
            <Input
              value={f.nombre}
              onChange={(e) => setFilas((p) => p.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)))}
              placeholder="Ej. Listo Termolaminado"
              maxLength={60}
              autoComplete="off"
              className="h-11 max-w-sm"
              aria-label={`Estado ${i + 1}`}
            />
            <div className="flex items-center gap-1" role="group" aria-label={`Color del estado ${i + 1}`}>
              {PALETA_ESTADOS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilas((p) => p.map((x, j) => (j === i ? { ...x, color: c } : x)))}
                  aria-label={`Color ${c}`}
                  aria-pressed={f.color === c}
                  className={`size-7 rounded-full border-2 transition ${f.color === c ? "scale-110 border-foreground" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={f.color ?? COLOR_ESTADO_DEFECTO}
                onChange={(e) => setFilas((p) => p.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))}
                aria-label="Otro color"
                title="Otro color"
                className="size-8 cursor-pointer rounded border bg-transparent p-0.5"
              />
            </div>
            {f.id && (
              <span className="text-xs text-muted-foreground">
                {f.usuarios} usuario{f.usuarios === 1 ? "" : "s"} · {f.marcas} marca{f.marcas === 1 ? "" : "s"}
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              className="h-11"
              onClick={() => setFilas((p) => p.filter((_, j) => j !== i))}
              aria-label={`Quitar estado ${i + 1}`}
            >
              <Trash2Icon />
            </Button>
          </li>
        ))}
        {filas.length === 0 && <li className="text-sm text-muted-foreground">Todavía no hay estados de producción.</li>}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" className="h-11 px-4" onClick={() => setFilas((p) => [...p, { nombre: "", color: PALETA_ESTADOS[filas.length % PALETA_ESTADOS.length], usuarios: 0, marcas: 0 }])}>
          <PlusIcon /> Agregar estado
        </Button>
        <Button type="submit" className="h-11 px-5" disabled={guardando}>
          {guardando ? <LoadingDots /> : <SaveIcon />} Guardar estados
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
