"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, MinusIcon, PencilIcon, PlusIcon, ScanIcon } from "lucide-react";
import type { PDFDocumentProxy, PDFDocumentLoadingTask } from "pdfjs-dist/legacy/build/pdf.mjs";
import { Button, buttonVariants } from "@/components/ui/button";
import { LoadingDots } from "@/components/loading-dots";
import { loadPdfjs } from "@/lib/pdfjs";
import type { AnotacionNota, AnotacionPagina, Herramienta, NuevaAnotacion } from "../types/anotacion.types";
import { CapaAnotaciones } from "./anotaciones-capa";
import { BarraAnotaciones, paletaDe } from "./barra-anotaciones";
import { NotasDocumento } from "./notas-documento";
import { useAnotaciones } from "../hooks/use-anotaciones";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
// Tope de lado del canvas: las tablets viejas fallan (canvas en blanco) por encima.
const MAX_CANVAS_SIDE = 4096;
const REFRESCO_ANOTACIONES_MS = 20000;
const SIN_ANOTACIONES: AnotacionPagina[] = [];

// Una página: se dibuja solo mientras está cerca de la pantalla y libera el
// canvas al alejarse (una orden puede tener 80+ hojas y la tablet no las
// aguanta todas rasterizadas a la vez).
function Pagina({
  pdf,
  imagenSrc,
  numero,
  cssWidth,
  aspect,
  scrollRoot,
  anotaciones,
  herramienta,
  color,
  nivel,
  onCrear,
  onBorrar,
}: {
  pdf: PDFDocumentProxy | null;
  /** Si viene, la página es una imagen (planos) y no se usa pdf.js. */
  imagenSrc?: string;
  numero: number;
  cssWidth: number;
  aspect: number;
  scrollRoot: HTMLElement | null;
  anotaciones: AnotacionPagina[];
  herramienta: Herramienta;
  color: string;
  nivel: number;
  onCrear: (a: NuevaAnotacion) => void;
  onBorrar: (id: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cerca, setCerca] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !scrollRoot) return;
    const io = new IntersectionObserver(([entry]) => setCerca(entry.isIntersecting), {
      root: scrollRoot,
      rootMargin: "150% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [scrollRoot]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pdf) return;
    if (!cerca || cssWidth <= 0) {
      canvas.width = 0;
      canvas.height = 0;
      return;
    }
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<unknown> } | null = null;
    (async () => {
      const page = await pdf.getPage(numero);
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let scale = (cssWidth / base.width) * dpr;
      scale = Math.min(scale, MAX_CANVAS_SIDE / Math.max(base.width, base.height));
      const viewport = page.getViewport({ scale });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      task = page.render({ canvas, canvasContext: ctx, viewport });
      try {
        await task.promise;
      } catch (err) {
        // Cancelar un render en curso (zoom, scroll) es normal, no un error.
        if ((err as { name?: string }).name !== "RenderingCancelledException") console.error(err);
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, numero, cerca, cssWidth]);

  return (
    <div
      ref={wrapRef}
      data-pagina={numero}
      className="relative mx-auto bg-white shadow-md ring-1 ring-black/10"
      style={{ width: cssWidth, height: cssWidth * aspect }}
    >
      {imagenSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- el archivo sale de un proxy propio, no hay nada que optimizar
        <img src={imagenSrc} alt="" draggable={false} className="block size-full select-none" />
      ) : (
        <canvas ref={canvasRef} className="block size-full" />
      )}
      {cssWidth > 0 && (
        <CapaAnotaciones
          pagina={numero}
          cssWidth={cssWidth}
          cssHeight={cssWidth * aspect}
          anotaciones={anotaciones}
          herramienta={herramienta}
          color={color}
          nivel={nivel}
          onCrear={onCrear}
          onBorrar={onBorrar}
        />
      )}
    </div>
  );
}

export function HojaCorteVisor({
  anotacionesUrl,
  src,
  tipoArchivo = "pdf",
  titulo,
  volverHref,
}: {
  /** Base de la API de anotaciones del documento (ej. /hojas-corte/<id>/anotaciones). */
  anotacionesUrl: string;
  src: string;
  /** "imagen" para planos en JPG/PNG/WEBP; por defecto PDF. */
  tipoArchivo?: "pdf" | "imagen";
  titulo: string;
  volverHref: string;
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [total, setTotal] = useState(0); // cantidad de páginas; 0 = todavía cargando
  const [error, setError] = useState<string | null>(null);
  const [aspect, setAspect] = useState(Math.SQRT2); // A4 hasta conocer la real
  const [ancho, setAncho] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [actual, setActual] = useState(1);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const scrollEl = useRef<HTMLDivElement | null>(null);
  const asignarScrollRoot = useCallback((el: HTMLDivElement | null) => {
    scrollEl.current = el;
    setScrollRoot(el);
  }, []);
  const zoomAnterior = useRef(1);
  const rafRef = useRef(0);

  // Anotaciones (dibujo / texto / notas del documento).
  const { anotaciones, crear, borrar, deshacer, puedeDeshacer } = useAnotaciones(anotacionesUrl, REFRESCO_ANOTACIONES_MS);
  const [edicion, setEdicion] = useState(false);
  const [herramienta, setHerramienta] = useState<Herramienta>("mover");
  const [color, setColor] = useState(paletaDe("lapiz")[0]);
  const [nivel, setNivel] = useState(1);
  const porPagina = useMemo(() => {
    const m = new Map<number, AnotacionPagina[]>();
    for (const a of anotaciones) {
      if (a.pagina === null) continue;
      const l = m.get(a.pagina) ?? [];
      l.push(a as AnotacionPagina);
      m.set(a.pagina, l);
    }
    return m;
  }, [anotaciones]);
  const notas = useMemo(() => anotaciones.filter((a): a is AnotacionNota => a.pagina === null), [anotaciones]);

  function elegirHerramienta(h: Herramienta) {
    setHerramienta(h);
    const paleta = paletaDe(h);
    if (!paleta.includes(color)) setColor(paleta[0]);
  }

  function alternarEdicion() {
    setEdicion((e) => !e);
    setHerramienta("mover");
  }

  // Carga del documento.
  useEffect(() => {
    let cancelled = false;
    let loadingTask: PDFDocumentLoadingTask | null = null;
    if (tipoArchivo === "imagen") {
      // Una imagen es un documento de una sola página: solo hace falta su proporción.
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        setAspect(img.naturalHeight / img.naturalWidth);
        setTotal(1);
      };
      img.onerror = () => {
        if (!cancelled) setError("No se pudo abrir el plano.");
      };
      img.src = src;
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      try {
        const pdfjs = await loadPdfjs();
        loadingTask = pdfjs.getDocument({ url: src });
        const task = loadingTask;
        const loaded = await task.promise;
        if (cancelled) {
          void task.destroy();
          return;
        }
        const first = await loaded.getPage(1);
        const vp = first.getViewport({ scale: 1 });
        setAspect(vp.height / vp.width);
        setPdf(loaded);
        setTotal(loaded.numPages);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("No se pudo abrir la hoja de corte.");
        }
      }
    })();
    return () => {
      cancelled = true;
      void loadingTask?.destroy();
    };
  }, [src, tipoArchivo]);

  // Ancho disponible (cambia al rotar la tablet).
  useEffect(() => {
    if (!scrollRoot) return;
    const medir = () => {
      const cs = getComputedStyle(scrollRoot);
      setAncho(Math.max(0, Math.floor(scrollRoot.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight))));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(scrollRoot);
    // Al aparecer las páginas aparece también la barra de scroll vertical y
    // clientWidth baja sin que cambie el tamaño externo (el observer no avisa).
    const t = setTimeout(medir, 0);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [scrollRoot, total]);

  // Al cambiar el zoom se conserva la posición relativa dentro del documento.
  useLayoutEffect(() => {
    const el = scrollEl.current;
    if (!el || zoomAnterior.current === zoom) return;
    const ratio = zoom / zoomAnterior.current;
    el.scrollTop *= ratio;
    el.scrollLeft = (el.scrollLeft + el.clientWidth / 2) * ratio - el.clientWidth / 2;
    zoomAnterior.current = zoom;
  }, [zoom]);

  const calcularActual = useCallback(() => {
    if (!scrollRoot) return;
    const corte = scrollRoot.scrollTop + scrollRoot.clientHeight / 3;
    const paginas = scrollRoot.querySelectorAll<HTMLElement>("[data-pagina]");
    let n = 1;
    for (const p of paginas) {
      if (p.offsetTop - scrollRoot.offsetTop <= corte) n = Number(p.dataset.pagina);
      else break;
    }
    setActual(n);
  }, [scrollRoot]);

  function onScroll() {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(calcularActual);
  }

  function irA(n: number) {
    if (!total || !scrollRoot || !Number.isFinite(n)) return;
    const pagina = Math.min(Math.max(1, Math.round(n)), total);
    const el = scrollRoot.querySelector<HTMLElement>(`[data-pagina="${pagina}"]`);
    if (el) scrollRoot.scrollTo({ top: el.offsetTop - scrollRoot.offsetTop - 12 });
    setActual(pagina);
  }

  const cambiarZoom = (z: number) => setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100)));
  const cssWidth = Math.round(ancho * zoom);

  return (
    <div className="flex h-dvh flex-col bg-muted">
      <header className="flex flex-wrap items-center gap-2 border-b bg-background px-3 py-2">
        <Link href={volverHref} className={buttonVariants({ variant: "outline", className: "h-11 px-4" })}>
          <ArrowLeftIcon /> Volver
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{titulo}</h1>

        <div className="flex items-center gap-1">
          <label htmlFor="visor-pagina" className="sr-only">
            Ir a la hoja
          </label>
          <input
            id="visor-pagina"
            key={actual}
            type="number"
            inputMode="numeric"
            min={1}
            max={total || 1}
            defaultValue={actual}
            disabled={!total}
            enterKeyHint="go"
            className="h-11 w-16 rounded-md border bg-background px-2 text-center"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              irA(Number(e.currentTarget.value));
              e.currentTarget.blur(); // contrae el teclado de la tablet
            }}
            onBlur={(e) => irA(Number(e.currentTarget.value))}
          />
          <span className="text-muted-foreground">/ {total || "—"}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="icon-lg" className="size-11"
            variant="outline"
            aria-label="Alejar"
            onClick={() => cambiarZoom(zoom - ZOOM_STEP)}
            disabled={zoom <= MIN_ZOOM}
          >
            <MinusIcon />
          </Button>
          <button
            type="button"
            className="h-11 w-16 rounded-md text-center tabular-nums hover:bg-accent"
            onClick={() => cambiarZoom(1)}
            title="Ajustar al ancho"
          >
            {Math.round(zoom * 100)}%
          </button>
          <Button
            size="icon-lg" className="size-11"
            variant="outline"
            aria-label="Acercar"
            onClick={() => cambiarZoom(zoom + ZOOM_STEP)}
            disabled={zoom >= MAX_ZOOM}
          >
            <PlusIcon />
          </Button>
          <Button size="icon-lg" className="size-11" variant="outline" aria-label="Ajustar al ancho" onClick={() => cambiarZoom(1)}>
            <ScanIcon />
          </Button>
        </div>

        <Button className="h-11 px-4" variant={edicion ? "default" : "outline"} aria-pressed={edicion} onClick={alternarEdicion}>
          <PencilIcon /> {edicion ? "Listo" : "Anotar"}
        </Button>
      </header>

      {edicion && (
        <BarraAnotaciones
          herramienta={herramienta}
          onHerramienta={elegirHerramienta}
          color={color}
          onColor={setColor}
          nivel={nivel}
          onNivel={setNivel}
          puedeDeshacer={puedeDeshacer}
          onDeshacer={deshacer}
        />
      )}
      <NotasDocumento
        notas={notas}
        edicion={edicion}
        onCrear={(texto) => void crear({ tipo: "TEXTO", pagina: null, datos: { texto } })}
        onBorrar={(id) => void borrar(id)}
      />

      <div ref={asignarScrollRoot} onScroll={onScroll} className="flex-1 overflow-auto p-3">
        {error ? (
          <p role="alert" className="mt-10 text-center text-destructive">
            {error}
          </p>
        ) : !total ? (
          <div className="mt-10 flex justify-center text-muted-foreground">
            <LoadingDots />
          </div>
        ) : (
          <div className="flex w-max min-w-full flex-col gap-3">
            {Array.from({ length: total }, (_, i) => (
              <Pagina
                key={i + 1}
                pdf={pdf}
                imagenSrc={tipoArchivo === "imagen" ? src : undefined}
                numero={i + 1}
                cssWidth={cssWidth}
                aspect={aspect}
                scrollRoot={scrollRoot}
                anotaciones={porPagina.get(i + 1) ?? SIN_ANOTACIONES}
                herramienta={edicion ? herramienta : "mover"}
                color={color}
                nivel={nivel}
                onCrear={(a) => void crear(a)}
                onBorrar={(id) => void borrar(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
