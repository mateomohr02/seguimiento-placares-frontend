"use client";

import { useMemo, useState } from "react";
import { ColumnFilter } from "@/components/column-filter";
import { EstadoBadge, ESTADO_LABEL } from "@/components/estado-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Pieza } from "../types/pieza.types";
import { PiezaAcciones } from "./pieza-acciones";

// Columnas filtrables (Código y la acción quedan fuera a propósito).
const FILTERS = {
  familia: { label: "Familia", value: (p: Pieza) => p.familia },
  articulo: { label: "Artículo", value: (p: Pieza) => p.articulo },
  descripcion: { label: "Descripción", value: (p: Pieza) => p.descripcion ?? "—" },
  color: { label: "Color", value: (p: Pieza) => p.color },
  medidas: { label: "Medidas", value: (p: Pieza) => `${p.medida1} × ${p.medida2}` },
  estado: { label: "Estado", value: (p: Pieza) => ESTADO_LABEL[p.estado] ?? p.estado },
} as const;

type FilterKey = keyof typeof FILTERS;
type Selection = Partial<Record<FilterKey, Set<string> | null>>;

const KEYS = Object.keys(FILTERS) as FilterKey[];

function passes(pieza: Pieza, selection: Selection, skip?: FilterKey) {
  return KEYS.every((key) => {
    const sel = selection[key];
    return key === skip || !sel || sel.has(FILTERS[key].value(pieza));
  });
}

export function PiezasTable({ piezas }: { piezas: Pieza[] }) {
  const [selection, setSelection] = useState<Selection>({});

  const rows = useMemo(() => piezas.filter((p) => passes(p, selection)), [piezas, selection]);

  // Filtros dinámicos: las opciones de cada columna salen de las filas que
  // cumplen los demás filtros (como Excel), así se combinan sin dar 0 resultados.
  const options = useMemo(() => {
    const result = {} as Record<FilterKey, string[]>;
    for (const key of KEYS) {
      const values = new Set(
        piezas.filter((p) => passes(p, selection, key)).map(FILTERS[key].value),
      );
      // Valores ya seleccionados siguen visibles aunque otro filtro los oculte.
      selection[key]?.forEach((v) => values.add(v));
      result[key] = [...values].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
    }
    return result;
  }, [piezas, selection]);

  const activeCount = KEYS.filter((k) => selection[k]).length;

  if (piezas.length === 0) {
    return <p className="text-sm text-muted-foreground">Este módulo no tiene piezas sincronizadas.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-8 items-center justify-between text-sm text-muted-foreground">
        <span>
          {rows.length === piezas.length
            ? `${piezas.length} piezas`
            : `${rows.length} de ${piezas.length} piezas`}
        </span>
        {activeCount > 0 && (
          <Button size="sm" variant="ghost" onClick={() => setSelection({})}>
            Limpiar {activeCount === 1 ? "filtro" : `${activeCount} filtros`}
          </Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            {KEYS.map((key) => (
              <TableHead key={key}>
                <div className="flex items-center gap-1">
                  {FILTERS[key].label}
                  <ColumnFilter
                    label={FILTERS[key].label}
                    options={options[key]}
                    selected={selection[key] ?? null}
                    onChange={(next) => setSelection((s) => ({ ...s, [key]: next }))}
                  />
                </div>
              </TableHead>
            ))}
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={KEYS.length + 2} className="text-center text-muted-foreground">
                Ninguna pieza coincide con los filtros.
              </TableCell>
            </TableRow>
          )}
          {rows.map((pieza) => (
            <TableRow key={pieza.id}>
              <TableCell className="font-medium">{pieza.idUnico ?? "—"}</TableCell>
              <TableCell>{pieza.familia}</TableCell>
              <TableCell>{pieza.articulo}</TableCell>
              <TableCell>{pieza.descripcion ?? "—"}</TableCell>
              <TableCell>{pieza.color}</TableCell>
              <TableCell>
                {pieza.medida1} × {pieza.medida2}
              </TableCell>
              <TableCell>
                <EstadoBadge estado={pieza.estado} />
              </TableCell>
              <TableCell className="text-right">
                <PiezaAcciones pieza={pieza} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
