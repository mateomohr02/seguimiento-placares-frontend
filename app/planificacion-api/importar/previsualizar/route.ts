// Recibe el .xlsx (multipart/form-data, campo `archivo`) y lo reenvía al backend, que lo interpreta sin escribir nada. Route Handler (no
// Server Action) porque los Server Actions limitan el body a 1 MB; el límite del archivo es de 5 MB y el del buffer de proxy.ts es de 10 MB.
import { authHeaders } from "@/lib/auth/sesion";

const API_URL = process.env.API_URL ?? "http://localhost:4000/api";
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  let entrada: FormData;
  try {
    entrada = await req.formData();
  } catch {
    return Response.json({ message: "No se pudo leer el archivo enviado." }, { status: 400 });
  }
  const archivo = entrada.get("archivo");
  if (!(archivo instanceof File)) return Response.json({ message: "Elegí el archivo Excel (.xlsx)." }, { status: 400 });
  if (archivo.size > MAX_BYTES) return Response.json({ message: "El archivo supera los 5 MB." }, { status: 413 });

  const salida = new FormData();
  salida.append("archivo", archivo, archivo.name);
  try {
    // Sin Content-Type: fetch arma el multipart con su boundary.
    const res = await fetch(`${API_URL}/planificacion/importar/previsualizar`, {
      method: "POST",
      headers: await authHeaders(),
      body: salida,
      cache: "no-store",
    });
    const body = await res.json().catch(() => null);
    return Response.json(body ?? { message: "Respuesta inválida del servidor." }, { status: res.status });
  } catch {
    return Response.json({ message: "No se pudo comunicar con el servidor." }, { status: 502 });
  }
}
