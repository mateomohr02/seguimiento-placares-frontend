"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType, NotFoundException } from "@zxing/library";
import type { IScannerControls } from "@zxing/browser";
import { escanearPiezaAction } from "../actions/escanear-pieza.action";
import type { EscaneoResumen } from "../types/pieza.types";

// diseño.md Vista 5 — modo continuo, código siempre 7 dígitos (idUnico,
// Code39 fijo). Evita reprocesar el mismo código mientras sigue en cuadro
// con un cooldown corto, en vez de exigir que el operario lo saque de foco.
const COOLDOWN_MS = 3000;

// Flotante y con fondo propio: tiene que verse siempre arriba de la imagen de
// cámara (o de cualquier pantalla de error), es la única forma de salir de
// Vista 5.
function BotonVolver() {
  return (
    <Link
      href="/"
      className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-2 text-sm font-medium text-white backdrop-blur hover:bg-black/75"
    >
      <ArrowLeftIcon className="size-4" />
      Volver
    </Link>
  );
}

export function EscanerCamara() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [resumen, setResumen] = useState<EscaneoResumen | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [secure, setSecure] = useState(true);
  const lastScan = useRef<{ code: string; at: number } | null>(null);
  const busyRef = useRef(false);

  const handleDecoded = useCallback(async (text: string) => {
    if (!/^\d{7}$/.test(text)) return;

    const now = Date.now();
    if (lastScan.current && lastScan.current.code === text && now - lastScan.current.at < COOLDOWN_MS) {
      return;
    }
    if (busyRef.current) return;
    busyRef.current = true;
    lastScan.current = { code: text, at: now };

    const result = await escanearPiezaAction({ idUnico: text });
    busyRef.current = false;

    if (!result.success) {
      setErrorMsg(result.message);
      setResumen(null);
      return;
    }
    setErrorMsg(null);
    setResumen(result.resumen);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!window.isSecureContext) {
      setSecure(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Este navegador no soporta acceso a cámara.");
      return;
    }

    const hints = new Map<DecodeHintType, unknown>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_39]);
    const reader = new BrowserMultiFormatReader(hints);

    let controls: IScannerControls | undefined;
    let cancelled = false;

    // React Strict Mode (dev, App Router) monta el efecto, lo limpia y lo
    // vuelve a montar en el mismo tick para detectar cleanups faltantes. Si
    // pedimos la cámara de inmediato, ese primer getUserMedia queda "vivo" en
    // paralelo al segundo — el hardware de la tablet no libera la cámara a
    // tiempo y el video corta a los pocos segundos. Diferir el pedido real
    // deja que el ciclo sintético se cancele antes de tocar la cámara, sin
    // afectar el caso real (un solo mount, con un delay imperceptible).
    const timer = setTimeout(() => {
      if (cancelled) return;
      reader
        .decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current ?? undefined,
          (result, error) => {
            if (result) void handleDecoded(result.getText());
            else if (error && !(error instanceof NotFoundException)) {
              // NotFoundException es el caso normal "no hay código en este frame"
            }
          },
        )
        .then((c) => {
          if (cancelled) {
            c.stop();
            return;
          }
          controls = c;
        })
        .catch((err) => {
          setCameraError(err instanceof Error ? err.message : "No se pudo acceder a la cámara.");
        });
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controls?.stop();
    };
  }, [handleDecoded]);

  if (!secure) {
    return (
      <div className="relative flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        <BotonVolver />
        El acceso a la cámara requiere HTTPS (diseño.md §10.2). Entrá por la URL segura de la tablet,
        no por HTTP plano.
      </div>
    );
  }

  if (cameraError) {
    return (
      <div className="relative flex h-full items-center justify-center p-6 text-center text-sm text-destructive">
        <BotonVolver />
        {cameraError}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <BotonVolver />

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

      {errorMsg && (
        <div className="absolute inset-x-0 top-0 m-4 rounded-xl bg-destructive/90 p-3 text-center text-sm font-medium text-white">
          {errorMsg}
        </div>
      )}

      {resumen && (
        <div className="absolute inset-x-0 bottom-0 m-4 rounded-xl bg-popover/95 p-4 text-popover-foreground shadow-lg backdrop-blur">
          <p className="text-xs text-muted-foreground">
            Orden {resumen.orden.numeroOrdenCustom} · Pedido {resumen.pedido.codigo_pedido}
          </p>
          <p className="font-medium">
            {resumen.pieza.descripcion ?? `${resumen.pieza.familia} / ${resumen.pieza.articulo}`} para el
            módulo {resumen.modulo.descripcion}
          </p>
          <p className="text-sm">
            {resumen.pieza.medida1} × {resumen.pieza.medida2} · {resumen.pieza.color} · idUnico{" "}
            {resumen.pieza.idUnico}
          </p>
        </div>
      )}
    </div>
  );
}
