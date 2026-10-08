"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { EstadoBadge } from "@/components/estado-badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Orden } from "../types/orden.types";
import { OrdenAcciones } from "./orden-acciones";

// Búsqueda en el cliente: el listado es chico (órdenes vigentes) y así filtra
// al tipear, sin ir al backend. Busca por N° de orden (el corto y el de
// fabricación), por número de pedido y por descripción, sin distinguir
// mayúsculas ni acentos.
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function OrdenesTable({
  ordenes,
  archivadas,
  puedeGestionar,
}: {
  ordenes: Orden[];
  archivadas: boolean;
  /** Archivar / eliminar órdenes (permiso ordenes.gestionar). */
  puedeGestionar: boolean;
}) {
  const [query, setQuery] = useState("");

  const filtradas = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return ordenes;
    return ordenes.filter(
      (o) =>
        normalize(`${o.numeroOrdenCustom} ${o.codigoOrdenFabricacion} ${o.descripcion}`).includes(q) ||
        o.codigosPedido.some((c) => normalize(c).includes(q)),
    );
  }, [ordenes, query]);

  // Pedidos que coinciden con la búsqueda (para mostrar por qué apareció la orden).
  const pedidosCoincidentes = (orden: Orden) => {
    const q = normalize(query.trim());
    return q ? orden.codigosPedido.filter((c) => normalize(c).includes(q)) : [];
  };

  if (ordenes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {archivadas
          ? "No hay órdenes archivadas."
          : puedeGestionar
            ? 'No hay órdenes activas. Usá "Agregar orden" para sincronizar una desde TeoWin (o revisá las archivadas).'
            : "No hay órdenes activas (o revisá las archivadas)."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por N° de orden, pedido o descripción..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          enterKeyHint="search"
          onKeyDown={(e) => {
            // En tablet, Enter no cierra el teclado solo (no hay <form>): se quita el foco.
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="pl-8"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>N° orden</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Pedidos</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtradas.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Ninguna orden coincide con &quot;{query}&quot;.
              </TableCell>
            </TableRow>
          )}
          {filtradas.map((orden) => (
            <TableRow key={orden.id}>
              <TableCell className="font-medium">
                <Link href={`/ordenes/${orden.id}`} className="hover:underline">
                  {orden.numeroOrdenCustom}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/ordenes/${orden.id}`} className="hover:underline">
                  {orden.descripcion}
                </Link>
                {pedidosCoincidentes(orden).length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Pedido {pedidosCoincidentes(orden).slice(0, 3).join(", ")}
                    {pedidosCoincidentes(orden).length > 3 &&
                      ` y ${pedidosCoincidentes(orden).length - 3} más`}
                  </p>
                )}
              </TableCell>
              <TableCell>{orden.pedidosCount}</TableCell>
              <TableCell>
                <EstadoBadge estado={orden.estado} />
              </TableCell>
              <TableCell className="text-right">
                {puedeGestionar && <OrdenAcciones orden={orden} archivada={archivadas} />}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
