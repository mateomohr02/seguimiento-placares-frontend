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
import type { Modulo } from "../types/modulo.types";

export function ModulosTable({ modulos }: { modulos: Modulo[] }) {
  if (modulos.length === 0) {
    return <p className="text-sm text-muted-foreground">Este pedido no tiene módulos sincronizados.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Descripción</TableHead>
          <TableHead>Piezas</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {modulos.map((modulo) => (
          <TableRow key={modulo.id}>
            <TableCell className="font-medium">
              <Link href={`/modulos/${modulo.id}`} className="hover:underline">
                {modulo.idEscena}
              </Link>
            </TableCell>
            <TableCell>
              <Link href={`/modulos/${modulo.id}`} className="hover:underline">
                {modulo.descripcion}
              </Link>
            </TableCell>
            <TableCell>{modulo.despieceTiposCount}</TableCell>
            <TableCell>
              <EstadoBadge estado={modulo.estado} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
