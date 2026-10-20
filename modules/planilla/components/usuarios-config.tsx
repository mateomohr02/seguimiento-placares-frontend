"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ESTACIONES, ETIQUETA_ESTACION } from "../lib/estaciones";
import type { AccesoUsuario, Estacion, EstadoProduccion } from "../types/planilla.types";

// Configuración de cada usuario de fábrica (técnica): qué planillas completa, qué estado de producción marca en la
// planificación y qué operarios trabajan en su estación. Cada cambio se guarda al instante.
function UsuarioCard({ usuario, estados, onGuardado }: { usuario: AccesoUsuario; estados: EstadoProduccion[]; onGuardado: (u: AccesoUsuario[]) => void }) {
  const router = useRouter();
  const [nuevo, setNuevo] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar(cambio: Partial<Pick<AccesoUsuario, "estaciones" | "estado_id" | "operarios">>) {
    const cfg = { estaciones: usuario.estaciones, estado_id: usuario.estado_id, operarios: usuario.operarios, ...cambio };
    setGuardando(true);
    try {
      const res = await fetch(`/planillas-api/accesos/${usuario.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const body = (await res.json().catch(() => null)) as { data?: AccesoUsuario[]; message?: string } | null;
      if (!res.ok || !body?.data) return void toast.error(body?.message ?? "No se pudo guardar.");
      onGuardado(body.data);
      toast.success(`${usuario.nombre}: guardado.`);
      router.refresh();
    } catch {
      toast.error("No se pudo comunicar con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  function agregarOperario(e: React.FormEvent) {
    e.preventDefault();
    const n = nuevo.trim();
    if (!n) return;
    setNuevo("");
    void guardar({ operarios: [...usuario.operarios, n] });
  }

  const alternar = (e: Estacion, marcada: boolean) => guardar({ estaciones: ESTACIONES.filter((x) => (x === e ? marcada : usuario.estaciones.includes(x))) });

  return (
    <li className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-baseline gap-2">
        <h3 className="text-base font-semibold">{usuario.nombre}</h3>
        <span className="text-sm text-muted-foreground">{usuario.rol}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Estado de producción</span>
          <select
            value={usuario.estado_id ?? ""}
            disabled={guardando}
            onChange={(e) => void guardar({ estado_id: e.target.value || null })}
            className="h-11 rounded-lg border border-input bg-background px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          >
            <option value="">Ninguno</option>
            {estados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="font-medium">Planillas que completa</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
            {ESTACIONES.map((e) => (
              <label key={e} className="flex min-h-9 items-center gap-2">
                <input
                  type="checkbox"
                  className="size-5 accent-(--primary)"
                  checked={usuario.estaciones.includes(e)}
                  disabled={guardando}
                  onChange={(ev) => void alternar(e, ev.target.checked)}
                />
                {ETIQUETA_ESTACION[e]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Operarios de su estación</span>
          <ul className="flex flex-wrap gap-1.5">
            {usuario.operarios.map((o) => (
              <li key={o} className="inline-flex items-center gap-1 rounded-full border bg-background py-1 pr-1 pl-3">
                {o}
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => void guardar({ operarios: usuario.operarios.filter((x) => x !== o) })}
                  aria-label={`Quitar a ${o}`}
                  className="inline-flex size-6 items-center justify-center rounded-full hover:bg-muted"
                >
                  <XIcon className="size-3.5" />
                </button>
              </li>
            ))}
            {usuario.operarios.length === 0 && <li className="text-muted-foreground">Ninguno</li>}
          </ul>
          <form onSubmit={agregarOperario} className="flex gap-1.5">
            <Input
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
              placeholder="Agregar operario"
              maxLength={60}
              autoComplete="off"
              className="h-10"
              aria-label={`Agregar operario a ${usuario.nombre}`}
            />
            <Button type="submit" variant="outline" className="h-10 px-3" disabled={guardando || !nuevo.trim()} aria-label="Agregar operario">
              <PlusIcon />
            </Button>
          </form>
        </div>
      </div>
    </li>
  );
}

export function UsuariosConfig({ inicial, estados }: { inicial: AccesoUsuario[]; estados: EstadoProduccion[] }) {
  const [usuarios, setUsuarios] = useState(inicial);
  return (
    <ul className="flex flex-col gap-3">
      {usuarios.map((u) => (
        <UsuarioCard key={u.id} usuario={u} estados={estados} onGuardado={setUsuarios} />
      ))}
    </ul>
  );
}
