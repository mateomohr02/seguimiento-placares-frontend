import { EstadoBadge } from "@/components/estado-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Pieza } from "../types/pieza.types";
import { ConfirmarPiezaButton } from "./confirmar-pieza-button";

export function PiezasTable({ piezas }: { piezas: Pieza[] }) {
  if (piezas.length === 0) {
    return <p className="text-sm text-muted-foreground">Este módulo no tiene piezas sincronizadas.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Artículo</TableHead>
          <TableHead>Color</TableHead>
          <TableHead>Medidas</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {piezas.map((pieza) => (
          <TableRow key={pieza.id}>
            <TableCell className="font-medium">{pieza.idUnico ?? "—"}</TableCell>
            <TableCell>
              {/* TeoWin no tiene descripción cargada para todos los códigos de
                  artículo — si falta, se muestra familia/artículo en crudo. */}
              {pieza.descripcion ?? `${pieza.familia} / ${pieza.articulo}`}
            </TableCell>
            <TableCell>{pieza.color}</TableCell>
            <TableCell>
              {pieza.medida1} × {pieza.medida2}
            </TableCell>
            <TableCell>
              <EstadoBadge estado={pieza.estado} />
            </TableCell>
            <TableCell className="text-right">
              <ConfirmarPiezaButton piezaId={pieza.id} disabled={pieza.estado === "CORTADA"} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
