"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { cn } from "cn";
import { VolverLink } from "@/components/volver-link";
import type { Escena3D } from "../types/escena-pedido.types";

// Colores de los códigos de material de fábrica (promedio de las texturas de
// T:\datos\3d\E_50\4\Colores). Un código sin entrada usa el color de la pieza.
const COLOR_MATERIAL: Record<string, string> = {
  FSG: "#cac4b8",
  FGG: "#303030",
  "<5002>metall": "#9a9ea3",
  "esfera-gris-clara": "#f0f0f0", // tiradores
};
const COLOR_DEFECTO = "#d6d2c8";
const COLOR_PARED = "#d2d2d0";
const COLOR_SUELO = "#a89574";

function colorCaja(m: string, c: [number, number, number] | null): THREE.Color {
  const hex = COLOR_MATERIAL[m];
  if (hex) return new THREE.Color(hex);
  if (c && !(c[0] === 1 && c[1] === 1 && c[2] === 1)) return new THREE.Color(c[0], c[1], c[2]);
  return new THREE.Color(COLOR_DEFECTO);
}

// Arma los objetos three.js de una escena (se crean una vez por escena).
function construirGrupos(escena: Escena3D) {
  const porModulo = new Map<number, THREE.Group>();
  const modulos = new THREE.Group();
  const geoms: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];
  const matBorde = new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.45 });
  mats.push(matBorde);
  for (const c of escena.cajas) {
    const g = new THREE.BoxGeometry(c.s[0], c.s[1], c.s[2]);
    g.translate(c.s[0] / 2, c.s[1] / 2, c.s[2] / 2);
    geoms.push(g);
    const mat = new THREE.MeshLambertMaterial({ color: colorCaja(c.m, c.c) });
    mats.push(mat);
    const mesh = new THREE.Mesh(g, mat);
    const borde = new THREE.LineSegments(new THREE.EdgesGeometry(g), matBorde);
    geoms.push(borde.geometry);
    const obj = new THREE.Group();
    obj.add(mesh, borde);
    const r = c.r;
    obj.matrixAutoUpdate = false;
    obj.matrix.set(r[0], r[1], r[2], c.t[0], r[3], r[4], r[5], c.t[1], r[6], r[7], r[8], c.t[2], 0, 0, 0, 1);
    const id = c.mod ?? -1;
    let grupo = porModulo.get(id);
    if (!grupo) {
      grupo = new THREE.Group();
      porModulo.set(id, grupo);
      modulos.add(grupo);
    }
    grupo.add(obj);
  }

  // Suelo: el contorno sale de las paredes interiores (x, z).
  const entorno = new THREE.Group();
  if (escena.suelo.length >= 3) {
    const forma = new THREE.Shape(escena.suelo.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ShapeGeometry(forma);
    g.rotateX(-Math.PI / 2);
    geoms.push(g);
    const m = new THREE.MeshLambertMaterial({ color: COLOR_SUELO, side: THREE.DoubleSide });
    mats.push(m);
    entorno.add(new THREE.Mesh(g, m));
  }

  // Paredes: solo la cara interior, con su normal hacia el centro del cuarto
  // (cara simple: desde afuera se ve a través de ellas).
  const pared = new THREE.Group();
  const centro = new THREE.Vector3();
  if (escena.suelo.length) {
    for (const [x, z] of escena.suelo) centro.add(new THREE.Vector3(x, 0, z));
    centro.divideScalar(escena.suelo.length);
  }
  for (const w of escena.paredes) {
    if (w.lado !== "int") continue;
    const [a, b, c, d] = w.p.map((q) => new THREE.Vector3(q[0], q[1], q[2]));
    let tri = [a, b, c, a, c, d];
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    const medio = new THREE.Vector3().add(a).add(c).multiplyScalar(0.5);
    if (n.dot(new THREE.Vector3().subVectors(centro, medio)) < 0) tri = [a, c, b, a, d, c];
    const g = new THREE.BufferGeometry().setFromPoints(tri);
    g.computeVertexNormals();
    geoms.push(g);
    const m = new THREE.MeshLambertMaterial({ color: COLOR_PARED, side: THREE.FrontSide });
    mats.push(m);
    pared.add(new THREE.Mesh(g, m));
  }
  return { porModulo, modulos, entorno, pared, geoms, mats };
}

type Grupos = ReturnType<typeof construirGrupos>;

// Qué se ve: un módulo aislado, o la escena completa (con o sin paredes).
function aplicarVista(grupos: Grupos, seleccion: number | null, paredes: boolean) {
  for (const [id, g] of grupos.porModulo) g.visible = seleccion === null || id === seleccion;
  grupos.pared.visible = paredes && seleccion === null;
  grupos.entorno.visible = seleccion === null;
}

// Visor 3D de solo lectura de una escena de TeoWin (cámara orbital: arrastrar gira,
// rueda/pellizco acerca, dos dedos o botón derecho desplaza). Los módulos se pueden
// aislar desde la lista; las paredes (solo su cara interior, que se ve desde adentro)
// se pueden ocultar. v1: paneles y paredes; sin tiradores, herrajes ni ventanas.
export function EscenaVisor({
  escena,
  titulo,
  volverHref,
}: {
  escena: Escena3D;
  titulo: string;
  volverHref: string;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [seleccion, setSeleccion] = useState<number | null>(null); // idEscena aislado
  const [paredes, setParedes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useRef<{ encuadrar: (mod: number | null) => void; grupos: Grupos } | null>(null);


  // Escena three.js (se crea y se destruye con el componente).
  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const grupos = construirGrupos(escena);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      // Diferido: no se setea estado de forma síncrona dentro del efecto.
      const t = setTimeout(() => setError("Este dispositivo no permite mostrar gráficos 3D (WebGL)."), 0);
      return () => clearTimeout(t);
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xf4f2ef);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = "none";

    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 0.95));
    const sol = new THREE.DirectionalLight(0xffffff, 1.1);
    sol.position.set(-1500, 4000, 2500);
    scene.add(sol);
    scene.add(grupos.entorno, grupos.pared, grupos.modulos);

    const camera = new THREE.PerspectiveCamera(35, 1, 50, 100000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.screenSpacePanning = true;

    const dibujar = () => renderer.render(scene, camera);
    controls.addEventListener("change", dibujar);

    const ajustar = () => {
      const { clientWidth: w, clientHeight: h } = el;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      dibujar();
    };
    const ro = new ResizeObserver(ajustar);
    ro.observe(el);

    // Encuadra lo visible: un módulo aislado o toda la escena.
    const encuadrar = (mod: number | null) => {
      const caja = new THREE.Box3();
      const objetivo = mod !== null ? grupos.porModulo.get(mod) : undefined;
      if (objetivo) caja.setFromObject(objetivo);
      else {
        caja.setFromObject(grupos.modulos);
        if (grupos.pared.visible) caja.union(new THREE.Box3().setFromObject(grupos.pared));
        caja.union(new THREE.Box3().setFromObject(grupos.entorno));
      }
      if (caja.isEmpty()) return;
      const centro = caja.getCenter(new THREE.Vector3());
      const radio = caja.getSize(new THREE.Vector3()).length() / 2;
      const dist = radio / Math.sin((camera.fov * Math.PI) / 360);
      camera.position.copy(centro).add(new THREE.Vector3(0.45, 0.55, 1).normalize().multiplyScalar(dist));
      controls.target.copy(centro);
      camera.near = Math.max(dist / 200, 1);
      camera.far = dist * 20;
      camera.updateProjectionMatrix();
      controls.update();
      dibujar();
    };
    api.current = { encuadrar, grupos };
    ajustar();
    encuadrar(null);

    return () => {
      api.current = null;
      grupos.geoms.forEach((g) => g.dispose());
      grupos.mats.forEach((m) => m.dispose());
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [escena]);

  // Aislar módulo / ocultar paredes.
  useEffect(() => {
    const actual = api.current;
    if (!actual) return;
    aplicarVista(actual.grupos, seleccion, paredes);
    actual.encuadrar(seleccion);
  }, [seleccion, paredes, escena]);

  return (
    <div className="flex h-dvh w-full flex-col bg-background">
      <header className="flex flex-wrap items-center gap-3 border-b px-4 py-2">
        <VolverLink href={volverHref} grande />
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{titulo}</h1>
        <label className="flex h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={paredes}
            disabled={seleccion !== null}
            onChange={(e) => setParedes(e.target.checked)}
            className="size-5"
          />
          Paredes
        </label>
        <button
          type="button"
          onClick={() => api.current?.encuadrar(seleccion)}
          className="h-11 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted"
        >
          Reencuadrar
        </button>
      </header>

      <div className="flex min-h-0 flex-1 max-md:flex-col">
        <div ref={contenedor} className="relative min-h-0 min-w-0 flex-1">
          {error && <p className="p-6 text-center text-sm text-destructive">{error}</p>}
        </div>
        <aside className="flex shrink-0 gap-2 overflow-auto border-t p-3 md:w-64 md:flex-col md:border-t-0 md:border-l">
          <p className="hidden text-sm font-medium md:block">Módulos</p>
          <button
            type="button"
            onClick={() => setSeleccion(null)}
            className={cn(
              "h-11 shrink-0 rounded-lg border px-3 text-left text-sm font-medium",
              seleccion === null ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            Escena completa
          </button>
          {escena.modulos.map((m) => (
            <button
              key={m.idEscena}
              type="button"
              onClick={() => setSeleccion(m.idEscena)}
              className={cn(
                "flex min-h-11 shrink-0 flex-col justify-center rounded-lg border px-3 py-1 text-left text-sm",
                seleccion === m.idEscena ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              <span className="font-medium">
                Módulo {m.idEscena} — {m.nombre}
              </span>
              <span className={cn("text-xs", seleccion === m.idEscena ? "opacity-80" : "text-muted-foreground")}>
                {m.familia} · {Math.round(m.dim[0])} × {Math.round(m.dim[1])} × {Math.round(m.dim[2])}
              </span>
            </button>
          ))}
          <p className="hidden text-xs text-muted-foreground md:block">
            Vista de solo lectura. Arrastrá para girar, rueda o pellizco para acercar, dos dedos para desplazar.
          </p>
        </aside>
      </div>
    </div>
  );
}
