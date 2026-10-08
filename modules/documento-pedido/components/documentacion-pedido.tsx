import Link from "next/link";
import { AlertTriangleIcon, CheckCircle2Icon, FileTextIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DocumentoEliminar } from "./documento-eliminar";
import { DocumentoSubir } from "./documento-subir";
import {
  ETIQUETA_TIPO,
  TIPOS_ADICIONALES,
  TIPOS_OBLIGATORIOS,
  type DocumentoPedido,
  type TipoDocumento,
} from "../types/documento-pedido.types";

const fecha = new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" });

function FilaDocumento({
  pedidoId,
  doc,
  puedeGestionar,
}: {
  pedidoId: string;
  doc: DocumentoPedido;
  puedeGestionar: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border bg-background p-3">
      <FileTextIcon className="size-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{doc.nombre}</div>
        <div className="truncate text-sm text-muted-foreground">
          {doc.nombre_archivo} · cargado {fecha.format(new Date(doc.creado_en))}
        </div>
      </div>
      <Link
        href={`/pedidos/${pedidoId}/documentos/${doc.id}`}
        className={buttonVariants({ className: "h-11 px-5" })}
      >
        Abrir
      </Link>
      {puedeGestionar && <DocumentoEliminar documento={doc} />}
    </li>
  );
}

// Documentación del pedido: Nota de Pedido y Detalle de Remisión son obligatorias
// (se marca lo que falta); el resto se agrega según corresponda al pedido.
export function DocumentacionPedido({
  pedidoId,
  codigoPedido,
  documentos,
  puedeGestionar,
}: {
  pedidoId: string;
  codigoPedido: string;
  documentos: DocumentoPedido[];
  /** Subir y eliminar documentos (permiso documentacion.gestionar). */
  puedeGestionar: boolean;
}) {
  const de = (t: TipoDocumento) => documentos.filter((d) => d.tipo === t);
  const adicionales = documentos.filter((d) => TIPOS_ADICIONALES.includes(d.tipo));

  return (
    <section id="documentacion" className="flex scroll-mt-20 flex-col gap-4">
      <h2 className="text-lg font-semibold">Documentación</h2>

      <div className="grid gap-4 md:grid-cols-2">
        {TIPOS_OBLIGATORIOS.map((tipo) => {
          const docs = de(tipo);
          return (
            <div key={tipo} className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{ETIQUETA_TIPO[tipo]}</h3>
                {docs.length > 0 ? (
                  <CheckCircle2Icon className="size-5 text-green-700" aria-label="Cargado" />
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-sm font-medium text-amber-900">
                    <AlertTriangleIcon className="size-4" /> Falta cargar
                  </span>
                )}
              </div>
              {docs.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {docs.map((d) => (
                    <FilaDocumento key={d.id} pedidoId={pedidoId} doc={d} puedeGestionar={puedeGestionar} />
                  ))}
                </ul>
              )}
              {puedeGestionar && <DocumentoSubir pedidoId={pedidoId} codigoPedido={codigoPedido} tipos={[tipo]} />}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <h3 className="font-semibold">Documentación adicional</h3>
        <p className="text-sm text-muted-foreground">
          Según la modulación y los modelos del pedido: escandallo, herrajes de producción y accesorios de
          instalación (placares o cocinas).
        </p>
        {adicionales.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este pedido no tiene documentación adicional cargada.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {TIPOS_ADICIONALES.filter((t) => de(t).length > 0).map((t) => (
              <div key={t} className="flex flex-col gap-2">
                <div className="text-sm font-medium">{ETIQUETA_TIPO[t]}</div>
                <ul className="flex flex-col gap-2">
                  {de(t).map((d) => (
                    <FilaDocumento key={d.id} pedidoId={pedidoId} doc={d} puedeGestionar={puedeGestionar} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {puedeGestionar && <DocumentoSubir pedidoId={pedidoId} codigoPedido={codigoPedido} tipos={TIPOS_ADICIONALES} />}
      </div>
    </section>
  );
}
