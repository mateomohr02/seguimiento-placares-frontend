"use client";

import { useRef, useState } from "react";
import { CameraIcon, ClockIcon, ImageIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/loading-dots";
import type { FotoFila } from "../types/planilla.types";

const LADO_MAX = 1600;

/** Foto ya reducida que espera en el equipo hasta que su ítem exista en el servidor (se sube sola al guardar). */
export interface FotoPendiente {
  id: string;
  blob: Blob;
  /** URL local (`URL.createObjectURL`) para la miniatura. */
  url: string;
}

// Reduce la foto antes de subirla (las de la cámara pesan varios MB): lado mayor de 1600 px, JPEG.
async function comprimir(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const escala = Math.min(1, LADO_MAX / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * escala);
    canvas.height = Math.round(bmp.height * escala);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.82));
    return blob ?? file;
  } catch {
    return file;
  }
}

/** Sube una foto (ya reducida) a un ítem que existe en el servidor. */
export async function subirFoto(filaId: string, blob: Blob): Promise<{ foto: FotoFila } | { error: string }> {
  try {
    const res = await fetch(`/planillas-api/filas/${filaId}/fotos`, {
      method: "POST",
      headers: { "Content-Type": blob.type || "image/jpeg" },
      body: blob,
    });
    const body = (await res.json().catch(() => null)) as { data?: FotoFila; message?: string } | null;
    if (!res.ok || !body?.data) return { error: body?.message ?? "No se pudo subir la foto." };
    return { foto: body.data };
  } catch {
    return { error: "No se pudo comunicar con el servidor." };
  }
}

let contadorPendiente = 0;

// Fotos de la pieza antes de termolaminar (filas de PVC): sacar con la cámara o elegir de la galería. Si el ítem todavía
// no existe en el servidor (ítem nuevo sin guardar), la foto queda como pendiente en el equipo y se sube sola al guardar.
export function FotosFila({
  filaId,
  fotos,
  pendientes,
  onCambio,
  onAgregarPendientes,
  onQuitarPendiente,
  soloLectura = false,
}: {
  /** Id del ítem en el servidor; sin id, las fotos quedan pendientes. */
  filaId?: string;
  fotos: FotoFila[];
  pendientes: FotoPendiente[];
  onCambio: (fotos: FotoFila[]) => void;
  onAgregarPendientes: (items: FotoPendiente[]) => void;
  onQuitarPendiente: (id: string) => void;
  soloLectura?: boolean;
}) {
  const camara = useRef<HTMLInputElement>(null);
  const galeria = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [ampliada, setAmpliada] = useState<string | null>(null);

  async function subir(files: FileList | null) {
    const lista = Array.from(files ?? []);
    if (lista.length === 0) return;
    setSubiendo(true);
    try {
      let actuales = fotos;
      const nuevas: FotoPendiente[] = [];
      for (const file of lista) {
        const blob = await comprimir(file);
        if (!filaId) {
          nuevas.push({ id: `p${++contadorPendiente}`, blob, url: URL.createObjectURL(blob) });
          continue;
        }
        const r = await subirFoto(filaId, blob);
        if ("error" in r) {
          toast.error(r.error);
          break;
        }
        actuales = [...actuales, r.foto];
        onCambio(actuales);
      }
      if (nuevas.length > 0) onAgregarPendientes(nuevas);
    } finally {
      setSubiendo(false);
      if (camara.current) camara.current.value = "";
      if (galeria.current) galeria.current.value = "";
    }
  }

  async function borrar(id: string) {
    if (!window.confirm("¿Borrar esta foto?")) return;
    try {
      const res = await fetch(`/planillas-api/fotos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        return void toast.error(body?.message ?? "No se pudo borrar la foto.");
      }
      onCambio(fotos.filter((f) => f.id !== id));
    } catch {
      toast.error("No se pudo comunicar con el servidor.");
    }
  }

  const total = fotos.length + pendientes.length;

  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Fotos de la pieza ({total})</span>
        {!soloLectura && (
          <>
            <Button type="button" variant="outline" className="h-10 px-3" disabled={subiendo} onClick={() => camara.current?.click()}>
              {subiendo ? <LoadingDots /> : <CameraIcon />} Sacar foto
            </Button>
            <Button type="button" variant="outline" className="h-10 px-3" disabled={subiendo} onClick={() => galeria.current?.click()}>
              <ImageIcon /> Elegir de la galería
            </Button>
            <input ref={camara} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void subir(e.target.files)} />
            <input ref={galeria} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void subir(e.target.files)} />
          </>
        )}
      </div>
      {total > 0 && (
        <ul className="flex flex-wrap gap-2">
          {fotos.map((f) => (
            <li key={f.id} className="relative">
              <button type="button" onClick={() => setAmpliada(f.id)} aria-label="Ampliar foto">
                {/* eslint-disable-next-line @next/next/no-img-element -- foto servida por un proxy propio */}
                <img src={`/planillas-api/fotos/${f.id}`} alt="Foto de la pieza" loading="lazy" className="size-20 rounded-md border object-cover" />
              </button>
              {!soloLectura && (
                <button
                  type="button"
                  onClick={() => void borrar(f.id)}
                  aria-label="Borrar foto"
                  className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-destructive text-white shadow"
                >
                  <XIcon className="size-3.5" />
                </button>
              )}
            </li>
          ))}
          {pendientes.map((p) => (
            <li key={p.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura local de una foto que todavía no se subió */}
              <img src={p.url} alt="Foto pendiente de subir" className="size-20 rounded-md border border-dashed border-gold object-cover opacity-80" />
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 rounded-b-md bg-black/60 py-0.5 text-[10px] font-medium text-white">
                <ClockIcon className="size-3" /> Pendiente
              </span>
              <button
                type="button"
                onClick={() => onQuitarPendiente(p.id)}
                aria-label="Quitar foto pendiente"
                className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-destructive text-white shadow"
              >
                <XIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {pendientes.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {pendientes.length === 1 ? "Hay 1 foto que se sube" : `Hay ${pendientes.length} fotos que se suben`} sola al guardar el ítem; mientras tanto quedan en este equipo.
        </p>
      )}
      {ampliada && <Ampliada id={ampliada} onCerrar={() => setAmpliada(null)} />}
    </div>
  );
}

export function Ampliada({ id, onCerrar }: { id: string; onCerrar: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" role="dialog" aria-modal="true" onClick={onCerrar}>
      {/* eslint-disable-next-line @next/next/no-img-element -- foto servida por un proxy propio */}
      <img src={`/planillas-api/fotos/${id}`} alt="Foto de la pieza" className="max-h-full max-w-full rounded-md object-contain" />
      <button type="button" onClick={onCerrar} aria-label="Cerrar" className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-white/90 text-black">
        <XIcon />
      </button>
    </div>
  );
}

// Miniaturas de solo lectura (detalle de una planilla / trazabilidad): se amplían al tocarlas.
export function FotosSoloLectura({ fotos }: { fotos: FotoFila[] }) {
  const [ampliada, setAmpliada] = useState<string | null>(null);
  if (fotos.length === 0) return <span className="text-sm text-muted-foreground">Sin fotos</span>;
  return (
    <>
      <ul className="flex flex-wrap gap-2">
        {fotos.map((f) => (
          <li key={f.id}>
            <button type="button" onClick={() => setAmpliada(f.id)} aria-label="Ampliar foto">
              {/* eslint-disable-next-line @next/next/no-img-element -- foto servida por un proxy propio */}
              <img src={`/planillas-api/fotos/${f.id}`} alt="Foto de la pieza" loading="lazy" className="size-24 rounded-md border object-cover" />
            </button>
          </li>
        ))}
      </ul>
      {ampliada && <Ampliada id={ampliada} onCerrar={() => setAmpliada(null)} />}
    </>
  );
}
