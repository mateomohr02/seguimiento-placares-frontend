"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/loading-dots";

// Operarios del área de Termolaminado (los configura técnica). Salen en el encabezado de las
// planillas nuevas; las ya creadas conservan los nombres que tenían.
export function OperariosForm({ inicial }: { inicial: string[] }) {
  const router = useRouter();
  const [nombres, setNombres] = useState<string[]>(inicial.length > 0 ? inicial : [""]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const res = await fetch("/planillas-api/operarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operarios: nombres.map((n) => n.trim()).filter(Boolean) }),
      });
      const body = (await res.json().catch(() => null)) as { data?: { operarios: string[] }; message?: string } | null;
      if (!res.ok || !body?.data) return setError(body?.message ?? "No se pudo guardar.");
      setNombres(body.data.operarios.length > 0 ? body.data.operarios : [""]);
      toast.success("Operarios guardados.");
      router.refresh();
    } catch {
      setError("No se pudo comunicar con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {nombres.map((n, i) => (
          <li key={i} className="flex items-center gap-2">
            <Input
              value={n}
              onChange={(e) => setNombres((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
              placeholder="Nombre del operario"
              maxLength={60}
              autoComplete="off"
              className="h-11 max-w-sm"
              aria-label={`Operario ${i + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              className="h-11"
              onClick={() => setNombres((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : [""]))}
              aria-label={`Quitar operario ${i + 1}`}
            >
              <Trash2Icon />
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" className="h-11 px-4" disabled={nombres.length >= 10} onClick={() => setNombres((p) => [...p, ""])}>
          <PlusIcon /> Agregar operario
        </Button>
        <Button type="submit" className="h-11 px-5" disabled={guardando}>
          {guardando ? <LoadingDots /> : <SaveIcon />} Guardar
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
