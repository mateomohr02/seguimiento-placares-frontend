"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Anotacion, NuevaAnotacion } from "../types/anotacion.types";

interface Envelope<T> {
  data?: T;
  message?: string;
}

const esTemporal = (id: string) => id.startsWith("tmp-");

// Estado de las anotaciones de una hoja: carga, refresco periódico (para ver lo
// que anotan otros dispositivos), y alta/baja optimistas con reversión si el
// servidor falla. "Deshacer" borra lo último que creó ESTE dispositivo.
export function useAnotaciones(hojaId: string, refrescoMs: number) {
  const base = `/hojas-corte/${hojaId}/anotaciones`;
  const [anotaciones, setAnotaciones] = useState<Anotacion[]>([]);
  const [undo, setUndo] = useState<string[]>([]);
  const borrando = useRef(new Set<string>());
  const contador = useRef(0);

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      try {
        const res = await fetch(base, { cache: "no-store" });
        if (!res.ok) return;
        const { data } = (await res.json()) as Envelope<Anotacion[]>;
        if (cancelado || !data) return;
        setAnotaciones((prev) => [
          ...data.filter((a) => !borrando.current.has(a.id)),
          ...prev.filter((a) => esTemporal(a.id)),
        ]);
      } catch {
        // Sin red: se mantiene lo que hay; el NetworkGuard ya avisa.
      }
    }
    void cargar();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void cargar();
    }, refrescoMs);
    return () => {
      cancelado = true;
      clearInterval(t);
    };
  }, [base, refrescoMs]);

  const crear = useCallback(
    async (nueva: NuevaAnotacion) => {
      const tmpId = `tmp-${++contador.current}`;
      setAnotaciones((prev) => [...prev, { ...nueva, id: tmpId, creado_en: new Date().toISOString() } as Anotacion]);
      try {
        const res = await fetch(base, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nueva),
        });
        const body = (await res.json().catch(() => null)) as Envelope<Anotacion> | null;
        if (!res.ok || !body?.data) throw new Error(body?.message ?? "No se pudo guardar la anotación.");
        const real = body.data;
        setAnotaciones((prev) => prev.map((a) => (a.id === tmpId ? real : a)));
        setUndo((u) => [...u, real.id]);
      } catch (err) {
        setAnotaciones((prev) => prev.filter((a) => a.id !== tmpId));
        toast.error("No se guardó la anotación", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    },
    [base],
  );

  const borrar = useCallback(
    async (id: string) => {
      if (esTemporal(id)) return; // todavía guardándose
      let previa: Anotacion | undefined;
      borrando.current.add(id);
      setAnotaciones((prev) => {
        previa = prev.find((a) => a.id === id);
        return prev.filter((a) => a.id !== id);
      });
      setUndo((u) => u.filter((x) => x !== id));
      try {
        const res = await fetch(`${base}/${id}`, { method: "DELETE" });
        // 404 = ya la había borrado otro dispositivo: el resultado es el mismo.
        if (!res.ok && res.status !== 404) throw new Error();
      } catch {
        if (previa) setAnotaciones((prev) => [...prev, previa!]);
        toast.error("No se pudo borrar la anotación");
      } finally {
        borrando.current.delete(id);
      }
    },
    [base],
  );

  const deshacer = useCallback(() => {
    const ultimo = undo[undo.length - 1];
    if (ultimo) void borrar(ultimo);
  }, [undo, borrar]);

  return { anotaciones, crear, borrar, deshacer, puedeDeshacer: undo.length > 0 };
}
