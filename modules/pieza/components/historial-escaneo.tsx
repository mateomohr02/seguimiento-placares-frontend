"use client";

import Link from "next/link";
import { cn } from "cn";
import { CheckCircle2Icon, ChevronRightIcon, RotateCcwIcon } from "lucide-react";
import type { EscaneoItem } from "../hooks/use-historial-escaneo";

// Estilo "vidrio" (liquid glass): fondo translúcido con desenfoque de lo que hay
// detrás (la cámara), borde claro, reflejo superior y un leve tinte de color:
// verde = pieza nueva, amarillo = ya estaba escaneada.
const VIDRIO = {
  nueva: {
    tarjeta:
      "border-emerald-200/45 bg-gradient-to-br from-emerald-300/35 via-emerald-500/20 to-emerald-700/30 hover:from-emerald-300/45",
    icono: "bg-emerald-300/30 text-emerald-50 ring-emerald-100/50",
  },
  repetida: {
    tarjeta:
      "border-amber-100/55 bg-gradient-to-br from-yellow-200/40 via-amber-300/20 to-amber-500/30 hover:from-yellow-200/50",
    icono: "bg-yellow-200/35 text-yellow-50 ring-yellow-100/60",
  },
} as const;

// Una tarjeta por pieza escaneada en esta sesión (la más reciente arriba). Es un
// link: lleva al despiece del módulo y ubica la pieza (?pieza=<id>).
function Tarjeta({ item }: { item: EscaneoItem }) {
  const nombre = item.pieza.descripcion ?? `${item.pieza.familia} / ${item.pieza.articulo}`;
  const v = item.yaEscaneada ? VIDRIO.repetida : VIDRIO.nueva;
  const Icono = item.yaEscaneada ? RotateCcwIcon : CheckCircle2Icon;
  return (
    <Link
      href={`/modulos/${item.modulo.id}?pieza=${item.pieza.id}`}
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-3 text-left text-white backdrop-blur-xl backdrop-saturate-150 transition",
        "shadow-[0_8px_24px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(255,255,255,0.08)]",
        "[text-shadow:0_1px_2px_rgba(0,0,0,0.55)] hover:-translate-y-px hover:shadow-[0_12px_28px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.55)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        v.tarjeta,
      )}
    >
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full ring-1 backdrop-blur", v.icono)}>
        <Icono className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold tracking-wide uppercase opacity-95">
          {item.yaEscaneada ? "Ya escaneada" : "Pieza registrada"}
        </p>
        <p className="text-xs opacity-85">
          Orden {item.orden.numeroOrdenCustom} · Pedido {item.pedido.codigo_pedido}
        </p>
        <p className="text-sm leading-snug font-semibold">
          {nombre} para el módulo {item.modulo.descripcion} ({item.modulo.idEscena})
        </p>
        <p className="text-xs opacity-90">
          {item.pieza.medida1} × {item.pieza.medida2} · {item.pieza.color} · idUnico {item.pieza.idUnico}
        </p>
      </div>
      <ChevronRightIcon className="size-5 shrink-0 opacity-75" aria-hidden />
    </Link>
  );
}

// Flota sobre la cámara: el contenedor deja pasar los toques (pointer-events-none)
// y solo el título y las tarjetas los reciben.
export function HistorialEscaneo({ items }: { items: EscaneoItem[] }) {
  return (
    <div className="pointer-events-none flex h-full flex-col gap-3 p-3 pt-4">
      <h2
        className={cn(
          "pointer-events-auto self-start rounded-full border border-white/30 bg-black/25 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-xl",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] [text-shadow:0_1px_2px_rgba(0,0,0,0.5)] max-md:mr-9",
        )}
      >
        Escaneadas en esta sesión{items.length > 0 && ` (${items.length})`}
      </h2>
      {items.length === 0 ? (
        <p className="pointer-events-auto rounded-2xl border border-white/25 bg-black/25 p-4 text-sm text-white backdrop-blur-xl [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
          Todavía no escaneaste ninguna pieza. Apuntá la cámara a la etiqueta.
        </p>
      ) : (
        <ul className="pointer-events-auto -mr-1 flex min-h-0 flex-1 flex-col gap-2.5 overflow-x-hidden overflow-y-auto overscroll-contain pr-1 pb-2 [scrollbar-color:rgba(255,255,255,0.45)_transparent] [scrollbar-width:thin]" aria-live="polite">
          {items.map((item) => (
            <li key={item.pieza.id} className="animate-in fade-in slide-in-from-right-4 duration-300">
              <Tarjeta item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
