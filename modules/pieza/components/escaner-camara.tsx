"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "cn";
import { ListIcon, XIcon } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType, NotFoundException } from "@zxing/library";
import type { IScannerControls } from "@zxing/browser";
import { escanearPiezaAction } from "../actions/escanear-pieza.action";
import { VolverLink } from "@/components/volver-link";
import { useHistorialEscaneo } from "../hooks/use-historial-escaneo";
import { HistorialEscaneo } from "./historial-escaneo";

// diseño.md Vista 5 — modo continuo, código siempre 7 dígitos (idUnico,
// Code39 fijo). Evita reprocesar el mismo código mientras sigue en cuadro
// con un cooldown corto, en vez de exigir que el operario lo saque de foco.
const COOLDOWN_MS = 3000;

// Flotante, en vidrio (translúcido): tiene que verse siempre arriba de la imagen de
// cámara (o de cualquier pantalla de error), es la única forma de salir de Vista 5.
function BotonVolver() {
  return <VolverLink href="/" variante="vidrio" className="absolute top-4 left-4 z-10" />;
}

export function EscanerCamara({ claveSesion, expiraEn }: { claveSesion: string; expiraEn: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Historial de la sesión (en el navegador, se limpia al cerrar/vencer la sesión).
  const { items, registrar } = useHistorialEscaneo(claveSesion, expiraEn);
  // En pantallas angostas el historial es un panel que se abre con un botón.
  const [panelAbierto, setPanelAbierto] = useState(false);
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
      return;
    }
    setErrorMsg(null);
    registrar(result.resumen);
  }, [registrar]);

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

  // Contenido del área de cámara: aviso de error (la cámara no se puede usar) o la
  // cámara con su mira. El historial (sidebar) se ve siempre.
  const avisoError = !secure
    ? "El acceso a la cámara requiere HTTPS (diseño.md §10.2). Entrá por la URL segura de la tablet, no por HTTP plano."
    : cameraError;

  const ultimo = items[0];

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <div className="absolute inset-0 overflow-hidden">
        <BotonVolver />

        {/* Solo en pantallas angostas: abre el historial. Toma el color del último escaneo. */}
        <button
          type="button"
          onClick={() => setPanelAbierto(true)}
          className={cn(
            "absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium backdrop-blur md:hidden",
            !ultimo
              ? "bg-black/60 text-white"
              : ultimo.yaEscaneada
                ? "bg-yellow-300 text-yellow-950"
                : "bg-green-600 text-white",
          )}
        >
          <ListIcon className="size-4" />
          Escaneadas ({items.length})
        </button>

        {avisoError ? (
          <div className={cn("flex h-full items-center justify-center p-6 pt-16 text-center text-sm md:pr-80", secure ? "text-red-400" : "text-gray-300")}>
            {avisoError}
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

            {errorMsg && (
              <div className="absolute inset-x-0 top-16 m-4 md:right-80 rounded-xl bg-destructive/90 p-3 text-center text-sm font-medium text-white">
                {errorMsg}
              </div>
            )}

            {/* Mira: encuadre rectangular (los Code39 son anchos) con el resto de la
                imagen atenuada, esquinas marcadas y una línea de barrido. Es solo
                guía visual — el lector decodifica todo el cuadro. */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center md:right-80">
              <div className="relative h-[28%] w-[80%] max-w-2xl rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                <span className="absolute top-0 left-0 size-8 rounded-tl-2xl border-t-4 border-l-4 border-white" />
                <span className="absolute top-0 right-0 size-8 rounded-tr-2xl border-t-4 border-r-4 border-white" />
                <span className="absolute bottom-0 left-0 size-8 rounded-bl-2xl border-b-4 border-l-4 border-white" />
                <span className="absolute right-0 bottom-0 size-8 rounded-br-2xl border-r-4 border-b-4 border-white" />
                <span
                  className="absolute inset-x-3 h-0.5 rounded-full bg-gold shadow-[0_0_8px_var(--gold)]"
                  style={{ animation: "scan-line 2.4s ease-in-out infinite" }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sidebar con una tarjeta por pieza escaneada. En pantallas angostas es un panel superpuesto. */}
      <aside
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-20 w-[min(22rem,92%)] md:block md:w-80",
          // En pantallas angostas es un panel que se abre; se oscurece un poco para leerse sobre la cámara.
          panelAbierto ? "block max-md:bg-black/35 max-md:backdrop-blur-sm" : "hidden",
        )}
      >
        <button
          type="button"
          onClick={() => setPanelAbierto(false)}
          aria-label="Cerrar historial"
          className="pointer-events-auto absolute top-4 right-3 z-10 rounded-full border border-white/30 bg-black/30 p-1.5 text-white backdrop-blur-xl md:hidden"
        >
          <XIcon className="size-4" />
        </button>
        <HistorialEscaneo items={items} />
      </aside>
    </div>
  );
}
