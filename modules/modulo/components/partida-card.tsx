import { cn } from "cn";
import { formatoMedida, formatoMonto } from "@/lib/numeros";
import type { Partida } from "../types/modulo.types";

function Dato({ etiqueta, children, className }: { etiqueta: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="font-medium tabular-nums">{children}</dd>
    </div>
  );
}

/**
 * Partida de TeoWin de un módulo (capítulo, referencia, descripción, medidas, unidades, variantes y, solo si
 * el backend los entrega, precio y total). Compartida por el popup del pedido y el encabezado del módulo.
 * `descripcionClassName` permite al contenedor (PartidaEncabezado) ocultar la descripción en celular.
 */
export function PartidaCard({
  partida,
  className,
  descripcionClassName,
}: {
  partida: Partida;
  className?: string;
  descripcionClassName?: string;
}) {
  // El título es la primera línea de la descripción: no se repite.
  const lineas = partida.descripcion.split("\n");
  const detalle =
    partida.titulo && lineas[0].trim() === partida.titulo.trim() ? lineas.slice(1).join("\n") : partida.descripcion;
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-0.5">
        {partida.capitulo && (
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{partida.capitulo}</p>
        )}
        <p className="font-mono text-base font-semibold break-all">{partida.referencia}</p>
      </div>

      {partida.titulo && <p className="text-sm font-semibold">{partida.titulo}</p>}

      <p className={cn("text-sm leading-relaxed whitespace-pre-line", descripcionClassName)}>{detalle}</p>

      <dl className="grid grid-cols-4 gap-x-4 gap-y-2 border-t pt-3 text-sm">
        <Dato etiqueta="Uds.">{partida.unidades}</Dato>
        <Dato etiqueta="L">{formatoMedida(partida.largo)}</Dato>
        <Dato etiqueta="H">{formatoMedida(partida.alto)}</Dato>
        <Dato etiqueta="P">{formatoMedida(partida.profundidad)}</Dato>
        {partida.variantes != null && (
          <Dato etiqueta="Variantes" className="col-span-2 sm:col-span-1">
            {formatoMonto(partida.variantes)}
          </Dato>
        )}
        {partida.precio != null && (
          <Dato etiqueta="Precio" className="col-span-2 sm:col-span-1">
            {formatoMonto(partida.precio)}
          </Dato>
        )}
        {partida.total != null && (
          <Dato etiqueta="Total" className="col-span-2 sm:col-span-1">
            {formatoMonto(partida.total)}
          </Dato>
        )}
      </dl>
    </div>
  );
}
