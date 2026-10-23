"use client";

import { useCallback, useEffect, useRef } from "react";
import type { DragEvent, MouseEvent, PointerEvent } from "react";

const DELAY_POR_DEFECTO = 500;
const TOLERANCIA_PX = 12;

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
  // Tipo del último puntero ("touch", "pen" o "mouse"): el menú contextual del navegador solo cuenta como long-press en touch/lápiz.
  const tipoPuntero = useRef<string>("mouse");
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
      tipoPuntero.current = e.pointerType;
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
    // Evita el menú contextual (touch largo / clic derecho) sobre el elemento. En touch/lápiz, el navegador lo dispara
    // cuando detecta el long-press (el dedo se quedó quieto): sirve de respaldo si ya canceló el puntero (pointercancel
    // al iniciar un arrastre de enlace o la selección) y el temporizador no llegó a disparar.
    onContextMenu: (e: MouseEvent) => {
      e.preventDefault();
      if (tipoPuntero.current !== "mouse" && !disparado.current) {
        cancelar();
        disparado.current = true;
        callback.current();
      }
    },
    // Los enlaces y la fila no se arrastran: en touch, el arrastre de un enlace cancela el long-press.
    onDragStart: (e: DragEvent) => e.preventDefault(),
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
export const CLASES_SIN_SELECCION = "select-none [-webkit-touch-callout:none] [-webkit-user-drag:none] [&_a]:[-webkit-user-drag:none] [&_a]:[-webkit-touch-callout:none]";
