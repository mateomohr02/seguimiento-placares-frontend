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
// Code39 fijo). Cooldown global entre escaneos: evita reprocesar el mismo código
// mientras sigue en cuadro y lecturas seguidas, sin exigir sacarlo de foco.
const COOLDOWN_MS = 3000;

// Flotante, en vidrio (translúcido): tiene que verse siempre arriba de la imagen de
// cámara (o de cualquier pantalla de error), es la única forma de salir de Vista 5.
function BotonVolver() {
  return <VolverLink href="/" variante="vidrio" className="absolute top-4 left-4 z-10" />;
}

interface BarcodeDetectorCtor {
  new (opts: { formats: string[] }): { detect(src: HTMLVideoElement): Promise<{ rawValue: string }[]> };
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
  const [info, setInfo] = useState<string | null>(null);
  const cooldownHasta = useRef(0);
  const busyRef = useRef(false);

  const handleDecoded = useCallback(async (text: string) => {
    if (!/^\d{7}$/.test(text)) return;

    // Cooldown global: tras una lectura válida se ignora cualquier código durante
    // COOLDOWN_MS (cuenta desde que termina el pedido al backend).
    if (busyRef.current || Date.now() < cooldownHasta.current) return;
    busyRef.current = true;

    const result = await escanearPiezaAction({ idUnico: text });
    busyRef.current = false;
    cooldownHasta.current = Date.now() + COOLDOWN_MS;

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

    let cancelled = false;
    let stream: MediaStream | undefined;
    let controls: IScannerControls | undefined;
    let loop: ReturnType<typeof setTimeout> | undefined;
    const videoEl = videoRef.current;
    const debug = new URLSearchParams(window.location.search).has("debug");

    // Manejamos nosotros el getUserMedia y el cierre de la pista (en vez de dejarlo
    // a zxing) para que cualquier rechazo de Chrome en Android ("setPhotoOptions
    // failed") quede atrapado acá. En el celular se usa el BarcodeDetector nativo
    // (más rápido y más tolerante a etiquetas chicas); si no existe, zxing.
    const iniciar = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) return;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play().catch(() => {});

        const BD = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
        let motor = "zxing";
        if (BD) {
          const detector = new BD({ formats: ["code_39"] });
          motor = "BarcodeDetector";
          const tick = async () => {
            if (cancelled) return;
            try {
              if (video.readyState >= 2) {
                const codes = await detector.detect(video);
                if (codes[0]) void handleDecoded(codes[0].rawValue.replace(/\*/g, ""));
              }
            } catch {
              // frame sin código o video no listo
            }
            if (!cancelled) loop = setTimeout(tick, 120);
          };
          void tick();
        } else {
          const hints = new Map<DecodeHintType, unknown>();
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_39]);
          const reader = new BrowserMultiFormatReader(hints);
          controls = await reader.decodeFromStream(stream, video, (result, error) => {
            if (result) void handleDecoded(result.getText());
            else if (error && !(error instanceof NotFoundException)) {
              // NotFoundException es el caso normal "no hay código en este frame"
            }
          });
        }

        if (debug) {
          const t = stream.getVideoTracks()[0];
          const st = t.getSettings();
          const caps = (t.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { focusMode?: string[] };
          setInfo(`${motor} · ${t.label} · ${st.width}x${st.height} · enfoque: ${caps.focusMode?.join(",") ?? "n/d"}`);
        }
      } catch (err) {
        if (!cancelled) setCameraError(err instanceof Error ? err.message : "No se pudo acceder a la cámara.");
      }
    };

    // React Strict Mode (dev) monta, limpia y vuelve a montar en el mismo tick; si
    // pedimos la cámara de inmediato el primer getUserMedia queda vivo en paralelo
    // al segundo. Diferir el pedido deja que el ciclo sintético se cancele antes.
    const timer = setTimeout(() => void iniciar(), 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (loop) clearTimeout(loop);
      try {
        controls?.stop();
      } catch {}
      stream?.getTracks().forEach((t) => t.stop());
      if (videoEl) videoEl.srcObject = null;
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

        {info && (
          <div className="absolute inset-x-0 bottom-0 z-10 bg-black/70 p-2 text-xs text-white md:right-80">{info}</div>
        )}

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
