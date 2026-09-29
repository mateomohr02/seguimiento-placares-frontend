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
import type { Pedido } from "../types/pedido.types";
import { MarcarPedidoFinalizadoButton } from "./marcar-pedido-finalizado-button";

export function PedidosTable({ pedidos, ordenId }: { pedidos: Pedido[]; ordenId: string }) {
  if (pedidos.length === 0) {
    return <p className="text-sm text-muted-foreground">Esta orden no tiene pedidos sincronizados.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>N° pedido</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Módulos</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {pedidos.map((pedido) => (
          <TableRow key={pedido.id}>
            <TableCell className="font-medium">
              <Link href={`/pedidos/${pedido.id}`} className="hover:underline">
                {pedido.codigo_pedido}
              </Link>
            </TableCell>
            <TableCell>
              <Link href={`/pedidos/${pedido.id}`} className="hover:underline">
                {pedido.referencia}
              </Link>
            </TableCell>
            <TableCell>{pedido.modulosCount}</TableCell>
            <TableCell>
              <EstadoBadge estado={pedido.estado} />
            </TableCell>
            <TableCell className="text-right">
              <MarcarPedidoFinalizadoButton
                pedidoId={pedido.id}
                ordenId={ordenId}
                disabled={pedido.estado === "FINALIZADO"}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
