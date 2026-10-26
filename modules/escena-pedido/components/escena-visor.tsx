"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { cn } from "cn";
import { VolverLink } from "@/components/volver-link";
import type { AnimacionEscena, Escena3D } from "../types/escena-pedido.types";

// Colores de los códigos de material de fábrica (promedio de las texturas del catálogo 4). Se usan
// mientras carga la textura real, o si esa textura no está disponible.
const COLOR_MATERIAL: Record<string, string> = {
  FSG: "#cac4b8",
  FGG: "#303030",
  FSN: "#938c85",
  FBLA: "#f2f2f0",
  E: "#c3c3c3",
  ERDAT: "#7f6851",
  AA: "#b4b3b3",
  "<5002>metall": "#9a9ea3",
  "esfera-gris-clara": "#f0f0f0", // tiradores
  // Encimeras, vidrios y metales de las cocinas (catálogos 636, 637, 658): respaldo si falta la textura.
  ICONIW: "#f4f4f2",
  GRPE: "#d8d4cc",
  ESPEJO: "#b4c3de",
  VIDRIO: "#b4c3de",
  TRANSPA: "#c8d4e4",
  VIMAT: "#d8dde4",
  esfera1: "#c9ccd0",
  esfera2: "#b8bcc2",
  "esfera-gris": "#b8bcc2",
  brillonegro3: "#1a1a1a",
  enci: "#3a3a3c", // marcador de encimera sin material declarado en la escena
};
// Los códigos de color se repiten entre catálogos con otra textura (83 códigos están en Placares y en Cocinas: ERDAT, EGM,
// PBM, PG, PM… difieren), por eso las cocinas tienen su propia tabla: promedio de `3/Colores/<código>.jpg` de TeoWin
// (melaminas F…, termolaminados P… como PMA/PG/PBM/PRG/PNS/PHG/PNM/BB, vidrios V… como VBR/VT/VGT, cantos y metales). Los
// blancos puros se muestran como #f2f2f0 (igual que FBLA en Placares) para que no ardan con la luz ambiente. Se busca primero
// por el catálogo de la pieza y, si no está, en la tabla general de arriba.
const COLOR_MATERIAL_CAT: Record<string, Record<string, string>> = {
  "3": {
    AA: "#b3b3b2", AC: "#a0a0a3", B: "#f2f2f0", BB: "#fafcfb", BBLA: "#f2f2f0", BGG: "#4c5051", BR: "#ba9256",
    CHA: "#726040", COB: "#c28058", CR: "#a9aaa7", E: "#c3c3c3", EBR: "#9c7852", EE: "#e6e7df", EGM: "#848683",
    EGP: "#c1c0bc", EN: "#030408", ENH: "#5a3e3b", ENV: "#07080a", ERA: "#c49d96", ERDAT: "#866c58",
    ERDMT: "#887663", ERTN: "#1f1613", FAM: "#cfcdc0", FBLA: "#f2f2f0", FBLAN: "#c2ad8f", FC: "#e5e6e0",
    FCAJ: "#c2ad8f", FCAM: "#d0b69a", FCARAS: "#604f40", FEV: "#f2f2f0", FGC: "#c0bdb6", FGG: "#303030",
    FGT: "#b1a79d", FJADE: "#9aab98", FLB: "#efedf0", FLT: "#6e6256", FMER: "#4c3c35", FN: "#050306",
    FNM: "#866045", FNT: "#855d33", FOF: "#b58259", FPET: "#886c3e", FS: "#beb1a0", FSAF: "#64664e",
    FSC: "#a98d70", FSG: "#cac4b8", FSN: "#938c85", FT: "#867666", FTER: "#875d44", FTU: "#022831",
    FV: "#e3e3e5", GC: "#c1c1c1", GO: "#555555", MP: "#bdbdbc", MWEN: "#2e160d", NA: "#d3c4a7", NE: "#0b0a09",
    NMC: "#2c2c2c", NN: "#000000", NO: "#343839", OX: "#86745b", PBB: "#e1e1e1", PBM: "#f2f2f0", PC: "#9b7b6e",
    PG: "#4b4b4b", PHG: "#56615d", PM: "#9e775b", PMA: "#c3b6a6", PNM: "#191919", PNS: "#564939",
    PRG: "#747869", PTR: "#663831", RBE: "#f2f2f0", RVEN: "#d4d2d0", SCAP: "#afa6a1", SGUA: "#866e47",
    SPET: "#725c35", STER: "#6f5240", VAC: "#cccfd4", VB: "#f2f2f0", VBR: "#9c7852", VCH: "#3d2519",
    VGO: "#232323", VGT: "#232323", VMB: "#6f452d", VMI: "#8d8e8c", VN: "#d3c4a7", VNE: "#050704",
    VO: "#c3cfc9", VT: "#9ad9ea", VTE: "#bf671e", VTEO: "#bc7643", VV: "#826e67", L001: "#f2f2f0",
    L043: "#aea9a3", L044: "#a4a39f", L046: "#575759", L047: "#000000", brillometal3: "#ababab",
    horno1: "#57686b", "009-metal": "#585136",
  },
  // Encimeras (636): el código llega como "<636>BNO" (material por defecto de la escena, `hdrDataLin <636 EN;…>`).
  "636": {
    BNO: "#dddeda",
    MACK: "#1e2126",
    ICONIW: "#fcfbfa",
    MIAMIW: "#f1f2f6",
    GRPE: "#b6b2b2",
    AZBE: "#82797e",
    BIAVAG: "#e0dfdb",
    ETDUSK: "#d2d2d4",
    VK01: "#cdc6c1",
  },
};
const COLOR_DEFECTO = "#d6d2c8";

// Escenas guardadas con una versión vieja del intérprete (< 30) no traen el catálogo de las piezas que son del de su mueble
// ni, a veces, el del mueble: solo en ese caso se supone Placares. El intérprete actual siempre lo declara.
const CAT_DEFECTO = "4";
const COLOR_PARED = "#d2d2d0";
const COLOR_SUELO = "#d9d9d9"; // piso sin material: TeoWin lo muestra gris claro

// Las texturas se repiten por medida real: una textura de muebles cubre 1200 mm, una de
// decoración (piso, papel pintado) 1000 mm.
const TILE_MUEBLE_MM = 1200;
const TILE_DECO_MM = 1000;

// Las juntas se marcan solo en baldosas chicas (cerámicos); un revestimiento de 1500 o 2500 mm se ve continuo, como en TeoWin.
const TILE_JUNTAS_MAX_MM = 600;

const DURACION_MS = 550;

// "<636>BNO" = código BNO del catálogo 636 (el prefijo `<n>` solo vale si ese catálogo tiene tabla; si no, se ignora).
const PREFIJO_CATALOGO = /^<(\d+)>(.+)$/;
function colorMaterial(cat: string, m: string): string | undefined {
  const p = PREFIJO_CATALOGO.exec(m);
  const codigo = p ? p[2] : m;
  const catalogo = p && COLOR_MATERIAL_CAT[p[1]] ? p[1] : cat;
  return COLOR_MATERIAL_CAT[catalogo]?.[codigo] ?? COLOR_MATERIAL[codigo] ?? COLOR_MATERIAL[m];
}

function colorCaja(cat: string, m: string, c: [number, number, number] | null): THREE.Color {
  const hex = colorMaterial(cat, m);
  if (hex) return new THREE.Color(hex);
  if (c && !(c[0] === 1 && c[1] === 1 && c[2] === 1)) return new THREE.Color(c[0], c[1], c[2]);
  return new THREE.Color(COLOR_DEFECTO);
}

export const urlTextura = (clave: string) => {
  const i = clave.indexOf("/");
  return `/texturas-3d/${clave.slice(0, i)}/${encodeURIComponent(clave.slice(i + 1))}`;
};

// UV de una caja en milímetros: cada cara repite la textura según su medida real (1200 mm por baldosa en ambos ejes).
// Las imágenes de los tableros tienen la veta a lo largo del eje v. `veta` (eje local de la caja: 0 = L, 1 = H, 2 = P) dice por dónde
// debe correr la veta de la pieza (marca orient/texV de TeoWin): en las caras cuyo eje u es ese eje se intercambian u y v (la veta pasa a
// correr por u); en las que ya lo tienen en v, o no contienen ese eje, queda igual. Sin `veta` el resultado es el de siempre.
// Caras de BoxGeometry: +x, -x (u = P, v = H), +y, -y (u = L, v = P), +z, -z (u = L, v = H).
function escalarUvCaja(g: THREE.BoxGeometry, l: number, h: number, p: number, tile: number, veta?: 0 | 1 | 2) {
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const dims = [
    [p, h],
    [p, h],
    [l, p],
    [l, p],
    [l, h],
    [l, h],
  ];
  const ejeU = [2, 2, 0, 0, 0, 0];
  for (let f = 0; f < 6; f++) {
    const girar = veta !== undefined && ejeU[f] === veta;
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      const u = (uv.getX(i) * dims[f][0]) / tile;
      const v = (uv.getY(i) * dims[f][1]) / tile;
      if (girar) uv.setXY(i, v, u);
      else uv.setXY(i, u, v);
    }
  }
  uv.needsUpdate = true;
}

// Copia de la textura de una baldosa con las juntas (línea oscura en el borde), como las dibuja TeoWin.
function texturaConJuntas(tex: THREE.Texture, lista: THREE.Texture[]): THREE.Texture {
  const img = tex.image as CanvasImageSource & { width: number; height: number };
  const lado = 512;
  const cv = document.createElement("canvas");
  cv.width = cv.height = lado;
  const ctx = cv.getContext("2d");
  if (!ctx) return tex;
  ctx.drawImage(img, 0, 0, lado, lado);
  ctx.strokeStyle = "#1c1c1c";
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, lado, lado);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = tex.anisotropy;
  lista.push(t);
  return t;
}

/**
 * ¿Es un módulo de producción (se lista y se puede aislar)? Cocinas (catálogo 3), placares (4) y los catálogos comerciales
 * (6 dígitos, ej. 100242). El resto es decoración y equipamiento de la escena (lámparas 652/507, electrodomésticos 637,
 * ventanas y puertas de paso, encimeras 636…): se siguen dibujando en la escena completa, pero no son un mueble a fabricar.
 * Se decide por el catálogo del módulo, así vale también para las escenas guardadas con versiones viejas del intérprete.
 */
function esModuloDeProduccion(m: { catalogo: string }): boolean {
  return m.catalogo === "3" || m.catalogo === "4" || /^\d{6,}$/.test(m.catalogo);
}

/** Pieza de la mesada: contorno o losa del catálogo 636, o trozo reconstruido (`<636>MAT` / `enci`). */
function esMesada(p: { k?: string; m: string }): boolean {
  return p.k === "636" || p.m === "enci" || p.m.startsWith("<636>");
}

type MatVisor = THREE.MeshLambertMaterial | THREE.MeshBasicMaterial | THREE.MeshMatcapMaterial;

interface Animable {
  grupo: THREE.Group;
  def: AnimacionEscena;
  /** Avance actual y objetivo, de 0 (cerrado) a 1 (abierto). */
  t: number;
  objetivo: number;
}

// Arma los objetos three.js de una escena (se crean una vez por escena).
function construirGrupos(escena: Escena3D) {
  const catalogoDe = new Map(escena.modulos.map((m) => [m.idEscena, m.catalogo]));
  const porModulo = new Map<number, THREE.Group>();
  const modulos = new THREE.Group();
  const geoms: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];
  /** Piezas de la mesada (se pueden ocultar). */
  const mesadas: THREE.Object3D[] = [];
  /** Materiales que esperan una textura, por clave "catálogo/código". */
  const porClave = new Map<string, MatVisor[]>();
  const cacheMat = new Map<string, MatVisor>();
  const matDe = (clave: string | null, color: THREE.Color, doble = false, rejilla = false, opacidad = 1, sinLuz = false) => {
    const k = `${clave ?? ""}|${color.getHexString()}|${doble}|${rejilla}|${opacidad}|${sinLuz}`;
    let m = cacheMat.get(k);
    if (!m) {
      const params = {
        color,
        side: doble || opacidad < 1 ? THREE.DoubleSide : THREE.FrontSide,
        ...(opacidad < 1 ? { transparent: true, opacity: opacidad, depthWrite: false } : {}),
      };
      // Los materiales `esfera…` son la foto de una bola cromada (matcap), no una textura que se repite.
      m = sinLuz
        ? new THREE.MeshBasicMaterial(params)
        : clave && /\/esfera/i.test(clave)
          ? new THREE.MeshMatcapMaterial(params)
          : new THREE.MeshLambertMaterial(params);
      // Revestimiento de baldosas: la textura entera cubre una baldosa y se marcan las juntas.
      if (rejilla) m.userData.rejilla = true;
      cacheMat.set(k, m);
      mats.push(m);
      if (clave) porClave.set(clave, [...(porClave.get(clave) ?? []), m]);
    }
    return m;
  };

  const matBorde = new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.45 });
  mats.push(matBorde);

  // Un grupo por cajón / hoja corrediza: se desplaza como un todo.
  const anims: Animable[] = escena.animaciones.map((def) => {
    const grupo = new THREE.Group();
    if (def.tipo === "giro") grupo.matrixAutoUpdate = false;
    return { grupo, def, t: 0, objetivo: 0 };
  });
  const animAgregado = new Set<number>();
  // Hojas guardadas abiertas en el .3d: se muestran cerradas desde el principio.
  for (const a of anims) {
    const ini = a.def.ini;
    if (ini && a.def.tipo !== "giro") a.grupo.position.set(a.def.eje[0] * ini, a.def.eje[1] * ini, a.def.eje[2] * ini);
  }

  for (const c of escena.cajas) {
    const g = new THREE.BoxGeometry(c.s[0], c.s[1], c.s[2]);
    g.translate(c.s[0] / 2, c.s[1] / 2, c.s[2] / 2);
    // Una foto de paisaje (PSJ) cubre la cara una sola vez; el resto repite la textura por medida real.
    if (c.p !== 1) escalarUvCaja(g, c.s[0], c.s[1], c.s[2], TILE_MUEBLE_MM, c.v);
    geoms.push(g);
    const cat = c.k ?? catalogoDe.get(c.mod ?? -1) ?? CAT_DEFECTO;
    const mat = matDe(c.m ? `${cat}/${c.m}` : null, colorCaja(cat, c.m, c.c), false, false, c.o ?? 1, c.p === 1);
    const mesh = new THREE.Mesh(g, mat);
    if (c.a !== undefined) mesh.userData.anim = c.a;
    const borde = new THREE.LineSegments(new THREE.EdgesGeometry(g), matBorde);
    geoms.push(borde.geometry);
    const obj = new THREE.Group();
    obj.add(mesh, borde);
    if (esMesada(c)) mesadas.push(obj);
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
    const anim = c.a !== undefined ? anims[c.a] : undefined;
    if (anim) {
      if (!animAgregado.has(c.a!)) {
        animAgregado.add(c.a!);
        grupo.add(anim.grupo);
      }
      anim.grupo.add(obj);
    } else grupo.add(obj);
  }

  // Mallas de triángulos (cortinas, barandas, tubos, vidrios…): doble cara, con los UV del .3d.
  for (const mm of escena.mallas ?? []) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(mm.v, 3));
    if (mm.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(mm.uv, 2));
    g.setIndex(mm.i);
    // Piezas chicas (cajas, tubos) con aristas vivas; las grandes (cortinas) con normales suavizadas.
    const liso = mm.v.length / 3 > 120;
    const geo = liso ? g : g.toNonIndexed();
    if (!liso) g.dispose();
    geo.computeVertexNormals();
    geoms.push(geo);
    const cat = mm.k ?? catalogoDe.get(mm.mod ?? -1) ?? CAT_DEFECTO;
    const mat = matDe(mm.m ? `${cat}/${mm.m}` : null, colorCaja(cat, mm.m, mm.c), true, false, mm.o ?? 1, mm.e === 1);
    const mesh = new THREE.Mesh(geo, mat);
    if (mm.a !== undefined) mesh.userData.anim = mm.a;
    const obj = new THREE.Group();
    obj.add(mesh);
    if (esMesada(mm)) mesadas.push(obj);
    const r = mm.r;
    obj.matrixAutoUpdate = false;
    obj.matrix.set(r[0], r[1], r[2], mm.t[0], r[3], r[4], r[5], mm.t[1], r[6], r[7], r[8], mm.t[2], 0, 0, 0, 1);
    const id = mm.mod ?? -1;
    let grupo = porModulo.get(id);
    if (!grupo) {
      grupo = new THREE.Group();
      porModulo.set(id, grupo);
      modulos.add(grupo);
    }
    const anim = mm.a !== undefined ? anims[mm.a] : undefined;
    if (anim) {
      if (!animAgregado.has(mm.a!)) {
        animAgregado.add(mm.a!);
        grupo.add(anim.grupo);
      }
      anim.grupo.add(obj);
    } else grupo.add(obj);
  }

  // Suelo: el contorno sale de las paredes interiores (x, z).
  const entorno = new THREE.Group();
  if (escena.suelo.length >= 3) {
    const forma = new THREE.Shape(escena.suelo.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ShapeGeometry(forma);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const tileSuelo = escena.sueloTile ?? [TILE_DECO_MM, TILE_DECO_MM];
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / tileSuelo[0], uv.getY(i) / tileSuelo[1]);
    g.rotateX(-Math.PI / 2);
    geoms.push(g);
    const clave = escena.materialSuelo ? `641/${escena.materialSuelo}` : null;
    entorno.add(new THREE.Mesh(g, matDe(clave, new THREE.Color(COLOR_SUELO), true, !!clave && !!escena.sueloTile && escena.sueloTile[0] <= TILE_JUNTAS_MAX_MM)));
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
    const e1 = new THREE.Vector3().subVectors(b, a).normalize();
    const e2 = new THREE.Vector3().subVectors(d, a).normalize();
    const ancho = a.distanceTo(b);
    const alto = a.distanceTo(d);
    // Triángulos de la cara: un rectángulo, o el rectángulo con huecos (puertas de paso).
    let tri: THREE.Vector3[];
    if (w.h?.length) {
      const en3d = (u: number, v: number) => a.clone().addScaledVector(e1, u).addScaledVector(e2, v);
      // Un hueco que toca el piso es una muesca del contorno; los demás, agujeros.
      const huecos = [...w.h].sort((p, q) => p[0] - q[0]);
      const forma = new THREE.Shape();
      forma.moveTo(0, 0);
      for (const [x0, y0, x1, y1] of huecos) {
        if (y0 <= 0.5) forma.lineTo(x0, 0).lineTo(x0, y1).lineTo(x1, y1).lineTo(x1, 0);
      }
      forma.lineTo(ancho, 0).lineTo(ancho, alto).lineTo(0, alto).lineTo(0, 0);
      for (const [x0, y0, x1, y1] of huecos) {
        if (y0 > 0.5) {
          const agujero = new THREE.Path();
          agujero.moveTo(x0, y0).lineTo(x1, y0).lineTo(x1, y1).lineTo(x0, y1).lineTo(x0, y0);
          forma.holes.push(agujero);
        }
      }
      const sg = new THREE.ShapeGeometry(forma);
      const pos = sg.attributes.position as THREE.BufferAttribute;
      const idx = sg.index ? Array.from(sg.index.array) : Array.from({ length: pos.count }, (_, i) => i);
      tri = idx.map((i) => en3d(pos.getX(i), pos.getY(i)));
      sg.dispose();
    } else tri = [a, b, c, a, c, d];
    // Cara simple: la normal tiene que apuntar al centro del cuarto.
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    const medio = new THREE.Vector3().add(a).add(c).multiplyScalar(0.5);
    if (n.dot(new THREE.Vector3().subVectors(centro, medio)) < 0) {
      const inv: THREE.Vector3[] = [];
      for (let i = 0; i < tri.length; i += 3) inv.push(tri[i], tri[i + 2], tri[i + 1]);
      tri = inv;
    }
    const g = new THREE.BufferGeometry().setFromPoints(tri);
    g.computeVertexNormals();
    // UV por medida real sobre el plano de la pared.
    g.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(
        tri.flatMap((v) => {
          const rel = new THREE.Vector3().subVectors(v, a);
          return [rel.dot(e1) / (w.t?.[0] ?? TILE_DECO_MM), rel.dot(e2) / (w.t?.[1] ?? TILE_DECO_MM)];
        }),
        2,
      ),
    );
    geoms.push(g);
    pared.add(new THREE.Mesh(g, matDe(w.m ? `641/${w.m}` : null, new THREE.Color(COLOR_PARED), w.d === 1, !!w.m && !!w.t && w.t[0] <= TILE_JUNTAS_MAX_MM)));
  }
  return { porModulo, modulos, entorno, pared, anims, porClave, geoms, mats, mesadas };
}

type Grupos = ReturnType<typeof construirGrupos>;

// Qué se ve: un módulo aislado, o la escena completa (con o sin paredes).
function aplicarVista(grupos: Grupos, seleccion: number | null, paredes: boolean, mesadas: boolean) {
  for (const [id, g] of grupos.porModulo) g.visible = seleccion === null || id === seleccion;
  for (const o of grupos.mesadas) o.visible = mesadas;
  grupos.pared.visible = paredes && seleccion === null;
  grupos.entorno.visible = seleccion === null;
}

const suavizar = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/** Avanza las animaciones `dt` ms; devuelve true si alguna sigue en movimiento. */
function avanzarAnimaciones(grupos: Grupos, dt: number): boolean {
  let activo = false;
  for (const a of grupos.anims) {
    if (a.t === a.objetivo) continue;
    const paso = dt / DURACION_MS;
    a.t = a.objetivo > a.t ? Math.min(a.objetivo, a.t + paso) : Math.max(a.objetivo, a.t - paso);
    const ini = a.def.ini ?? 0;
    const k = ini + (a.def.dist - ini) * suavizar(a.t);
    if (a.def.tipo === "giro" && a.def.pivote) {
      // Puerta con bisagra: gira k grados sobre el eje que pasa por el pivote.
      const [px, py, pz] = a.def.pivote;
      const eje = new THREE.Vector3(...a.def.eje).normalize();
      a.grupo.matrix
        .makeTranslation(px, py, pz)
        .multiply(new THREE.Matrix4().makeRotationAxis(eje, (k * Math.PI) / 180))
        .multiply(new THREE.Matrix4().makeTranslation(-px, -py, -pz));
      a.grupo.matrixWorldNeedsUpdate = true;
    } else a.grupo.position.set(a.def.eje[0] * k, a.def.eje[1] * k, a.def.eje[2] * k);
    if (a.t !== a.objetivo) activo = true;
  }
  return activo;
}

function fijarObjetivos(grupos: Grupos, indices: number[], abrir: (i: number) => boolean) {
  for (const i of indices) {
    const a = grupos.anims[i];
    if (a) a.objetivo = abrir(i) ? 1 : 0;
  }
}

const visibleEnCadena = (o: THREE.Object3D | null) => {
  for (let x = o; x; x = x.parent) if (!x.visible) return false;
  return true;
};

interface Api {
  encuadrar: (mod: number | null, frontal?: boolean) => void;
  grupos: Grupos;
  mover: (indices: number[], abrir: (i: number) => boolean) => void;
  alternar: (i: number) => void;
  dibujar: () => void;
}

// Visor 3D de solo lectura de una escena de TeoWin (cámara orbital: arrastrar gira,
// rueda/pellizco acerca, dos dedos o botón derecho desplaza). Los módulos se pueden
// aislar desde la lista; las paredes (solo su cara interior, que se ve desde adentro)
// se pueden ocultar. Los cajones y las hojas corredizas se abren (botones, o tocando la pieza).
// Los materiales se muestran con su textura real; mientras cargan, con su color medio.
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
  const [mesadas, setMesadas] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useRef<Api | null>(null);
  // Hoja de puerta abierta: 0 = todas cerradas, n = se abrió la hoja n.
  const [puertaAbierta, setPuertaAbierta] = useState(0);
  const [cajonesAbiertos, setCajonesAbiertos] = useState(false);
  const [batientesAbiertas, setBatientesAbiertas] = useState(false);

  const puertas = useMemo(
    () => escena.animaciones.flatMap((a, i) => (a.tipo === "puerta" ? [i] : [])),
    [escena.animaciones],
  );
  const batientes = useMemo(
    () => escena.animaciones.flatMap((a, i) => (a.tipo === "giro" ? [i] : [])),
    [escena.animaciones],
  );
  const hayMesadas = useMemo(() => escena.cajas.some(esMesada) || (escena.mallas ?? []).some(esMesada), [escena]);
  // Solo los módulos de producción (cocinas, placares): lámparas, electrodomésticos, ventanas… se dibujan pero no se listan.
  const modulosListados = useMemo(() => escena.modulos.filter(esModuloDeProduccion), [escena.modulos]);
  const cajones = useMemo(
    () => escena.animaciones.flatMap((a, i) => (a.tipo === "cajon" ? [i] : [])),
    [escena.animaciones],
  );

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
    scene.add(new THREE.AmbientLight(0xffffff, 2.3));
    const sol = new THREE.DirectionalLight(0xffffff, 0.8);
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
    const encuadrar = (mod: number | null, frontal = false) => {
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
      // Un módulo aislado se mira de frente (su +Z local, rotado en la escena), un poco de costado y desde arriba.
      const m = mod !== null ? escena.modulos.find((x) => x.idEscena === mod) : undefined;
      const f = m ? new THREE.Vector3(m.frente[0], 0, m.frente[2]) : new THREE.Vector3(0, 0, 1);
      if (f.lengthSq() < 0.01) f.set(0, 0, 1);
      f.normalize();
      const lado = new THREE.Vector3(0, 1, 0).cross(f); // a la derecha de quien mira al mueble
      // Escena completa: más desde arriba, para ver el interior de la sala (las paredes son de una cara).
      // Vista frontal: de frente y a la altura de la vista, como el editor de TeoWin.
      const dir = frontal
        ? f.clone().add(new THREE.Vector3(0, 0.12, 0)).normalize()
        : f.clone().add(lado.multiplyScalar(0.45)).add(new THREE.Vector3(0, m ? 0.55 : 1.1, 0)).normalize();
      camera.position.copy(centro).add(dir.multiplyScalar(frontal ? dist * 0.7 : dist));
      controls.target.copy(centro);
      camera.near = Math.max(dist / 200, 1);
      camera.far = dist * 20;
      camera.updateProjectionMatrix();
      controls.update();
      dibujar();
    };

    // Animaciones: un cuadro por vez mientras algo se mueve.
    let raf = 0;
    let ultimo = 0;
    const paso = (ts: number) => {
      const activo = avanzarAnimaciones(grupos, ultimo ? ts - ultimo : 16);
      ultimo = ts;
      dibujar();
      if (activo) raf = requestAnimationFrame(paso);
      else {
        raf = 0;
        ultimo = 0;
      }
    };
    const arrancar = () => {
      if (!raf) {
        ultimo = 0;
        raf = requestAnimationFrame(paso);
      }
    };
    const mover = (indices: number[], abrir: (i: number) => boolean) => {
      fijarObjetivos(grupos, indices, abrir);
      arrancar();
    };
    const alternar = (i: number) => {
      const a = grupos.anims[i];
      if (a) mover([i], () => a.objetivo < 0.5);
    };

    // Tocar un cajón o una hoja la abre / cierra (un toque, no un arrastre).
    const dom = renderer.domElement;
    const raycaster = new THREE.Raycaster();
    let inicio: { x: number; y: number } | null = null;
    const alBajar = (e: PointerEvent) => {
      inicio = { x: e.clientX, y: e.clientY };
    };
    const alSubir = (e: PointerEvent) => {
      const desde = inicio;
      inicio = null;
      if (!desde || Math.hypot(e.clientX - desde.x, e.clientY - desde.y) > 6) return;
      const r = dom.getBoundingClientRect();
      raycaster.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      const hit = raycaster.intersectObject(grupos.modulos, true).find((h) => visibleEnCadena(h.object));
      const a = hit?.object.userData.anim;
      if (typeof a === "number") alternar(a);
    };
    dom.addEventListener("pointerdown", alBajar);
    dom.addEventListener("pointerup", alSubir);

    // Texturas reales de los materiales (por catálogo); si una no está, queda el color liso.
    const loader = new THREE.TextureLoader();
    const texturas: THREE.Texture[] = [];
    let vivo = true;
    for (const [clave, matsClave] of grupos.porClave) {
      loader.load(
        urlTextura(clave),
        (tex) => {
          if (!vivo) return tex.dispose();
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
          texturas.push(tex);
          let conJuntas: THREE.Texture | null = null;
          for (const m of matsClave) {
            if (m.userData.rejilla) conJuntas ??= texturaConJuntas(tex, texturas);
            if (m instanceof THREE.MeshMatcapMaterial) m.matcap = tex;
            else m.map = m.userData.rejilla && conJuntas ? conJuntas : tex;
            m.color.set(0xffffff);
            m.needsUpdate = true;
          }
          dibujar();
        },
        undefined,
        () => {},
      );
    }

    api.current = { encuadrar, grupos, mover, alternar, dibujar };
    ajustar();
    encuadrar(null);

    return () => {
      vivo = false;
      api.current = null;
      if (raf) cancelAnimationFrame(raf);
      dom.removeEventListener("pointerdown", alBajar);
      dom.removeEventListener("pointerup", alSubir);
      texturas.forEach((t) => t.dispose());
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
    aplicarVista(actual.grupos, seleccion, paredes, mesadas);
    actual.encuadrar(seleccion);
  }, [seleccion, paredes, mesadas, escena]);

  // Botón de puertas: cierra → abre la hoja 1 → abre la hoja 2 → … → cierra.
  function ciclarPuertas() {
    const siguiente = (puertaAbierta + 1) % (puertas.length + 1);
    setPuertaAbierta(siguiente);
    api.current?.mover(puertas, (i) => puertas.indexOf(i) === siguiente - 1);
  }
  function alternarBatientes() {
    const abrir = !batientesAbiertas;
    setBatientesAbiertas(abrir);
    api.current?.mover(batientes, () => abrir);
  }
  function alternarCajones() {
    const abrir = !cajonesAbiertos;
    setCajonesAbiertos(abrir);
    api.current?.mover(cajones, () => abrir);
  }

  const etiquetaPuertas =
    puertas.length === 1
      ? puertaAbierta === 0
        ? "Abrir puerta"
        : "Cerrar puerta"
      : puertaAbierta === 0
        ? "Abrir puertas"
        : puertaAbierta < puertas.length
          ? "Siguiente hoja"
          : "Cerrar puertas";

  return (
    <div className="flex h-[calc(100dvh-var(--barra-h))] w-full flex-col bg-background">
      <header className="flex flex-wrap items-center gap-3 border-b px-4 py-2">
        <VolverLink href={volverHref} grande />
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{titulo}</h1>
        {puertas.length > 0 && (
          <button
            type="button"
            onClick={ciclarPuertas}
            className="h-11 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            {etiquetaPuertas}
          </button>
        )}
        {batientes.length > 0 && (
          <button
            type="button"
            onClick={alternarBatientes}
            className="h-11 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            {batientesAbiertas ? "Cerrar puertas" : "Abrir puertas"}
            {puertas.length > 0 ? " batientes" : ""}
          </button>
        )}
        {cajones.length > 0 && (
          <button
            type="button"
            onClick={alternarCajones}
            className="h-11 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            {cajonesAbiertos ? "Cerrar cajones" : "Abrir cajones"}
          </button>
        )}
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
        {hayMesadas && (
          <label className="flex h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={mesadas} onChange={(e) => setMesadas(e.target.checked)} className="size-5" />
            Mesada
          </label>
        )}
        <button
          type="button"
          onClick={() => api.current?.encuadrar(seleccion, true)}
          className="h-11 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted"
        >
          Vista frontal
        </button>
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
          {modulosListados.map((m) => (
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
            Tocá un cajón o una hoja de puerta para abrirla.
          </p>
        </aside>
      </div>
    </div>
  );
}
