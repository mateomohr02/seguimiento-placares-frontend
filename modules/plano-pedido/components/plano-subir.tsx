"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/loading-dots";

const FORMATOS = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

// Subida de un plano (imagen o PDF) a un pedido, opcionalmente asociado a un módulo.
export function PlanoSubir({
  pedidoId,
  modulos,
}: {
  pedidoId: string;
  modulos: { id: string; idEscena: number; descripcion: string }[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState("");
  const [moduloId, setModuloId] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Elegí el archivo del plano (imagen o PDF).");
    if (!FORMATOS.includes(file.type)) return setError("Formato no soportado. Usá JPG, PNG, WEBP o PDF.");
    if (!nombre.trim()) return setError("Ponele un nombre al plano (ej. Alacena H600 izquierda).");

    setSubiendo(true);
    try {
      const query = new URLSearchParams({ nombre: nombre.trim(), archivo: file.name });
      if (moduloId) query.set("moduloId", moduloId);
      const res = await fetch(`/pedidos/${pedidoId}/planos/subir?${query}`, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        return setError(body?.message ?? "No se pudo subir el plano.");
      }
      toast.success("Plano cargado.");
      setNombre("");
      setModuloId("");
      if (fileRef.current) fileRef.current.value = "";
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
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <label htmlFor="plano-archivo" className="text-sm">
            Archivo (imagen o PDF)
          </label>
          <input
            id="plano-archivo"
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="text-sm file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-2"
          />
        </div>
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <label htmlFor="plano-nombre" className="text-sm">
            Nombre
          </label>
          <Input
            id="plano-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Alacena H600 izquierda"
            maxLength={80}
            autoComplete="off"
            className="h-11"
          />
        </div>
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <label htmlFor="plano-modulo" className="text-sm">
            Módulo (opcional)
          </label>
          <select
            id="plano-modulo"
            value={moduloId}
            onChange={(e) => setModuloId(e.target.value)}
            className="h-11 rounded-lg border bg-background px-2"
          >
            <option value="">Todo el pedido</option>
            {modulos.map((m) => (
              <option key={m.id} value={m.id}>
                Módulo {m.idEscena} — {m.descripcion}
              </option>
            ))}
          </select>
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
