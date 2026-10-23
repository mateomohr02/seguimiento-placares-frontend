"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";

const DELAY_POR_DEFECTO = 500;
const TOLERANCIA_PX = 10;

/**
 * Long-press con mouse y touch (pointer events). Se cancela si se suelta antes o si el puntero se mueve más de
 * ~10 px (scroll). Si el long-press dispara `onLongPress`, el clic que sigue al soltar se descarta (así un toque
 * corto navega y uno largo no). Devuelve props para esparcir sobre el elemento; no bloquea el scroll vertical
 * (no usa touch-action). Combinar con `CLASES_SIN_SELECCION` para evitar selección/callout en touch.
 */
export function useLongPress(onLongPress: () => void, { delay = DELAY_POR_DEFECTO }: { delay?: number } = {}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origen = useRef<{ x: number; y: number } | null>(null);
  const disparado = useRef(false);
  const callback = useRef(onLongPress);
  useEffect(() => {
    callback.current = onLongPress;
  });

  const cancelar = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    origen.current = null;
  }, []);
  useEffect(() => cancelar, [cancelar]);

  return {
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      disparado.current = false;
      cancelar();
      origen.current = { x: e.clientX, y: e.clientY };
      timer.current = setTimeout(() => {
        timer.current = null;
        disparado.current = true;
        callback.current();
      }, delay);
    },
    onPointerMove: (e: PointerEvent) => {
      const o = origen.current;
      if (o && Math.hypot(e.clientX - o.x, e.clientY - o.y) > TOLERANCIA_PX) cancelar();
    },
    onPointerUp: cancelar,
    onPointerCancel: cancelar,
    onPointerLeave: cancelar,
    // Evita el menú contextual (touch largo / clic derecho) sobre el elemento.
    onContextMenu: (e: MouseEvent) => e.preventDefault(),
    // Si el long-press ya abrió algo, el clic de la suelta no debe navegar.
    onClickCapture: (e: MouseEvent) => {
      if (disparado.current) {
        disparado.current = false;
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };
}

/** Clases para que un long-press en touch no seleccione texto ni muestre el callout del navegador. */
export const CLASES_SIN_SELECCION = "select-none [-webkit-touch-callout:none]";
