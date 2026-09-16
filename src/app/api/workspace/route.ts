import { NextResponse } from "next/server";
import { getRepository } from "@/lib/db";
import { commandSchema } from "@/lib/model";
import { RecordNotFound } from "@/lib/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Next may normalize request.url to localhost internally. Use the incoming Host
// only after restricting it to loopback, and never trust forwarded host headers.
function isLocalRequest(request: Request) {
  const host = request.headers.get("host");
  if (!host || !/^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host))
    return false;
  const origin = request.headers.get("origin");
  return !origin || origin === `http://${host}`;
}

export async function GET(request: Request) {
  if (!isLocalRequest(request))
    return NextResponse.json(
      { error: "Origen no permitido." },
      { status: 403 },
    );
  try {
    return NextResponse.json(await (await getRepository()).snapshot(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("workspace read failed", error);
    return NextResponse.json(
      { error: "No se pudo abrir tu espacio. Intenta recargar la página." },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  if (!isLocalRequest(request))
    return NextResponse.json(
      { error: "Origen no permitido." },
      { status: 403 },
    );
  if (!request.headers.get("content-type")?.includes("application/json"))
    return NextResponse.json({ error: "Se requiere JSON." }, { status: 415 });
  try {
    const body = await request.text();
    if (body.length > 80000)
      return NextResponse.json(
        { error: "El contenido es demasiado largo." },
        { status: 413 },
      );
    let json: unknown;
    try {
      json = JSON.parse(body);
    } catch {
      return NextResponse.json(
        { error: "Contenido inválido." },
        { status: 400 },
      );
    }
    const parsed = commandSchema.safeParse(json);
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Revisa los campos." },
        { status: 400 },
      );
    const repository = await getRepository();
    await repository.execute(parsed.data);
    return NextResponse.json(await repository.snapshot(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof RecordNotFound)
      return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("workspace write failed", error);
    return NextResponse.json(
      { error: "No se pudo guardar. Revisa tu conexión e inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
