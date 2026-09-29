import { z } from "zod";

// diseño.md Vista 5 — formato esperado: siempre 7 dígitos numéricos.
export const EscanearPiezaSchema = z.object({
  idUnico: z.string().regex(/^\d{7}$/, "El código debe tener 7 dígitos."),
});

export type EscanearPiezaSchemaType = z.infer<typeof EscanearPiezaSchema>;
