"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ESTACIONES, ETIQUETA_ESTACION } from "../lib/estaciones";
import type { AccesoUsuario, Estacion } from "../types/planilla.types";

// Qué planillas puede completar cada usuario. Cada casilla se guarda al tocarla.
export function AccesosForm({ inicial }: { inicial: AccesoUsuario[] }) {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState(inicial);
  const [guardando, setGuardando] = useState<string | null>(null);

  async function cambiar(u: AccesoUsuario, estacion: Estacion, marcada: boolean) {
    const estaciones = ESTACIONES.filter((e) => (e === estacion ? marcada : u.estaciones.includes(e)));
    setGuardando(u.id);
    try {
      const res = await fetch(`/planillas-api/accesos/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estaciones }),
      });
      const body = (await res.json().catch(() => null)) as { data?: AccesoUsuario[]; message?: string } | null;
      if (!res.ok || !body?.data) return void toast.error(body?.message ?? "No se pudo guardar el acceso.");
      setUsuarios(body.data);
      toast.success(`Acceso de ${u.nombre} actualizado.`);
      router.refresh();
    } catch {
      toast.error("No se pudo comunicar con el servidor.");
    } finally {
      setGuardando(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-3 font-medium">Usuario</th>
            <th className="p-3 font-medium">Rol</th>
            {ESTACIONES.map((e) => (
              <th key={e} className="p-3 text-center font-medium">
                {ETIQUETA_ESTACION[e]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} className="border-b last:border-0">
              <td className="p-3 font-medium">{u.nombre}</td>
              <td className="p-3 text-muted-foreground">{u.rol}</td>
              {ESTACIONES.map((e) => (
                <td key={e} className="p-3 text-center">
                  <input
                    type="checkbox"
                    className="size-6 accent-(--primary)"
                    checked={u.estaciones.includes(e)}
                    disabled={guardando === u.id}
                    onChange={(ev) => void cambiar(u, e, ev.target.checked)}
                    aria-label={`${u.nombre}: planilla de ${ETIQUETA_ESTACION[e]}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
