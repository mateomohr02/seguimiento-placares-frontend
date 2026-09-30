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
import { ArchivarOrdenButton } from "./archivar-orden-button";

// Búsqueda en el cliente: el listado es chico (órdenes vigentes) y así filtra
// al tipear, sin ir al backend. Busca por N° de orden (el corto y el de
// fabricación) y por descripción, sin distinguir mayúsculas ni acentos.
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function OrdenesTable({ ordenes, archivadas }: { ordenes: Orden[]; archivadas: boolean }) {
  const [query, setQuery] = useState("");

  const filtradas = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return ordenes;
    return ordenes.filter((o) =>
      normalize(`${o.numeroOrdenCustom} ${o.codigoOrdenFabricacion} ${o.descripcion}`).includes(q),
    );
  }, [ordenes, query]);

  if (ordenes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {archivadas
          ? "No hay órdenes archivadas."
          : 'No hay órdenes activas. Usá "Agregar orden" para sincronizar una desde TeoWin (o revisá las archivadas).'}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por N° de orden o descripción..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
              </TableCell>
              <TableCell>{orden.pedidosCount}</TableCell>
              <TableCell>
                <EstadoBadge estado={orden.estado} />
              </TableCell>
              <TableCell className="text-right">
                <ArchivarOrdenButton ordenId={orden.id} archivada={archivadas} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
