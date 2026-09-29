import Link from "next/link";
import { EstadoBadge } from "@/components/estado-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Orden } from "../types/orden.types";

export function OrdenesTable({ ordenes }: { ordenes: Orden[] }) {
  if (ordenes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no se agregó ninguna orden. Usá &quot;Agregar orden&quot; para sincronizar una desde
        TeoWin.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>N° orden</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Pedidos</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordenes.map((orden) => (
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
