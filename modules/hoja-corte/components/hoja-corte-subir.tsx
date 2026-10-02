"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/loading-dots";
import { loadPdfjs } from "@/lib/pdfjs";

// Lee el texto de la primera página y busca "Orden <número>" (así imprime
// TeoWin el encabezado de cada hoja). Devuelve el número encontrado o null si el
// PDF no tiene capa de texto (ej. un escaneo): en ese caso no se puede verificar.
async function ordenDelPdf(file: File): Promise<string | null> {
  const pdfjs = await loadPdfjs();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await loadingTask.promise;
  try {
    const page = await doc.getPage(1);
    const { items } = await page.getTextContent();
    const texto = items.map((i) => ("str" in i ? i.str : "")).join(" ");
    return /Orden\s+(\d{6,})/i.exec(texto)?.[1] ?? null;
  } finally {
    void loadingTask.destroy();
  }
}

export function HojaCorteSubir({
  ordenId,
  codigoOrdenFabricacion,
  numeroOrdenCustom,
}: {
  ordenId: string;
  codigoOrdenFabricacion: number;
  numeroOrdenCustom: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Elegí un archivo PDF.");
    if (!/\.pdf$/i.test(file.name)) return setError("El archivo debe ser un PDF.");
    if (!nombre.trim()) return setError("Ponele un nombre a la hoja (ej. MDP, MDF).");

    setSubiendo(true);
    try {
      // Evita cargar la hoja de otra orden por error.
      const ordenPdf = await ordenDelPdf(file).catch(() => null);
      if (ordenPdf && ordenPdf !== String(codigoOrdenFabricacion)) {
        setError(
          `Este PDF es de la orden ${ordenPdf}, pero estás cargando la orden ${codigoOrdenFabricacion} (${numeroOrdenCustom}).`,
        );
        return;
      }

      const query = new URLSearchParams({ nombre: nombre.trim(), archivo: file.name });
      const res = await fetch(`/ordenes/${ordenId}/hojas-corte/subir?${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        setError(body?.message ?? "No se pudo subir el PDF.");
        return;
      }
      toast.success("Hoja de corte cargada.");
      setNombre("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      setError("No se pudo comunicar con el servidor.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="font-semibold">Cargar hoja de corte</h2>
      <p className="text-sm text-muted-foreground">
        Una orden puede tener varias hojas (por ejemplo, una para MDP y otra para MDF). El PDF se
        verifica contra el número de orden.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <label htmlFor="hoja-nombre" className="text-sm">
            Nombre
          </label>
          <Input
            id="hoja-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Hoja completa, MDP, MDF"
            maxLength={80}
            autoComplete="off"
          />
        </div>
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <label htmlFor="hoja-archivo" className="text-sm">
            Archivo PDF
          </label>
          <input
            id="hoja-archivo"
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            className="text-sm file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5"
          />
        </div>
        <Button type="submit" disabled={subiendo}>
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
