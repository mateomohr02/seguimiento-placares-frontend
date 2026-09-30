"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/loading-dots";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createOrdenAction } from "../actions/create-orden.action";
import { CreateOrdenSchema } from "../schemas/create-orden.schema";

type FormInput = z.input<typeof CreateOrdenSchema>;
type FormOutput = z.output<typeof CreateOrdenSchema>;

export function AgregarOrdenDialog() {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(CreateOrdenSchema),
  });

  async function onSubmit(values: FormOutput) {
    const result = await createOrdenAction(values);
    if (!result.success) {
      toast.error("No se pudo agregar la orden", { description: result.message });
      return;
    }
    toast.success(`Orden ${result.orden.numeroOrdenCustom} sincronizada desde TeoWin.`);
    reset();
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger render={<Button>Agregar orden</Button>} />
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Agregar orden</DialogTitle>
            <DialogDescription>
              Sincroniza los pedidos, módulos y piezas de placar de una orden de fabricación desde
              TeoWin (solo lectura).
            </DialogDescription>
          </DialogHeader>

          <Field className="mt-4">
            <FieldLabel htmlFor="codigoOrdenFabricacion">Número de orden de fabricación</FieldLabel>
            <Input
              id="codigoOrdenFabricacion"
              type="number"
              inputMode="numeric"
              placeholder="263500002"
              autoFocus
              {...register("codigoOrdenFabricacion")}
            />
            <FieldError errors={[errors.codigoOrdenFabricacion]} />
          </Field>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <LoadingDots /> : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
