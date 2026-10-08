export interface PlanoPedido {
  id: string;
  pedido_id: string;
  nombre: string;
  nombre_archivo: string;
  mime: string;
  tamano: number;
  creado_en: string;
  /** Módulo del pedido al que corresponde el plano (opcional). */
  modulo: { id: string; idEscena: number; descripcion: string } | null;
}

export const esImagen = (mime: string) => mime.startsWith("image/");
