"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DeleteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/loading-dots";
import { loginAction } from "../actions/login.action";

const MAX_DIGITOS = 10;
const MIN_DIGITOS = 4;

// Pantalla de PIN pensada para tablet: teclado numérico propio (no abre el
// teclado del sistema) y también acepta el teclado físico.
export function LoginForm() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, startTransition] = useTransition();

  const ingresar = useCallback(
    (valor: string) => {
      if (valor.length < MIN_DIGITOS) {
        setError(`El PIN tiene al menos ${MIN_DIGITOS} dígitos.`);
        return;
      }
      setError(null);
      startTransition(async () => {
        const r = await loginAction(valor);
        if (r.success) {
          router.replace("/");
          router.refresh();
        } else {
          setError(r.message);
          setPin("");
        }
      });
    },
    [router],
  );

  const agregar = useCallback((d: string) => {
    setError(null);
    setPin((p) => (p.length < MAX_DIGITOS ? p + d : p));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (pendiente) return;
      if (/^\d$/.test(e.key)) agregar(e.key);
      else if (e.key === "Backspace") setPin((p) => p.slice(0, -1));
      else if (e.key === "Enter") ingresar(pin);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [agregar, ingresar, pendiente, pin]);

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-xl font-semibold">Seguimiento Productivo</h1>
        <p className="text-sm text-muted-foreground">Ingresá tu PIN</p>
      </div>

      <div className="flex h-6 items-center gap-3" aria-label={`${pin.length} dígitos ingresados`} role="status">
        {pin.length === 0 ? (
          <span className="text-muted-foreground">——</span>
        ) : (
          Array.from(pin).map((_, i) => <span key={i} className="size-4 rounded-full bg-primary" />)
        )}
      </div>

      <p role="alert" className="min-h-5 text-center text-sm text-destructive">
        {error}
      </p>

      <div className="grid w-full grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <Button key={d} variant="outline" className="h-16 text-2xl" disabled={pendiente} onClick={() => agregar(d)}>
            {d}
          </Button>
        ))}
        <Button
          variant="ghost"
          className="h-16"
          aria-label="Borrar"
          disabled={pendiente || pin.length === 0}
          onClick={() => setPin((p) => p.slice(0, -1))}
        >
          <DeleteIcon className="size-6" />
        </Button>
        <Button variant="outline" className="h-16 text-2xl" disabled={pendiente} onClick={() => agregar("0")}>
          0
        </Button>
        <Button className="h-16" disabled={pendiente || pin.length < MIN_DIGITOS} onClick={() => ingresar(pin)}>
          {pendiente ? <LoadingDots /> : "Ingresar"}
        </Button>
      </div>
    </div>
  );
}
