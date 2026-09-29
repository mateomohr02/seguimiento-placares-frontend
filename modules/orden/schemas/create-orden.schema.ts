import { z } from "zod";

export const CreateOrdenSchema = z.object({
  codigoOrdenFabricacion: z.coerce
    .number({ error: "Ingresá el número de orden de fabricación." })
    .int("El número de orden debe ser un entero.")
    .positive("El número de orden debe ser positivo."),
});

export type CreateOrdenSchemaType = z.infer<typeof CreateOrdenSchema>;
