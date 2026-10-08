"use client";

import Link from "next/link";
import { cn } from "cn";
import { ChevronRightIcon } from "lucide-react";
import type { EscaneoItem } from "../hooks/use-historial-escaneo";

// Una tarjeta por pieza escaneada en esta sesión (la más reciente arriba). Es un
// link: lleva al despiece del módulo y ubica la pieza (?pieza=<id>).
// Verde = la pieza era nueva; amarillo = ya estaba escaneada (último escaneo).
function Tarjeta({ item }: { item: EscaneoItem }) {
  const nombre = item.pieza.descripcion ?? `${item.pieza.familia} / ${item.pieza.articulo}`;
  return (
    <Link
      href={`/modulos/${item.modulo.id}?pieza=${item.pieza.id}`}
      className={cn(
        "flex items-center gap-2 rounded-xl p-3 text-left shadow-sm transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        item.yaEscaneada ? "bg-yellow-300 text-yellow-950" : "bg-green-600 text-white",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold">
          {item.yaEscaneada ? "Pieza ya escaneada anteriormente" : "Pieza registrada"}
        </p>
        <p className="text-xs opacity-80">
          Orden {item.orden.numeroOrdenCustom} · Pedido {item.pedido.codigo_pedido}
        </p>
        <p className="text-sm font-semibold">
          {nombre} para el módulo {item.modulo.descripcion} ({item.modulo.idEscena})
        </p>
        <p className="text-xs">
          {item.pieza.medida1} × {item.pieza.medida2} · {item.pieza.color} · idUnico {item.pieza.idUnico}
        </p>
      </div>
      <ChevronRightIcon className="size-5 shrink-0 opacity-70" aria-hidden />
    </Link>
  );
}

export function HistorialEscaneo({ items }: { items: EscaneoItem[] }) {
  return (
    <div className="flex h-full flex-col">
      <h2 className="border-b px-4 py-3 text-sm font-semibold">
        Escaneadas en esta sesión{items.length > 0 && ` (${items.length})`}
      </h2>
      {items.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          Todavía no escaneaste ninguna pieza. Apuntá la cámara a la etiqueta.
        </p>
      ) : (
        <ul className="flex flex-1 flex-col gap-2 overflow-y-auto p-3" aria-live="polite">
          {items.map((item) => (
            <li key={item.pieza.id}>
              <Tarjeta item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
