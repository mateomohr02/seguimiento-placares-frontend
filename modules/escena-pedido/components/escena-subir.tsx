"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/loading-dots";

// Subida de una escena .3d de TeoWin a un pedido.
export function EscenaSubir({ pedidoId }: { pedidoId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Elegí el archivo .3d de la escena.");
    if (!file.name.toLowerCase().endsWith(".3d")) return setError("El archivo tiene que ser un .3d de TeoWin.");
    if (!nombre.trim()) return setError("Ponele un nombre a la escena (ej. Vestidor completo).");

    setSubiendo(true);
    try {
      const query = new URLSearchParams({ nombre: nombre.trim(), archivo: file.name });
      const res = await fetch(`/pedidos/${pedidoId}/escenas/subir?${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-teowin-3d" },
        body: file,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        return setError(body?.message ?? "No se pudo subir la escena.");
      }
      toast.success("Escena cargada.");
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
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <label htmlFor="escena-archivo" className="text-sm">
            Archivo de escena (.3d)
          </label>
          <input
            id="escena-archivo"
            ref={fileRef}
            type="file"
            accept=".3d"
            className="text-sm file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-2"
          />
        </div>
        <div className="flex min-w-48 flex-1 flex-col gap-1">
          <label htmlFor="escena-nombre" className="text-sm">
            Nombre
          </label>
          <Input
            id="escena-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Vestidor completo"
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
