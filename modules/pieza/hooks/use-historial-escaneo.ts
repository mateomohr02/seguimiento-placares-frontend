"use client";

import { useCallback, useEffect, useState } from "react";
import type { EscaneoResumen } from "../types/pieza.types";

// Historial de piezas escaneadas en la sesión de login actual. Vive solo en el
// navegador (localStorage), no en la base. Se guarda bajo una clave que incluye la
// identidad de la sesión (`uid:vencimiento`, ver getClaveSesion): un login nuevo
// usa otra clave, así que lo de la sesión anterior se descarta; cerrar sesión y el
// vencimiento de la sesión (12 h) también lo borran.
const PREFIJO = "sp:escaneos:";
const MAX_ITEMS = 100;

export interface EscaneoItem extends EscaneoResumen {
  /** Cuándo se escaneó (ms epoch). */
  en: number;
}

function borrarClaves(excepto?: string) {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(PREFIJO) && k !== excepto) localStorage.removeItem(k);
    }
  } catch {
    // Sin acceso a localStorage (modo privado, etc.): el historial dura solo la pantalla.
  }
}

/** Borra el historial de todas las sesiones (al cerrar sesión). */
export function limpiarHistorialEscaneo() {
  borrarClaves();
}

export function useHistorialEscaneo(clave: string, expiraEn: number) {
  const [items, setItems] = useState<EscaneoItem[]>([]);
  const almacen = PREFIJO + clave;

  // Carga lo de esta sesión y descarta lo de otras. Se difiere un tick para no
  // setear estado dentro del efecto (y para no desfasar la hidratación).
  useEffect(() => {
    const t = setTimeout(() => {
      borrarClaves(almacen);
      try {
        const raw = localStorage.getItem(almacen);
        if (raw) setItems(JSON.parse(raw) as EscaneoItem[]);
      } catch {
        // Dato ilegible: se ignora.
      }
    }, 0);
    return () => clearTimeout(t);
  }, [almacen]);

  // Al vencer la sesión se limpia aunque la pantalla siga abierta (también al
  // volver a la pestaña, por si la tablet estuvo dormida y el timer no corrió).
  useEffect(() => {
    const vencer = () => {
      borrarClaves();
      setItems([]);
    };
    const restante = expiraEn - Date.now();
    const timer = setTimeout(vencer, Math.max(0, restante));
    const alVolver = () => {
      if (document.visibilityState === "visible" && Date.now() >= expiraEn) vencer();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [expiraEn]);

  // Una tarjeta por pieza: re-escanear la misma la sube al principio con el
  // resultado más reciente.
  const registrar = useCallback(
    (resumen: EscaneoResumen) => {
      setItems((prev) => {
        const next = [{ ...resumen, en: Date.now() }, ...prev.filter((i) => i.pieza.id !== resumen.pieza.id)].slice(
          0,
          MAX_ITEMS,
        );
        try {
          localStorage.setItem(almacen, JSON.stringify(next));
        } catch {
          // Sin almacenamiento: queda solo en memoria.
        }
        return next;
      });
    },
    [almacen],
  );

  return { items, registrar };
}
