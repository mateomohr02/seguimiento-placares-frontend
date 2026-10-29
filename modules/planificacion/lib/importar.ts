import type { ConfirmarImportacionInput, FilaImportada, HojaImportada, ModoImportacion } from "../types/planificacion.types";

export const MAX_BYTES_EXCEL = 5 * 1024 * 1024;

export const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** Hoja que se puede cargar: tiene planificación de destino y no fue omitida. */
export const cargable = (h: HojaImportada) => !h.omitida && h.planificacion !== null;

/** Filas que se mandan al servidor: las que tienen pedido o quedaron sin pedido (el servidor decide qué hacer con estas últimas). */
export const enviables = (h: HojaImportada): FilaImportada[] => h.filas.filter((f) => f.estado === "OK" || f.estado === "SIN_PEDIDO");

export interface Conteo {
  total: number;
  ok: number;
  sinPedido: number;
  duplicadas: number;
  invalidas: number;
}

export function contar(filas: FilaImportada[]): Conteo {
  const c: Conteo = { total: filas.length, ok: 0, sinPedido: 0, duplicadas: 0, invalidas: 0 };
  for (const f of filas) {
    if (f.estado === "OK") c.ok++;
    else if (f.estado === "SIN_PEDIDO") c.sinPedido++;
    else if (f.estado === "DUPLICADA") c.duplicadas++;
    else c.invalidas++;
  }
  return c;
}

/** «38 filas: 35 con pedido, 3 sin pedido, 1 duplicada» (solo nombra lo que no es cero). */
export function textoConteo(c: Conteo): string {
  const partes = [`${c.ok} con pedido`];
  if (c.sinPedido) partes.push(`${c.sinPedido} sin pedido`);
  if (c.duplicadas) partes.push(plural(c.duplicadas, "duplicada", "duplicadas"));
  if (c.invalidas) partes.push(plural(c.invalidas, "inválida", "inválidas"));
  return `${plural(c.total, "fila", "filas")}: ${partes.join(", ")}`;
}

/** Cuerpo de POST /planificacion/importar/confirmar. `decisiones`: clave de planificación → modo (las que faltan o se cancelaron no se mandan). */
export function armarConfirmacion(
  semana: string,
  hojas: HojaImportada[],
  decisiones: Record<string, ModoImportacion | "cancelar">,
  sinPedido: "cargar" | "excluir",
): ConfirmarImportacionInput {
  const salida: ConfirmarImportacionInput["hojas"] = [];
  for (const h of hojas) {
    const plan = h.planificacion;
    if (!cargable(h) || !plan) continue;
    const modo = h.existente.filas > 0 ? decisiones[plan.clave] : "agregar";
    if (modo !== "pisar" && modo !== "agregar") continue;
    const filas = enviables(h).map((f) => {
      const o: ConfirmarImportacionInput["hojas"][number]["filas"][number] = { cliente: f.cliente, n_tw: f.n_tw };
      if (f.dia) o.dia = f.dia;
      if (f.modelo) o.modelo = f.modelo;
      if (plan.clave === "CALIDAD") {
        if (f.modulos !== null) o.modulos = f.modulos;
      } else {
        if (f.color) o.color = f.color;
        if (f.compromiso) o.compromiso = f.compromiso;
      }
      if (f.observaciones) o.observaciones = f.observaciones;
      return o;
    });
    if (filas.length === 0) continue; // sin filas para cargar no se toca la planificación (menos aún se pisa)
    salida.push({ plantilla: plan.clave, modo, filas });
  }
  return { semana, sin_pedido: sinPedido, hojas: salida };
}
