"use client";

import { useRef, useState } from "react";
import type { AnotacionPagina, Herramienta, NuevaAnotacion } from "../types/anotacion.types";

// Grosores como fracción del ancho de la página (así se ven igual en cualquier
// zoom o dispositivo). Índice = fino / medio / grueso.
export const GROSORES_LAPIZ = [0.002, 0.004, 0.008];
export const GROSORES_RESALTADOR = [0.012, 0.02, 0.03];
export const TAMANOS_TEXTO = [0.014, 0.02, 0.03];

// Distancia mínima (normalizada) entre puntos de un trazo: evita guardar miles
// de puntos casi iguales.
const MIN_DIST = 0.0012;

export function CapaAnotaciones({
  pagina,
  cssWidth,
  cssHeight,
  anotaciones,
  herramienta,
  color,
  nivel,
  onCrear,
  onBorrar,
}: {
  pagina: number;
  cssWidth: number;
  cssHeight: number;
  anotaciones: AnotacionPagina[];
  herramienta: Herramienta;
  color: string;
  /** 0 = fino, 1 = medio, 2 = grueso. */
  nivel: number;
  onCrear: (a: NuevaAnotacion) => void;
  onBorrar: (id: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const trazo = useRef<[number, number][] | null>(null);
  const [trazoVivo, setTrazoVivo] = useState<[number, number][] | null>(null);
  const [editorTexto, setEditorTexto] = useState<{ x: number; y: number } | null>(null);
  const textoConfirmado = useRef(false);

  const dibuja = herramienta === "lapiz" || herramienta === "resaltador";
  const interactiva = dibuja || herramienta === "texto";
  const resaltador = herramienta === "resaltador";
  const grosor = (resaltador ? GROSORES_RESALTADOR : GROSORES_LAPIZ)[nivel];

  function punto(e: React.PointerEvent): [number, number] {
    const r = svgRef.current!.getBoundingClientRect();
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    return [
      Math.round(clamp((e.clientX - r.left) / r.width) * 10000) / 10000,
      Math.round(clamp((e.clientY - r.top) / r.height) * 10000) / 10000,
    ];
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!interactiva || (e.pointerType === "mouse" && e.button !== 0)) return;
    if (dibuja) {
      e.currentTarget.setPointerCapture(e.pointerId);
      trazo.current = [punto(e)];
      setTrazoVivo(trazo.current);
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const actual = trazo.current;
    if (!actual) return;
    const [x, y] = punto(e);
    const [lx, ly] = actual[actual.length - 1];
    if (Math.hypot(x - lx, (y - ly) * (cssHeight / cssWidth)) < MIN_DIST) return;
    if (actual.length >= 3000) return;
    actual.push([x, y]);
    setTrazoVivo([...actual]);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (dibuja && trazo.current) {
      const puntos = trazo.current;
      trazo.current = null;
      setTrazoVivo(null);
      onCrear({
        tipo: "DIBUJO",
        pagina,
        datos: { puntos, grosor, color, resaltador },
      });
    } else if (herramienta === "texto") {
      const [x, y] = punto(e);
      textoConfirmado.current = false;
      setEditorTexto({ x, y });
    }
  }

  function confirmarTexto(valor: string) {
    if (textoConfirmado.current || !editorTexto) return;
    textoConfirmado.current = true;
    const texto = valor.trim();
    if (texto) {
      onCrear({
        tipo: "TEXTO",
        pagina,
        datos: { x: editorTexto.x, y: editorTexto.y, texto, tamano: TAMANOS_TEXTO[nivel], color },
      });
    }
    setEditorTexto(null);
  }

  const px = (v: number) => v * cssWidth;
  const py = (v: number) => v * cssHeight;
  const cursor = dibuja ? "crosshair" : herramienta === "texto" ? "text" : "default";
  const tamanoEditor = TAMANOS_TEXTO[nivel] * cssWidth;

  return (
    <>
      <svg
        ref={svgRef}
        width={cssWidth}
        height={cssHeight}
        viewBox={`0 0 ${cssWidth} ${cssHeight}`}
        className="absolute inset-0"
        style={{
          pointerEvents: interactiva ? "auto" : "none",
          // Con lápiz/resaltador el dedo dibuja (no scrollea); con texto sí puede scrollear.
          touchAction: dibuja ? "none" : "pan-x pan-y",
          cursor,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          trazo.current = null;
          setTrazoVivo(null);
        }}
      >
        {anotaciones.map((a) => {
          const borrable = herramienta === "borrador";
          const pe = borrable ? "all" : "none";
          if (a.tipo === "DIBUJO") {
            const pts = a.datos.puntos.map(([x, y]) => `${px(x)},${py(y)}`).join(" ");
            const w = Math.max(a.datos.grosor * cssWidth, 1);
            return (
              <g key={a.id} style={{ pointerEvents: pe }} onPointerDown={borrable ? () => onBorrar(a.id) : undefined}>
                {/* Zona de toque más ancha para poder borrar con el dedo. */}
                {borrable && (
                  <polyline points={pts} fill="none" stroke="transparent" strokeWidth={Math.max(w, 28)} strokeLinecap="round" />
                )}
                <polyline
                  points={a.datos.puntos.length === 1 ? `${pts} ${pts}` : pts}
                  fill="none"
                  stroke={a.datos.color}
                  strokeWidth={w}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={a.datos.resaltador ? 0.5 : 1}
                  style={a.datos.resaltador ? { mixBlendMode: "multiply" } : undefined}
                />
              </g>
            );
          }
                    const fs = a.datos.tamano * cssWidth;
          return (
            <text
              key={a.id}
              x={px(a.datos.x)}
              y={py(a.datos.y)}
              fontSize={fs}
              fill={a.datos.color}
              stroke="#fff"
              strokeWidth={fs * 0.22}
              strokeLinejoin="round"
              paintOrder="stroke"
              fontWeight={600}
              dominantBaseline="hanging"
              style={{ pointerEvents: pe, cursor: borrable ? "pointer" : undefined }}
              onPointerDown={borrable ? () => onBorrar(a.id) : undefined}
            >
              {a.datos.texto}
            </text>
          );
        })}

        {trazoVivo && (
          <polyline
            points={(trazoVivo.length === 1 ? [trazoVivo[0], trazoVivo[0]] : trazoVivo)
              .map(([x, y]) => `${px(x)},${py(y)}`)
              .join(" ")}
            fill="none"
            stroke={color}
            strokeWidth={Math.max(grosor * cssWidth, 1)}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={resaltador ? 0.5 : 1}
            style={resaltador ? { mixBlendMode: "multiply" } : undefined}
          />
        )}
      </svg>

      {editorTexto && (
        <input
          // Foco diferido: en tablets el toque genera eventos de mouse sintéticos que le roban el foco.
          ref={(el) => {
            if (el) setTimeout(() => el.focus(), 60);
          }}
          maxLength={500}
          enterKeyHint="done"
          placeholder="Texto…"
          className="absolute z-10 min-w-40 rounded border border-primary bg-white/90 px-1 font-semibold outline-none"
          style={{
            left: px(editorTexto.x),
            top: py(editorTexto.y),
            fontSize: Math.max(tamanoEditor, 14),
            color,
            maxWidth: cssWidth - px(editorTexto.x),
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmarTexto(e.currentTarget.value);
            if (e.key === "Escape") {
              textoConfirmado.current = true;
              setEditorTexto(null);
            }
          }}
          onBlur={(e) => confirmarTexto(e.currentTarget.value)}
        />
      )}
    </>
  );
}
