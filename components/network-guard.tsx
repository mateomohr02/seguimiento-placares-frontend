"use client";

import { useEffect, useRef, useState } from "react";
import { ServerOffIcon, WifiOffIcon } from "lucide-react";
import { LoadingDots } from "@/components/loading-dots";

// Comprobador de red: el dispositivo tiene que estar conectado a la red de
// Neostone SA (la del servidor). Un navegador no puede leer el nombre del
// Wi-Fi, así que se comprueba lo que importa: que el servidor de la app sea
// alcanzable. Consulta /red/estado cada pocos segundos; si no responde (Wi-Fi
// caído, otra red, servidor apagado) cubre la app con un aviso hasta que
// vuelva. Se exigen 2 fallos seguidos para no parpadear por un pedido perdido.
const INTERVALO_MS = 5000;
const TIMEOUT_MS = 4000;
const FALLOS_PARA_CORTAR = 2;

type Estado = "ok" | "sin-red" | "sin-backend";

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>("ok");
  const fallos = useRef(0);

  useEffect(() => {
    let cancelado = false;

    async function comprobar() {
      let resultado: Estado;
      if (!navigator.onLine) {
        resultado = "sin-red";
      } else {
        try {
          const res = await fetch("/red/estado", {
            cache: "no-store",
            signal: AbortSignal.timeout(TIMEOUT_MS),
          });
          const data = (await res.json()) as { backend?: boolean };
          resultado = res.ok && data.backend ? "ok" : "sin-backend";
        } catch {
          resultado = "sin-red";
        }
      }
      if (cancelado) return;

      if (resultado === "ok") {
        fallos.current = 0;
        setEstado("ok");
      } else {
        fallos.current += 1;
        if (fallos.current >= FALLOS_PARA_CORTAR) setEstado(resultado);
      }
    }

    const timer = setInterval(comprobar, INTERVALO_MS);
    const alCambiarRed = () => void comprobar();
    window.addEventListener("online", alCambiarRed);
    window.addEventListener("offline", alCambiarRed);
    return () => {
      cancelado = true;
      clearInterval(timer);
      window.removeEventListener("online", alCambiarRed);
      window.removeEventListener("offline", alCambiarRed);
    };
  }, []);

  return (
    <>
      {children}
      {estado !== "ok" && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="network-guard-title"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background p-6 text-center"
        >
          {estado === "sin-red" ? (
            <WifiOffIcon className="size-14 text-gold" />
          ) : (
            <ServerOffIcon className="size-14 text-gold" />
          )}
          <h2 id="network-guard-title" className="text-xl font-semibold">
            {estado === "sin-red"
              ? "No estás conectado a la red de Neostone SA"
              : "No se puede comunicar con el servidor"}
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {estado === "sin-red"
              ? "Conectá este dispositivo al Wi-Fi de Neostone SA para seguir usando la app."
              : "Estás en la red, pero el servidor no responde. Avisá a sistemas si no se recupera."}
          </p>
          <div className="flex items-center gap-2 text-sm text-gold">
            Reintentando <LoadingDots />
          </div>
        </div>
      )}
    </>
  );
}
