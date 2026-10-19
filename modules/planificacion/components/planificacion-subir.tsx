"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/loading-dots";

const TIPOS_ARCHIVO = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

// Subida de la planificación semanal (pedidos o reclamos) que baja la oficina técnica.
export function PlanificacionSubir({ hoy }: { hoy: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tipo, setTipo] = useState("PEDIDOS");
  const [semana, setSemana] = useState(hoy);
  const [nombre, setNombre] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) return setError("Elegí el archivo (PDF o imagen).");
    if (!TIPOS_ARCHIVO.includes(file.type)) return setError("El archivo tiene que ser un PDF o una imagen (JPG, PNG o WEBP).");
    if (!semana) return setError("Indicá la semana.");

    setSubiendo(true);
    try {
      const query = new URLSearchParams({ tipo, semana, nombre: nombre.trim(), archivo: file.name });
      const res = await fetch(`/planificacion/subir?${query}`, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        return setError(body?.message ?? "No se pudo subir el archivo.");
      }
      toast.success("Planificación cargada.");
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
    <form onSubmit={onSubmit} className="flex flex-col gap-2 rounded-lg border p-4">
      <h2 className="font-semibold">Cargar planificación</h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Tipo</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="h-11 rounded-lg border border-input bg-background px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
          >
            <option value="PEDIDOS">Planificación de pedidos</option>
            <option value="RECLAMOS">Reclamos</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Semana (cualquier día de la semana)</span>
          <Input type="date" value={semana} onChange={(e) => setSemana(e.target.value)} className="h-11 w-44" />
        </label>
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Nombre (opcional)</span>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} autoComplete="off" className="h-11" />
        </label>
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Archivo (PDF o imagen)</span>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,image/*"
            className="text-sm file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-2"
          />
        </label>
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
