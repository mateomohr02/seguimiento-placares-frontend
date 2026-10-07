"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/loading-dots";
import { analizarPdf } from "../lib/analizar-pdf";
import { ETIQUETA_TIPO, type TipoDocumento } from "../types/documento-pedido.types";

// Subida de un PDF a un pedido. Con un solo tipo posible el tipo va fijo; con
// varios se elige (y se autoselecciona al reconocer el título del PDF). Antes de
// subir se verifica, leyendo la primera hoja, que el PDF sea de ESTE pedido y del
// tipo elegido (evita cargar el de otro pedido o confundir placares / cocinas).
export function DocumentoSubir({
  pedidoId,
  codigoPedido,
  tipos,
}: {
  pedidoId: string;
  codigoPedido: string;
  tipos: TipoDocumento[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tipo, setTipo] = useState<TipoDocumento | "">(tipos.length === 1 ? tipos[0] : "");
  const [nombre, setNombre] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idBase = `doc-${tipos.length === 1 ? tipos[0] : "extra"}`;

  async function alElegirArchivo() {
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file || tipos.length === 1) return;
    const detectado = await analizarPdf(file).catch(() => null);
    if (detectado?.tipo && tipos.includes(detectado.tipo)) setTipo(detectado.tipo);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Elegí un archivo PDF.");
    if (!/\.pdf$/i.test(file.name)) return setError("El archivo debe ser un PDF.");
    if (!tipo) return setError("Elegí el tipo de documento.");

    setSubiendo(true);
    try {
      const analisis = await analizarPdf(file).catch(() => null);
      if (analisis) {
        if (analisis.pedidos.length > 0 && !analisis.pedidos.includes(codigoPedido)) {
          return setError(
            `Este PDF es del pedido ${analisis.pedidos.join(", ")}, pero estás cargando el pedido ${codigoPedido}.`,
          );
        }
        if (analisis.tipo && analisis.tipo !== tipo) {
          return setError(
            `Este PDF parece ser «${ETIQUETA_TIPO[analisis.tipo]}», pero elegiste «${ETIQUETA_TIPO[tipo]}».`,
          );
        }
      }

      const query = new URLSearchParams({ tipo, archivo: file.name });
      if (nombre.trim()) query.set("nombre", nombre.trim());
      const res = await fetch(`/pedidos/${pedidoId}/documentos/subir?${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        return setError(body?.message ?? "No se pudo subir el PDF.");
      }
      toast.success("Documento cargado.");
      setNombre("");
      if (fileRef.current) fileRef.current.value = "";
      if (tipos.length > 1) setTipo("");
      router.refresh();
    } catch {
      setError("No se pudo comunicar con el servidor.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        {tipos.length > 1 && (
          <div className="flex min-w-60 flex-1 flex-col gap-1">
            <label htmlFor={`${idBase}-tipo`} className="text-sm">
              Tipo de documento
            </label>
            <select
              id={`${idBase}-tipo`}
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoDocumento | "")}
              className="h-11 rounded-lg border bg-background px-2"
            >
              <option value="">Elegí…</option>
              {tipos.map((t) => (
                <option key={t} value={t}>
                  {ETIQUETA_TIPO[t]}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <label htmlFor={`${idBase}-archivo`} className="text-sm">
            Archivo PDF
          </label>
          <input
            id={`${idBase}-archivo`}
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={() => void alElegirArchivo()}
            className="text-sm file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-2"
          />
        </div>
        <div className="flex min-w-40 flex-1 flex-col gap-1">
          <label htmlFor={`${idBase}-nombre`} className="text-sm">
            Nombre (opcional)
          </label>
          <Input
            id={`${idBase}-nombre`}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Remisión parcial 2"
            maxLength={80}
            autoComplete="off"
            className="h-11"
          />
        </div>
        <Button type="submit" className="h-11 px-4" disabled={subiendo}>
          {subiendo ? <LoadingDots /> : <UploadIcon />} Subir
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
