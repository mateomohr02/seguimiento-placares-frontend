"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Anotacion, NuevaAnotacion } from "../types/anotacion.types";

interface Envelope<T> {
  data?: T;
  message?: string;
}

interface Local {
  tmpId: string;
  nueva: NuevaAnotacion;
}

// Un paso que "Deshacer" puede revertir (solo cambios de esta sesión de edición).
type Paso = { tipo: "crear" | "borrar"; id: string };

const esLocal = (id: string) => id.startsWith("tmp-");

// Estado de las anotaciones de un documento.
//
// Edición con guardado explícito: lo que se anota (y, con permiso, lo que se
// borra de lo ya guardado) queda en un estado LOCAL de esta pantalla y recién se
// envía al servidor al llamar a `guardar()` (botón "Listo"). Hasta entonces:
//  - "Deshacer" revierte, paso a paso, SOLO los cambios de esta sesión;
//  - lo ya guardado solo se puede borrar con permiso (el backend lo vuelve a validar).
// Las anotaciones guardadas por otros dispositivos se refrescan periódicamente.
export function useAnotaciones(base: string, refrescoMs: number) {
  const [guardadas, setGuardadas] = useState<Anotacion[]>([]);
  const [locales, setLocales] = useState<Local[]>([]);
  const [borradas, setBorradas] = useState<string[]>([]); // ids guardados marcados para borrar
  const [pila, setPila] = useState<Paso[]>([]);
  const [guardando, setGuardando] = useState(false);
  const contador = useRef(0);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(base, { cache: "no-store" });
      if (!res.ok) return;
      const { data } = (await res.json()) as Envelope<Anotacion[]>;
      if (data) setGuardadas(data);
    } catch {
      // Sin red: se mantiene lo que hay; el NetworkGuard ya avisa.
    }
  }, [base]);

  useEffect(() => {
    const inicial = setTimeout(() => void cargar(), 0);
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void cargar();
    }, refrescoMs);
    return () => {
      clearTimeout(inicial);
      clearInterval(t);
    };
  }, [cargar, refrescoMs]);

  // Lo que se dibuja: lo guardado (menos lo marcado para borrar) + lo local.
  const anotaciones = useMemo<Anotacion[]>(
    () => [
      ...guardadas.filter((a) => !borradas.includes(a.id)),
      ...locales.map((l) => ({ ...l.nueva, id: l.tmpId, creado_en: "" }) as Anotacion),
    ],
    [guardadas, borradas, locales],
  );

  const crear = useCallback((nueva: NuevaAnotacion) => {
    const tmpId = `tmp-${++contador.current}`;
    setLocales((prev) => [...prev, { tmpId, nueva }]);
    setPila((p) => [...p, { tipo: "crear", id: tmpId }]);
  }, []);

  // Borrar algo local lo descarta; borrar algo ya guardado lo marca (se envía al guardar).
  const borrar = useCallback((id: string) => {
    if (esLocal(id)) {
      setLocales((prev) => prev.filter((l) => l.tmpId !== id));
      setPila((p) => p.filter((s) => s.id !== id));
      return;
    }
    setBorradas((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setPila((p) => [...p, { tipo: "borrar", id }]);
  }, []);

  const deshacer = useCallback(() => {
    const ultimo = pila[pila.length - 1];
    if (!ultimo) return;
    setPila((p) => p.slice(0, -1));
    if (ultimo.tipo === "crear") setLocales((prev) => prev.filter((l) => l.tmpId !== ultimo.id));
    else setBorradas((prev) => prev.filter((x) => x !== ultimo.id));
  }, [pila]);

  const descartar = useCallback(() => {
    setLocales([]);
    setBorradas([]);
    setPila([]);
  }, []);

  // Envía los cambios en orden. Si algo falla, lo que ya se guardó queda guardado
  // y lo que falta sigue en local para reintentar con "Listo".
  const guardar = useCallback(async (): Promise<boolean> => {
    if (guardando) return false;
    setGuardando(true);
    let ok = true;
    try {
      for (const l of locales) {
        const res = await fetch(base, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(l.nueva),
        });
        const body = (await res.json().catch(() => null)) as Envelope<Anotacion> | null;
        if (!res.ok || !body?.data) throw new Error(body?.message ?? "No se pudo guardar la anotación.");
        const real = body.data;
        setGuardadas((prev) => [...prev, real]);
        setLocales((prev) => prev.filter((x) => x.tmpId !== l.tmpId));
        setPila((p) => p.filter((s) => s.id !== l.tmpId));
      }
      for (const id of borradas) {
        const res = await fetch(`${base}/${id}`, { method: "DELETE" });
        // 404 = ya la había borrado otro dispositivo: el resultado es el mismo.
        if (!res.ok && res.status !== 404) {
          const body = (await res.json().catch(() => null)) as Envelope<null> | null;
          throw new Error(body?.message ?? "No se pudo borrar la anotación.");
        }
        setGuardadas((prev) => prev.filter((a) => a.id !== id));
        setBorradas((prev) => prev.filter((x) => x !== id));
        setPila((p) => p.filter((s) => s.id !== id));
      }
    } catch (err) {
      ok = false;
      toast.error("No se guardaron todas las anotaciones", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
    await cargar();
    setGuardando(false);
    return ok;
  }, [base, borradas, cargar, guardando, locales]);

  return {
    anotaciones,
    crear,
    borrar,
    deshacer,
    puedeDeshacer: pila.length > 0,
    hayCambios: locales.length > 0 || borradas.length > 0,
    guardando,
    guardar,
    descartar,
  };
}
