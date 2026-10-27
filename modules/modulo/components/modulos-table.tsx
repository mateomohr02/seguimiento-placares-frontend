"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "cn";
import { LineaBadge } from "@/components/linea-badge";
import { EstadoBadge } from "@/components/estado-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CLASES_SIN_SELECCION, useLongPress } from "@/lib/use-long-press";
import type { Modulo } from "../types/modulo.types";
import { PartidaPopup } from "./partida-popup";

function FilaModulo({ modulo, onPartida }: { modulo: Modulo; onPartida: (m: Modulo, fila: HTMLElement | null) => void }) {
  const router = useRouter();
  const fila = useRef<HTMLTableRowElement>(null);
  const abrir = () => onPartida(modulo, fila.current);
  const longPress = useLongPress(abrir);

  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.key === "Enter" && e.shiftKey) || (e.key.toLowerCase() === "i" && !e.ctrlKey && !e.metaKey && !e.altKey)) {
      e.preventDefault();
      abrir();
    } else if (e.key === "Enter" && e.target === e.currentTarget) {
      router.push(`/modulos/${modulo.id}`);
    }
  };

  return (
    <TableRow
      ref={fila}
      tabIndex={0}
      aria-keyshortcuts="Shift+Enter I"
      className={cn("cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring", CLASES_SIN_SELECCION)}
      onKeyDown={onKeyDown}
      onClick={(e) => {
        // Un toque en cualquier parte de la fila entra al despiece (los enlaces ya navegan solos).
        if (!(e.target as HTMLElement).closest("a")) router.push(`/modulos/${modulo.id}`);
      }}
      {...longPress}
    >
      <TableCell className="font-medium">
        <Link href={`/modulos/${modulo.id}`} draggable={false} className="inline-flex min-h-11 items-center hover:underline">
          {modulo.idEscena}
        </Link>
      </TableCell>
      <TableCell>
        <Link href={`/modulos/${modulo.id}`} draggable={false} className="inline-flex min-h-11 items-center hover:underline">
          {modulo.descripcion}
        </Link>
      </TableCell>
      <TableCell>{modulo.linea && <LineaBadge linea={modulo.linea} />}</TableCell>
      <TableCell>{modulo.despieceTiposCount}</TableCell>
      <TableCell>
        <EstadoBadge estado={modulo.estado} />
      </TableCell>
    </TableRow>
  );
}

export function ModulosTable({ modulos }: { modulos: Modulo[] }) {
  const [abierto, setAbierto] = useState<Modulo | null>(null);
  const volverFoco = useRef<HTMLElement | null>(null);

  if (modulos.length === 0) {
    return <p className="text-sm text-muted-foreground">Este pedido no tiene módulos sincronizados.</p>;
  }

  function abrirPartida(modulo: Modulo, fila: HTMLElement | null) {
    if (!modulo.partida) {
      toast("Sin partida cargada", { description: `Módulo ${modulo.idEscena}` });
      return;
    }
    volverFoco.current = fila;
    setAbierto(modulo);
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Línea</TableHead>
            <TableHead>Piezas</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modulos.map((modulo) => (
            <FilaModulo key={modulo.id} modulo={modulo} onPartida={abrirPartida} />
          ))}
        </TableBody>
      </Table>
      <p className="text-xs text-muted-foreground">
        Mantené presionado un módulo para ver su partida (con teclado: Shift+Enter o «I» sobre la fila).
      </p>
      <PartidaPopup modulo={abierto} onClose={() => setAbierto(null)} volverFoco={volverFoco} />
    </>
  );
}
