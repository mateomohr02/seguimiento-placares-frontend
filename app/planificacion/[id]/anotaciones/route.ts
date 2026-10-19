// La planificación semanal no admite anotaciones; el visor de documentos las consulta
// igual y recibe siempre una lista vacía.
export async function GET() {
  return Response.json({ status: "success", data: [] });
}
