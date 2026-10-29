"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { fechaCorta } from "@/modules/planilla/lib/estaciones";
import type { PlantillaPlanificacion, ResultadoBusqueda } from "../types/planificacion.types";

const NOMBRES_DIA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const diaIdx = (iso: string) => (new Date(`${iso}T00:00:00Z`).getUTCDay() + 6) % 7;

// Buscador por N° TW dentro de la planificación elegida: al elegir un resultado navega a su semana y resalta la fila.
// Con el campo vacío no hace nada.
export function BuscadorPedido({ plantilla }: { plantilla: PlantillaPlanificacion }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusqueda[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const texto = q.trim();
    if (!texto) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/planificacion-api/buscar?plantilla=${encodeURIComponent(plantilla)}&q=${encodeURIComponent(texto)}`, { signal: ctl.signal });
        const json = (await res.json().catch(() => null)) as { data?: ResultadoBusqueda[]; message?: string } | null;
        if (!res.ok) {
          setError(json?.message ?? "No se pudo buscar.");
          setResultados([]);
          return;
        }
        setError(null);
        setResultados(json?.data ?? []);
      } catch {
        /* cancelado o sin red: el próximo tipeo reintenta */
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q, plantilla]);

  useEffect(() => {
    function fuera(e: PointerEvent) {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, []);

  function ir(r: ResultadoBusqueda) {
    setAbierto(false);
    setQ("");
    setResultados(null);
    router.push(`/planificacion?plantilla=${encodeURIComponent(plantilla)}&semana=${r.semana_inicio}&item=${r.item_id}`);
  }

  const hay = q.trim() !== "";
  return (
    <div ref={caja} className="relative w-full sm:max-w-sm">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        role="combobox"
        aria-expanded={abierto && hay}
        aria-controls="resultados-busqueda-pedido"
        aria-label="Buscar un N° TW en la planificación"
        placeholder="Buscar por N° TW…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setAbierto(true);
          if (!e.target.value.trim()) setResultados(null);
        }}
        onFocus={() => setAbierto(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setAbierto(false);
          if (e.key === "Enter") {
            e.preventDefault();
            if (resultados && resultados.length > 0) ir(resultados[0]);
          }
        }}
        autoComplete="off"
        enterKeyHint="search"
        className="h-11 pl-9"
      />
      {abierto && hay && (
        <ul id="resultados-busqueda-pedido" role="listbox" className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-lg border bg-popover p-1 shadow-lg">
          {error && <li className="px-3 py-2 text-sm text-destructive">{error}</li>}
          {!error && resultados === null && <li className="px-3 py-2 text-sm text-muted-foreground">Buscando…</li>}
          {!error && resultados !== null && resultados.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">Ningún N° TW de esta planificación coincide.</li>}
          {resultados?.map((r) => (
            <li key={r.item_id} role="option" aria-selected={false}>
              <button type="button" onClick={() => ir(r)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted">
                <span className="min-w-0">
                  <span className="font-medium">{r.n_tw}</span>
                  {r.cliente && <span className="ml-2 truncate text-xs text-muted-foreground">{r.cliente}</span>}
                  {r.sin_pedido && <span className="ml-2 text-xs text-amber-700 dark:text-amber-400">sin pedido</span>}
                </span>
                <span className="text-xs text-muted-foreground">
                  {r.dia ? `${NOMBRES_DIA[diaIdx(r.dia)]} ${fechaCorta(r.dia)} · ` : ""}semana del {fechaCorta(r.semana_inicio)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
