import { proxyJson } from "@/lib/api/proxy-json";

// Operarios del área (los configura técnica).
export async function PUT(req: Request) {
  return proxyJson("/planillas/operarios", { method: "PUT", body: await req.text() });
}
