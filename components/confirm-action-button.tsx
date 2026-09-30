"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";

export type ActionResult = { success: true } | { success: false; message: string };

// Botón de acción con confirmación previa (Aceptar / Cancelar). Toda acción
// que modifica datos pasa por acá. Con `requireText` la confirmación además
// exige tipear esa palabra (acciones destructivas, ej. eliminar una orden).
export function ConfirmActionButton({
  label,
  title,
  description,
  run,
  successMessage,
  errorTitle,
  confirmLabel = "Aceptar",
  requireText,
  variant = "outline",
  disabled,
  ariaLabel,
}: {
  label: ReactNode;
  title: string;
  description: ReactNode;
  run: () => Promise<ActionResult>;
  successMessage: string;
  errorTitle: string;
  confirmLabel?: string;
  requireText?: string;
  variant?: "outline" | "destructive" | "default";
  disabled?: boolean;
  /** Para botones que son solo un ícono. */
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [isPending, startTransition] = useTransition();

  const canConfirm = !requireText || typed.trim().toLowerCase() === requireText.toLowerCase();

  function onConfirm() {
    startTransition(async () => {
      const result = await run();
      setOpen(false);
      setTyped("");
      if (!result.success) {
        toast.error(errorTitle, { description: result.message });
        return;
      }
      toast.success(successMessage);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return;
        setOpen(next);
        if (!next) setTyped("");
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm" variant={variant} disabled={disabled} aria-label={ariaLabel} title={ariaLabel}>
            {label}
          </Button>
        }
      />
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {requireText && (
          <div className="flex flex-col gap-2">
            <label htmlFor="confirm-text" className="text-sm">
              Para continuar, escribí <strong>{requireText}</strong>:
            </label>
            <Input
              id="confirm-text"
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={isPending || !canConfirm}
            onClick={onConfirm}
          >
            {isPending ? <LoadingDots /> : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
